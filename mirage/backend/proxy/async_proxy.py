import asyncio
import hashlib
import logging
import os
import time
from datetime import datetime, timezone
from typing import Any, Optional

import httpx

from anomaly.anomaly_engine import ANOMALY_THRESHOLD_ENGAGE, ANOMALY_THRESHOLD_SUSPECT
from anomaly.feature_extractor import extract_features
from deception.deception_engine import DeceptionEngine
from deception.persona_profiles import MITRE_CATEGORY_MAP, PERSONA_MAP
from patterns.known_bad import check_patterns
from proxy.session_ledger import SessionState
from telemetry.event_schemas import EventType, TelemetryEvent

logger = logging.getLogger(__name__)

PROXY_PORT = 8080
TARGET_URL = os.getenv("TARGET_URL", "http://localhost:9000")

_deception_engine: Optional[DeceptionEngine] = None


def _get_deception_engine() -> DeceptionEngine:
    global _deception_engine
    if _deception_engine is None:
        _deception_engine = DeceptionEngine()
    return _deception_engine


def _mask_ip(ip: str) -> str:
    parts = ip.split(".")
    if len(parts) == 4:
        return ".".join(parts[:3]) + ".xxx"
    return ip + ".xxx"


def _compute_session_id(ip: str, user_agent: str) -> str:
    raw = f"{ip}:{user_agent}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _read_http_request(reader: asyncio.StreamReader) -> Optional[dict]:
    try:
        header_data = b""
        while b"\r\n\r\n" not in header_data:
            chunk = await asyncio.wait_for(reader.read(4096), timeout=10.0)
            if not chunk:
                return None
            header_data += chunk
            if len(header_data) > 65536:
                return None

        header_part, _, body_start = header_data.partition(b"\r\n\r\n")
        lines = header_part.decode("utf-8", errors="replace").split("\r\n")
        if not lines:
            return None

        request_line = lines[0]
        parts = request_line.split(" ", 2)
        if len(parts) < 2:
            return None
        method = parts[0]
        url = parts[1] if len(parts) > 1 else "/"

        headers: dict[str, str] = {}
        for line in lines[1:]:
            if ": " in line:
                k, _, v = line.partition(": ")
                headers[k.lower()] = v

        content_length = int(headers.get("content-length", 0))
        body = body_start
        remaining = content_length - len(body_start)
        if remaining > 0:
            extra = await asyncio.wait_for(reader.read(min(remaining, 1048576)), timeout=5.0)
            body += extra

        user_agent = headers.get("user-agent", "")
        full_text = header_part.decode("utf-8", errors="replace") + body.decode("utf-8", errors="replace")

        return {
            "method": method,
            "url": url,
            "headers": headers,
            "body": body,
            "user_agent": user_agent,
            "content_length": content_length,
            "full_text": full_text,
            "raw_headers": header_part + b"\r\n\r\n",
        }
    except (asyncio.TimeoutError, Exception) as exc:
        logger.debug("Request parse error: %s", exc)
        return None


async def _forward_to_backend(raw_request: dict) -> str:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            target = TARGET_URL.rstrip("/") + raw_request["url"]
            resp = await client.request(
                method=raw_request["method"],
                url=target,
                headers={k: v for k, v in raw_request["headers"].items()
                         if k not in ("host", "content-length")},
                content=raw_request["body"],
            )
            status_line = f"HTTP/1.1 {resp.status_code} OK\r\n"
            resp_headers = "".join(f"{k}: {v}\r\n" for k, v in resp.headers.items())
            return status_line + resp_headers + "\r\n" + resp.text
    except Exception as exc:
        logger.debug("Forward error: %s", exc)
        return (
            "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nServer: Apache/2.2.34\r\n\r\n"
            "<html><body><h1>Welcome</h1></body></html>"
        )


def _http_response_to_bytes(response_text: str) -> bytes:
    if not response_text.startswith("HTTP/"):
        response_text = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n" + response_text
    return response_text.encode("utf-8", errors="replace")


async def _handle_connection(
    reader: asyncio.StreamReader,
    writer: asyncio.StreamWriter,
    app: Any,
) -> None:
    try:
        peer = writer.get_extra_info("peername")
        client_ip = peer[0] if peer else "0.0.0.0"

        raw_request = await _read_http_request(reader)
        if not raw_request:
            writer.close()
            return

        session_id = _compute_session_id(client_ip, raw_request["user_agent"])
        ledger = app.state.ledger
        broadcaster = app.state.broadcaster
        anomaly_engine = app.state.anomaly_engine

        # Capture prior arrival time before get_or_create refreshes last_seen,
        # so the timing-burstiness feature sees the real inter-arrival gap.
        _existing = await ledger.get_session(session_id)
        _prev_seen = _existing.last_seen if _existing else None
        _now_ts = time.time()
        request_times = [_prev_seen, _now_ts] if _prev_seen is not None else [_now_ts]

        session = await ledger.get_or_create(session_id, client_ip)
        await ledger.append_content_length(session_id, raw_request["content_length"])

        masked_ip = _mask_ip(client_ip)

        await broadcaster.emit(TelemetryEvent(
            event_type=EventType.CONNECTION,
            timestamp=_now_iso(),
            session_id=session_id,
            source_ip_masked=masked_ip,
            anomaly_score=0.0,
            new_state=session.state.value,
        ))

        deception_engine = _get_deception_engine()

        if session.state == SessionState.DECEPTION_ENGAGED:
            attacker_msg = raw_request["full_text"][:500]
            response_text = await deception_engine.respond(session, attacker_msg)
            await ledger.append_transcript(session_id, {"role": "user", "content": attacker_msg})
            await ledger.append_transcript(session_id, {"role": "assistant", "content": response_text})

            await broadcaster.emit(TelemetryEvent(
                event_type=EventType.INTERACTION,
                timestamp=_now_iso(),
                session_id=session_id,
                source_ip_masked=masked_ip,
                anomaly_score=session.anomaly_scores[-1] if session.anomaly_scores else 0.0,
                persona_assigned=session.persona,
                attacker_message=attacker_msg[:200],
                deception_reply=response_text[:200],
            ))

            writer.write(_http_response_to_bytes(response_text))
            await writer.drain()
            writer.close()
            return

        matched, category = check_patterns(raw_request["full_text"], raw_request["user_agent"])

        if matched and category:
            prev_state = session.state.value
            await ledger.update_state(session_id, SessionState.DECEPTION_ENGAGED)
            persona_key = PERSONA_MAP.get(category, "apache_persona")
            await ledger.set_persona(session_id, persona_key)

            for tag in MITRE_CATEGORY_MAP.get(category, []):
                await ledger.add_mitre_tag(session_id, tag)

            session = await ledger.get_or_create(session_id, client_ip)
            attacker_msg = raw_request["full_text"][:500]
            response_text = await deception_engine.respond(session, attacker_msg)
            await ledger.append_transcript(session_id, {"role": "user", "content": attacker_msg})
            await ledger.append_transcript(session_id, {"role": "assistant", "content": response_text})

            await broadcaster.emit(TelemetryEvent(
                event_type=EventType.STATE_TRANSITION,
                timestamp=_now_iso(),
                session_id=session_id,
                source_ip_masked=masked_ip,
                previous_state=prev_state,
                new_state=SessionState.DECEPTION_ENGAGED.value,
                persona_assigned=persona_key,
                layer_triggered=1,
                mitre_tags=MITRE_CATEGORY_MAP.get(category, []),
            ))
            await broadcaster.emit(TelemetryEvent(
                event_type=EventType.DECEPTION_ENGAGE,
                timestamp=_now_iso(),
                session_id=session_id,
                source_ip_masked=masked_ip,
                persona_assigned=persona_key,
                attacker_message=attacker_msg[:200],
                deception_reply=response_text[:200],
                layer_triggered=1,
                mitre_tags=MITRE_CATEGORY_MAP.get(category, []),
            ))

            writer.write(_http_response_to_bytes(response_text))
            await writer.drain()
            writer.close()
            return

        features = extract_features(
            raw_request["method"],
            raw_request["url"],
            raw_request["body"],
            raw_request["content_length"],
            session.content_length_history,
            headers=raw_request["headers"],
            request_times=request_times,
        )
        score = anomaly_engine.score(features)
        await ledger.append_score(session_id, score)

        await broadcaster.emit(TelemetryEvent(
            event_type=EventType.ANOMALY_SCORE,
            timestamp=_now_iso(),
            session_id=session_id,
            source_ip_masked=masked_ip,
            anomaly_score=score,
            new_state=session.state.value,
        ))

        if score > ANOMALY_THRESHOLD_ENGAGE:
            prev_state = session.state.value
            await ledger.update_state(session_id, SessionState.DECEPTION_ENGAGED)
            await ledger.set_persona(session_id, "apache_persona")
            await ledger.add_mitre_tag(session_id, "TA0043")

            session = await ledger.get_or_create(session_id, client_ip)
            attacker_msg = raw_request["full_text"][:500]
            response_text = await deception_engine.respond(session, attacker_msg)
            await ledger.append_transcript(session_id, {"role": "user", "content": attacker_msg})
            await ledger.append_transcript(session_id, {"role": "assistant", "content": response_text})

            await broadcaster.emit(TelemetryEvent(
                event_type=EventType.STATE_TRANSITION,
                timestamp=_now_iso(),
                session_id=session_id,
                source_ip_masked=masked_ip,
                anomaly_score=score,
                previous_state=prev_state,
                new_state=SessionState.DECEPTION_ENGAGED.value,
                persona_assigned="apache_persona",
                layer_triggered=2,
            ))

            writer.write(_http_response_to_bytes(response_text))

        elif score > ANOMALY_THRESHOLD_SUSPECT:
            prev_state = session.state.value
            if session.state == SessionState.CLEAN:
                await ledger.update_state(session_id, SessionState.SUSPECT)
                await broadcaster.emit(TelemetryEvent(
                    event_type=EventType.STATE_TRANSITION,
                    timestamp=_now_iso(),
                    session_id=session_id,
                    source_ip_masked=masked_ip,
                    anomaly_score=score,
                    previous_state=prev_state,
                    new_state=SessionState.SUSPECT.value,
                    layer_triggered=2,
                ))
            response_text = await _forward_to_backend(raw_request)
            writer.write(_http_response_to_bytes(response_text))
        else:
            response_text = await _forward_to_backend(raw_request)
            writer.write(_http_response_to_bytes(response_text))

        await writer.drain()
    except Exception as exc:
        logger.error("Connection handler error: %s", exc)
    finally:
        try:
            writer.close()
        except Exception:
            pass


async def start_proxy(app: Any) -> None:
    async def handler(reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> None:
        await _handle_connection(reader, writer, app)

    server = await asyncio.start_server(handler, "0.0.0.0", PROXY_PORT)
    logger.info("Proxy listening on port %d", PROXY_PORT)
    async with server:
        await server.serve_forever()

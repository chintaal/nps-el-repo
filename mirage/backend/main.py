import asyncio
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

load_dotenv()

logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

REPORT_DIR = Path(os.getenv("REPORT_OUTPUT_DIR", "/app/reports"))
REPORT_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from anomaly.anomaly_engine import AnomalyEngine
    from anomaly.traffic_bootstrap import generate_baseline
    from proxy.async_proxy import start_proxy
    from proxy.session_ledger import SessionLedger
    from telemetry.telemetry_ws import TelemetryBroadcaster

    app.state.anomaly_engine = AnomalyEngine()
    baseline = generate_baseline(n_samples=2000)
    app.state.anomaly_engine.train(baseline)
    logger.info("Anomaly engine trained on %d baseline samples", len(baseline))

    app.state.ledger = SessionLedger()

    app.state.broadcaster = TelemetryBroadcaster()
    broadcast_task = asyncio.create_task(app.state.broadcaster.broadcast_loop())

    proxy_task = asyncio.create_task(start_proxy(app))
    logger.info("Proxy task launched on port 8080")

    yield

    proxy_task.cancel()
    broadcast_task.cancel()
    try:
        await proxy_task
    except asyncio.CancelledError:
        pass
    try:
        await broadcast_task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="Project Mirage", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── WebSocket ──────────────────────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    broadcaster = app.state.broadcaster
    await broadcaster.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        broadcaster.disconnect(websocket)
    except Exception:
        broadcaster.disconnect(websocket)


# ── Health ─────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "trained": getattr(app.state, "anomaly_engine", None) is not None
        and app.state.anomaly_engine._trained,
    }


# ── Sessions ───────────────────────────────────────────────────────────────────

def _session_to_dict(s: Any) -> dict:
    return {
        "session_id": s.session_id,
        "source_ip": s.source_ip,
        "state": s.state.value,
        "anomaly_scores": s.anomaly_scores[-20:],
        "persona": s.persona,
        "mitre_tags": s.mitre_tags,
        "transcript": s.transcript[-20:],
        "created_at": s.created_at,
        "last_seen": s.last_seen,
    }


@app.get("/api/sessions")
async def list_sessions() -> list[dict]:
    sessions = await app.state.ledger.get_all_active()
    return [_session_to_dict(s) for s in sessions]


@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str) -> JSONResponse:
    session = await app.state.ledger.get_session(session_id)
    if not session:
        return JSONResponse(status_code=404, content={"error": "Session not found"})
    return JSONResponse(content=_session_to_dict(session))


@app.post("/api/sessions/{session_id}/terminate")
async def terminate_session(session_id: str) -> dict:
    from proxy.session_ledger import SessionState
    from telemetry.event_schemas import EventType, TelemetryEvent

    session = await app.state.ledger.get_session(session_id)
    if not session:
        return {"error": "Session not found"}

    await app.state.ledger.terminate(session_id)
    await app.state.broadcaster.emit(TelemetryEvent(
        event_type=EventType.SESSION_TERMINATED,
        timestamp=datetime.now(timezone.utc).isoformat(),
        session_id=session_id,
        source_ip_masked=session.source_ip,
        new_state="TERMINATED",
    ))
    return {"status": "terminated", "session_id": session_id}


@app.post("/api/sessions/{session_id}/report")
async def generate_report(session_id: str) -> JSONResponse:
    from reporter.forensic_reporter import generate_forensic_report
    from telemetry.event_schemas import EventType, TelemetryEvent

    session = await app.state.ledger.get_session(session_id)
    if not session:
        return JSONResponse(status_code=404, content={"error": "Session not found"})

    try:
        report_path = await generate_forensic_report(session)
        await app.state.broadcaster.emit(TelemetryEvent(
            event_type=EventType.REPORT_READY,
            timestamp=datetime.now(timezone.utc).isoformat(),
            session_id=session_id,
            source_ip_masked=session.source_ip,
        ))
        return JSONResponse(content={
            "status": "ready",
            "filename": report_path.name,
            "download_url": f"/api/reports/{report_path.name}",
        })
    except Exception as exc:
        logger.error("Report generation failed: %s", exc)
        return JSONResponse(status_code=500, content={"error": str(exc)})


@app.get("/api/reports/{filename}")
async def download_report(filename: str) -> FileResponse:
    path = REPORT_DIR / filename
    if not path.exists() or not path.is_file():
        return JSONResponse(status_code=404, content={"error": "Report not found"})
    return FileResponse(path=str(path), media_type="application/pdf", filename=filename)

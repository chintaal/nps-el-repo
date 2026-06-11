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
    from advisor.advisor_engine import AdvisorEngine
    from anomaly.anomaly_engine import AnomalyEngine
    from anomaly.traffic_bootstrap import generate_baseline
    from proxy.async_proxy import start_proxy
    from proxy.session_ledger import SessionLedger
    from telemetry.telemetry_ws import TelemetryBroadcaster

    engine = AnomalyEngine()
    baseline = generate_baseline(n_samples=2000)
    engine.train(baseline)
    logger.info("Anomaly engine trained on %d baseline samples", len(baseline))

    # Platt-calibrate the ensemble on a labeled benign+malicious split so the
    # [0,1] score is a real probability and the thresholds are meaningful.
    try:
        from research.corpus import labeled_feature_set

        Xc, yc = labeled_feature_set(800, 800, seed=11)
        engine.calibrate(Xc, yc)
        logger.info("Anomaly ensemble calibrated (Platt) on %d labeled samples", len(yc))
    except Exception as exc:  # noqa: BLE001
        logger.warning("Calibration skipped: %s", exc)

    app.state.anomaly_engine = engine
    app.state.ledger = SessionLedger()
    app.state.advisor = AdvisorEngine()

    app.state.broadcaster = TelemetryBroadcaster()
    broadcast_task = asyncio.create_task(app.state.broadcaster.broadcast_loop())

    proxy_task = asyncio.create_task(start_proxy(app))
    logger.info("Proxy task launched on port 8080")

    # Pre-compute the research cache (benchmark + latency + deception efficacy)
    # so the Research Lab renders measured numbers immediately. Non-fatal.
    app.state.research = {"status": "computing"}
    asyncio.create_task(_build_research_cache(app))

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


# ── Research cache (benchmark + latency + deception efficacy) ─────────────────

async def _build_research_cache(app: FastAPI) -> None:
    """Compute the (expensive-ish) research artifacts once, off the request path."""
    import time as _time

    from deception.efficacy import evaluate_personas
    from research.benchmark import run_benchmark
    from research.latency import run_latency

    try:
        t0 = _time.time()
        engine = app.state.anomaly_engine
        benchmark = run_benchmark(engine)
        latency = run_latency(engine)
        efficacy = await evaluate_personas()
        app.state.research = {
            "status": "ready",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "compute_seconds": round(_time.time() - t0, 2),
            "detection": benchmark,
            "latency": latency,
            "deception": efficacy,
        }
        logger.info(
            "Research cache ready: ROC-AUC=%.3f, p95=%.2fms, mean DQI=%.1f",
            benchmark["roc_auc"], latency["p95_ms"], efficacy["mean_dqi"],
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Research cache build failed: %s", exc)
        app.state.research = {"status": "error", "error": str(exc)}


@app.get("/api/research")
async def get_research() -> JSONResponse:
    return JSONResponse(content=getattr(app.state, "research", {"status": "unavailable"}))


# ── Live metrics aggregate (over the session ledger) ─────────────────────────

def _aggregate_metrics(sessions: list[Any]) -> dict:
    from collections import Counter

    from deception.persona_profiles import TACTIC_NAMES

    states = Counter(s.state.value for s in sessions)
    personas = Counter(s.persona for s in sessions if s.persona)
    tactic_counts: Counter = Counter()
    for s in sessions:
        for tag in s.mitre_tags:
            tactic_counts[tag] += 1

    all_scores = [sc for s in sessions for sc in s.anomaly_scores]
    interactions = sum(len(s.transcript) // 2 for s in sessions)

    def _stat(fn, default=0.0):
        return round(float(fn(all_scores)), 4) if all_scores else default

    import numpy as _np

    return {
        "total_sessions": len(sessions),
        "by_state": dict(states),
        "engaged": states.get("DECEPTION_ENGAGED", 0),
        "suspect": states.get("SUSPECT", 0),
        "terminated": states.get("TERMINATED", 0),
        "personas": dict(personas),
        "mitre_tactics_covered": len(tactic_counts),
        "mitre_tactics": [
            {"id": t, "name": TACTIC_NAMES.get(t, t), "count": c}
            for t, c in tactic_counts.most_common()
        ],
        "total_interactions": interactions,
        "anomaly": {
            "samples": len(all_scores),
            "mean": _stat(_np.mean),
            "max": _stat(_np.max),
            "p90": round(float(_np.percentile(all_scores, 90)), 4) if all_scores else 0.0,
        },
    }


@app.get("/api/metrics")
async def get_metrics() -> JSONResponse:
    sessions = await app.state.ledger.get_all()
    return JSONResponse(content=_aggregate_metrics(sessions))


# ── JANUS advisor ────────────────────────────────────────────────────────────

@app.post("/api/advisor")
async def advisor(payload: dict) -> JSONResponse:
    role = payload.get("role", "ceo")
    message = payload.get("message", "")
    if not message:
        return JSONResponse(status_code=400, content={"error": "message required"})
    sessions = await app.state.ledger.get_all()
    metrics = _aggregate_metrics(sessions)
    result = await app.state.advisor.advise(role, message, metrics)
    return JSONResponse(content=result)


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

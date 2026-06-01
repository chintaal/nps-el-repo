# Project Mirage

AI-powered adversary deception and forensic triage system.

## Quick Start

```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
docker compose up --build
```

| Service | URL |
|---|---|
| Dashboard | http://localhost:3000 |
| API / WebSocket | http://localhost:8000 |
| Proxy (honeypot ingress) | http://localhost:8080 |

## Demo

```bash
# Terminal 1: start services
docker compose up --build

# Terminal 2: verify
python scripts/health_check.py

# Terminal 3: run attack simulation
bash scripts/attack_sim.sh
```

## Architecture

- **Proxy (:8080)** — raw TCP reverse proxy; tri-layer analysis on every request
- **Layer I** — deterministic regex (SQLi, path traversal, scanner UAs, etc.)
- **Layer II** — Isolation Forest anomaly score on 3-feature vector
- **LLM Engine** — 4 deception personas powered by Claude Sonnet
- **Telemetry** — WebSocket broadcast to dashboard at `/ws`
- **Reporter** — PDF forensic reports with MITRE ATT&CK mapping

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | required | Anthropic API key |
| `ANOMALY_THRESHOLD_ENGAGE` | `0.62` | Score above which deception engages |
| `ANOMALY_THRESHOLD_SUSPECT` | `0.55` | Score above which session becomes SUSPECT |
| `LOG_LEVEL` | `INFO` | Logging verbosity |

# Project Mirage — NPS Network Security Lab

Autonomous Cyber Deception & Multimodal Threat Triage System.

## What This Project Does

Detects adversarial traffic, traps attackers in a LLM-synthesized honeypot environment, and produces MITRE ATT&CK-mapped forensic reports — all in under 100 ms per request.

## Tech Stack

- **Backend**: Python 3.11 + FastAPI
- **Frontend**: Next.js 14 + Tailwind CSS
- **LLM**: Anthropic Claude API (`claude-sonnet-4-20250514`) — 4 deception personas
- **Anomaly Detection**: Isolation Forest (unsupervised, no labelled corpus)
- **Launch**: `docker compose up --build`

## Directory Layout

```
mirage/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── main.py               FastAPI app + WebSocket broadcast
│   ├── proxy/                TCP reverse proxy — honeypot ingress (:8080)
│   ├── anomaly/              Isolation Forest scorer
│   ├── deception/            LLM persona engine (4 personas)
│   ├── patterns/             Layer I deterministic regex detectors
│   ├── reporter/             PDF forensic report generator
│   └── telemetry/            WebSocket event bus
└── frontend/                 Real-time threat dashboard
```

## Detection Pipeline

```
Request → Layer I (regex) → Layer II (Isolation Forest) → LLM Engine → Telemetry
```

- **Layer I**: Deterministic: SQLi, path traversal, scanner UAs, header injection
- **Layer II**: Unsupervised anomaly score on 3-feature vector (entropy, rate, payload shape)
- **LLM Engine**: If score > `ANOMALY_THRESHOLD_ENGAGE`, Claude generates a deception response under one of 4 personas (vulnerable DB, SSH server, admin panel, file share)
- **Reporter**: MITRE ATT&CK tactic + technique mapping → PDF forensic report

## Services

| Service | URL |
|---|---|
| Dashboard | http://localhost:3000 |
| API / WebSocket | http://localhost:8000 |
| Proxy (honeypot ingress) | http://localhost:8080 |

## Launch

```bash
cp mirage/.env.example mirage/.env
# Add ANTHROPIC_API_KEY to mirage/.env
docker compose -f mirage/docker-compose.yml up --build
```

## Demo

```bash
# Terminal 1
docker compose -f mirage/docker-compose.yml up --build

# Terminal 2 — health check
python mirage/scripts/health_check.py

# Terminal 3 — attack simulation
bash mirage/scripts/attack_sim.sh
```

## Key Design Rules

- Sub-100 ms response latency is non-negotiable — LLM call is async/non-blocking
- All deception persona prompts live in `deception/prompts/` — never inline
- Anomaly thresholds are env-configurable (`ANOMALY_THRESHOLD_ENGAGE`, `ANOMALY_THRESHOLD_SUSPECT`)
- WebSocket broadcast is fire-and-forget — never block request path on dashboard delivery

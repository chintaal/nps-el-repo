---
name: project-mirage
description: Project Mirage is a full-stack AI honeypot/deception system — Python FastAPI backend + Next.js 14 dashboard
metadata:
  type: project
---

Project Mirage lives at `mirage/` in the repo root. Full end-to-end implementation was built from CLAUDE.md spec.

**Why:** NPS lab / EL submission — AI-powered adversary deception demo.

**Architecture:**
- Backend FastAPI on :8000, raw TCP proxy on :8080 (same process)
- Three detection layers: regex patterns → Isolation Forest → LLM deception
- Four LLM personas: Apache, PostgreSQL, Flask/.env, API Gateway
- Telemetry via WebSocket `/ws` to Next.js dashboard
- Anomaly engine uses **dynamic calibration** (not hardcoded range from spec) — baseline has bimodal distribution (55% GET entropy=0, 45% POST entropy~3.5)
- cl_zscore capped at 5.0 to prevent overflow on all-zero session histories

**How to apply:** When working in this repo, the main implementation is in `mirage/`. Single-command launch is `docker compose up --build` from `mirage/`.

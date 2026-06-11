"""Deception efficacy — an LLM-as-judge measure of whether the trap *worked*.

The deception engine produces in-character replies, but nothing measured whether
they were convincing. This module scores a finished transcript on believability,
in-character consistency, and intel extraction, and aggregates a per-persona
**Deception Quality Index (DQI)**.

Used two ways:
- offline, over canned demo transcripts, to populate the Research Lab at startup
  (so the panel is populated even before live traffic);
- on demand for a real session.

Reuses the same ``AsyncAnthropic`` pattern as the deception engine and fails
gracefully (heuristic fallback) when no API key is configured.
"""

from __future__ import annotations

import json
import logging
import os
import re

import anthropic

from deception.persona_profiles import PERSONA_LABELS
from deception.prompts.judge import JUDGE_PROMPT

logger = logging.getLogger(__name__)

_MODEL = "claude-sonnet-4-20250514"

_LEAK = re.compile(r"(I am an AI|as an AI|language model|I'm sorry|I cannot|Claude|Anthropic)", re.I)

# Small canned transcripts so the Research Lab has data without live traffic.
_DEMO_TRANSCRIPTS: dict[str, list[dict]] = {
    "postgres_persona": [
        {"role": "user", "content": "' OR 1=1; SELECT * FROM users--"},
        {"role": "assistant", "content": "id | username | role\n----+----------+-------\n 1 | admin | superuser\n 2 | jdoe | analyst\n 3 | alice.wang | analyst\n(3 rows)"},
        {"role": "user", "content": "SELECT password_hash FROM users WHERE username='admin'"},
        {"role": "assistant", "content": "password_hash\n--------------------------------\n$2b$12$Kq9.../fabricated\n(1 row)"},
    ],
    "apache_persona": [
        {"role": "user", "content": "GET /../../etc/passwd HTTP/1.1\nUser-Agent: nikto"},
        {"role": "assistant", "content": "HTTP/1.1 404 Not Found\nServer: Apache/2.2.34 (Unix)\nContent-Type: text/html\n\n<html><head><title>404 Not Found</title></head><body><h1>Not Found</h1></body></html>"},
        {"role": "user", "content": "GET /.env HTTP/1.1"},
        {"role": "assistant", "content": "HTTP/1.1 200 OK\nServer: Apache/2.2.34 (Unix)\n\nDB_HOST=10.0.2.14\nDB_USER=svc_reports\nDB_PASS=changeme_2019"},
    ],
    "env_file_persona": [
        {"role": "user", "content": "GET /admin HTTP/1.1"},
        {"role": "assistant", "content": "HTTP/1.1 500 Internal Server Error\nWerkzeug Debugger\nTraceback (most recent call last):\n  File \"app.py\", line 42, in admin\n    db.connect(os.environ['DB_URI'])"},
    ],
    "api_gateway_persona": [
        {"role": "user", "content": "GET /exec?cmd=id HTTP/1.1"},
        {"role": "assistant", "content": '{"error":"unauthorized","code":401,"trace_id":"a1f9-...","gateway":"legacy-rest/0.1"}'},
    ],
}


def _heuristic_score(transcript: list[dict]) -> dict:
    """Deterministic fallback when no LLM is available."""
    replies = [t["content"] for t in transcript if t.get("role") == "assistant"]
    if not replies:
        return {"believability": 0, "consistency": 0, "intel_extraction": 0, "broke_character": False, "rationale": "No deception turns."}
    leaked = any(_LEAK.search(r) for r in replies)
    believ = 55 + min(len(replies) * 8, 30)
    return {
        "believability": 0 if leaked else believ,
        "consistency": 0 if leaked else 80,
        "intel_extraction": min(40 + len(transcript) * 8, 90),
        "broke_character": leaked,
        "rationale": "Heuristic estimate (LLM judge unavailable).",
    }


class EfficacyJudge:
    def __init__(self) -> None:
        self._enabled = bool(os.getenv("ANTHROPIC_API_KEY"))
        self._client = anthropic.AsyncAnthropic() if self._enabled else None

    async def score_transcript(self, transcript: list[dict]) -> dict:
        if not self._client:
            return _heuristic_score(transcript)
        convo = "\n".join(f'{t.get("role")}: {t.get("content")}' for t in transcript)
        try:
            resp = await self._client.messages.create(
                model=_MODEL,
                max_tokens=400,
                system=JUDGE_PROMPT,
                messages=[{"role": "user", "content": convo}],
            )
            text = resp.content[0].text.strip()
            text = re.sub(r"^```(json)?|```$", "", text, flags=re.M).strip()
            data = json.loads(text)
            return data
        except Exception as exc:  # noqa: BLE001
            logger.warning("Efficacy judge fell back to heuristic: %s", exc)
            return _heuristic_score(transcript)

    @staticmethod
    def dqi(scores: dict) -> float:
        """Deception Quality Index — weighted blend in [0, 100]."""
        if scores.get("broke_character"):
            return round(0.4 * scores.get("intel_extraction", 0), 1)
        return round(
            0.4 * scores.get("believability", 0)
            + 0.35 * scores.get("consistency", 0)
            + 0.25 * scores.get("intel_extraction", 0),
            1,
        )


async def evaluate_personas() -> dict:
    """Score the canned demo transcripts per persona — startup seed for the UI."""
    judge = EfficacyJudge()
    results = []
    for persona, transcript in _DEMO_TRANSCRIPTS.items():
        scores = await judge.score_transcript(transcript)
        results.append({
            "persona": persona,
            "label": PERSONA_LABELS.get(persona, persona),
            "dqi": EfficacyJudge.dqi(scores),
            **{k: scores.get(k) for k in ("believability", "consistency", "intel_extraction", "broke_character", "rationale")},
        })
    results.sort(key=lambda r: r["dqi"], reverse=True)
    mean_dqi = round(sum(r["dqi"] for r in results) / len(results), 1) if results else 0.0
    return {"mean_dqi": mean_dqi, "judge_live": judge._enabled, "personas": results}

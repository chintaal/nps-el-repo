"""JANUS advisor engine — role-lensed strategic guidance grounded in live state.

Reuses the same ``AsyncAnthropic`` pattern as the deception engine. Each request
selects a role system prompt and injects a JSON snapshot of the live metrics so
answers reference the actual running deployment. Degrades to a deterministic
fallback (no crash) when ``ANTHROPIC_API_KEY`` is absent.
"""

from __future__ import annotations

import json
import logging
import os

import anthropic

from advisor.prompts import (
    ceo_role,
    cto_role,
    investor_role,
    mentor_role,
    product_role,
)

logger = logging.getLogger(__name__)

_MODEL = "claude-sonnet-4-20250514"

ROLE_PROMPTS: dict[str, str] = {
    "ceo": ceo_role.SYSTEM_PROMPT,
    "cto": cto_role.SYSTEM_PROMPT,
    "product": product_role.SYSTEM_PROMPT,
    "investor": investor_role.SYSTEM_PROMPT,
    "mentor": mentor_role.SYSTEM_PROMPT,
}

ROLE_LABELS: dict[str, str] = {
    "ceo": "CEO",
    "cto": "CTO",
    "product": "Product Lead",
    "investor": "Investor",
    "mentor": "Mentor",
}

_FALLBACKS: dict[str, str] = {
    "ceo": "The wedge is real: convert intrusions into intelligence faster than anyone. Lead with the <100ms deception narrative and one design-partner SOC.\n▶ Next: lock a single lighthouse customer before broadening scope.",
    "cto": "Hold the latency line; the ensemble + Platt calibration is the differentiator. Watch false positives as traffic diversifies and keep the LLM call off the request path.\n▶ Next: add drift monitoring on the anomaly score distribution.",
    "product": "Operators want the deception→intel→report loop to feel instant. Optimise the moment an analyst sees a MITRE-mapped dossier appear.\n▶ Next: make report generation one click from any engaged session.",
    "investor": "Show me detection AUC and cost-per-engaged-session before market size. Defensibility is the adversary-intel data flywheel, not the model.\n▶ Next: prove ROC-AUC and a believable DQI on a real engagement.",
    "mentor": "You have a working system most teams only slideware. Don't scale prematurely — deepen one loop until it's undeniable.\n▶ Next: write down the one metric that proves Mirage works, then move it.",
}


class AdvisorEngine:
    def __init__(self) -> None:
        self._enabled = bool(os.getenv("ANTHROPIC_API_KEY"))
        self._client = anthropic.AsyncAnthropic() if self._enabled else None
        self._model = _MODEL

    @property
    def live(self) -> bool:
        return self._enabled

    async def advise(self, role: str, message: str, metrics: dict | None = None) -> dict:
        role = (role or "ceo").lower()
        system = ROLE_PROMPTS.get(role, ROLE_PROMPTS["ceo"])
        label = ROLE_LABELS.get(role, "CEO")

        if not self._client:
            return {"role": role, "label": label, "reply": _FALLBACKS.get(role, _FALLBACKS["ceo"]), "live": False}

        snapshot = json.dumps(metrics or {}, separators=(",", ":"))
        user_content = (
            f"LIVE SYSTEM SNAPSHOT (JSON):\n{snapshot}\n\n"
            f"Founder question: {message}"
        )
        try:
            resp = await self._client.messages.create(
                model=self._model,
                max_tokens=500,
                system=system,
                messages=[{"role": "user", "content": user_content}],
            )
            return {"role": role, "label": label, "reply": resp.content[0].text.strip(), "live": True}
        except Exception as exc:  # noqa: BLE001
            logger.error("Advisor error: %s", exc)
            return {"role": role, "label": label, "reply": _FALLBACKS.get(role, _FALLBACKS["ceo"]), "live": False}

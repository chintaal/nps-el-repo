import asyncio
import logging
import re
from typing import Any

import anthropic

from deception.prompts import (
    apache_persona,
    api_gateway_persona,
    env_file_persona,
    postgres_persona,
)

logger = logging.getLogger(__name__)

PROMPT_MAP: dict[str, str] = {
    "apache_persona": apache_persona.SYSTEM_PROMPT,
    "postgres_persona": postgres_persona.SYSTEM_PROMPT,
    "env_file_persona": env_file_persona.SYSTEM_PROMPT,
    "api_gateway_persona": api_gateway_persona.SYSTEM_PROMPT,
}

FALLBACK_RESPONSES: dict[str, str] = {
    "apache_persona": (
        "HTTP/1.1 200 OK\r\nServer: Apache/2.2.34\r\nContent-Type: text/html\r\n\r\n"
        "<html><head><title>Index of /</title></head><body>"
        "<h1>Index of /</h1><hr><pre>Name               Last Modified        Size</pre>"
        "<hr></body></html>"
    ),
    "postgres_persona": "ERROR: connection refused\nDETAIL: Server is busy\nHINT: Try again later.",
    "env_file_persona": "500 Internal Server Error",
    "api_gateway_persona": '{"error": "503 Service Unavailable", "message": "Gateway timeout"}',
}

NATURAL_LANGUAGE_GUARD = re.compile(
    r"(I am an AI|as an AI|I cannot|I'm sorry|Claude|Anthropic|language model|assistant)",
    re.I,
)


class DeceptionEngine:
    def __init__(self) -> None:
        self._client = anthropic.AsyncAnthropic()
        self._model = "claude-sonnet-4-20250514"

    def _build_messages(self, transcript: list[dict], current_request_text: str) -> list[dict]:
        messages: list[dict] = []
        for entry in transcript[-10:]:  # keep last 10 turns for context window
            if entry.get("role") in ("user", "assistant"):
                messages.append({"role": entry["role"], "content": entry["content"]})
        messages.append({"role": "user", "content": current_request_text})
        return messages

    async def respond(self, session: Any, request_text: str) -> str:
        persona_key = session.persona or "apache_persona"
        system_prompt = PROMPT_MAP.get(persona_key, PROMPT_MAP["apache_persona"])
        messages = self._build_messages(session.transcript, request_text)

        try:
            response = await asyncio.wait_for(
                self._call_api(system_prompt, messages),
                timeout=2.0,
            )
        except asyncio.TimeoutError:
            logger.warning("LLM timeout for session %s", session.session_id)
            return FALLBACK_RESPONSES.get(persona_key, "HTTP/1.1 503 Service Unavailable")
        except Exception as exc:
            logger.error("LLM error: %s", exc)
            return FALLBACK_RESPONSES.get(persona_key, "HTTP/1.1 503 Service Unavailable")

        if NATURAL_LANGUAGE_GUARD.search(response):
            logger.warning("Natural language guard triggered — using fallback")
            return FALLBACK_RESPONSES.get(persona_key, "")

        return response

    async def _call_api(self, system: str, messages: list[dict]) -> str:
        result = await self._client.messages.create(
            model=self._model,
            max_tokens=1000,
            system=system,
            messages=messages,
        )
        return result.content[0].text

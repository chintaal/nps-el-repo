import asyncio
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class SessionState(str, Enum):
    CLEAN = "CLEAN"
    SUSPECT = "SUSPECT"
    DECEPTION_ENGAGED = "DECEPTION_ENGAGED"
    TERMINATED = "TERMINATED"


@dataclass
class Session:
    session_id: str
    source_ip: str
    state: SessionState = SessionState.CLEAN
    anomaly_scores: list[float] = field(default_factory=list)
    persona: Optional[str] = None
    transcript: list[dict] = field(default_factory=list)
    mitre_tags: list[str] = field(default_factory=list)
    content_length_history: list[int] = field(default_factory=list)
    created_at: float = field(default_factory=time.time)
    last_seen: float = field(default_factory=time.time)


class SessionLedger:
    def __init__(self) -> None:
        self._sessions: dict[str, Session] = {}
        self._lock = asyncio.Lock()

    async def get_or_create(self, session_id: str, ip: str) -> Session:
        async with self._lock:
            if session_id not in self._sessions:
                self._sessions[session_id] = Session(
                    session_id=session_id, source_ip=ip
                )
            session = self._sessions[session_id]
            session.last_seen = time.time()
            return session

    async def update_state(self, session_id: str, new_state: SessionState) -> None:
        async with self._lock:
            if session_id in self._sessions:
                self._sessions[session_id].state = new_state
                self._sessions[session_id].last_seen = time.time()

    async def set_persona(self, session_id: str, persona: str) -> None:
        async with self._lock:
            if session_id in self._sessions:
                self._sessions[session_id].persona = persona

    async def append_transcript(self, session_id: str, entry: dict) -> None:
        async with self._lock:
            if session_id in self._sessions:
                self._sessions[session_id].transcript.append(entry)

    async def append_score(self, session_id: str, score: float) -> None:
        async with self._lock:
            if session_id in self._sessions:
                self._sessions[session_id].anomaly_scores.append(score)

    async def append_content_length(self, session_id: str, length: int) -> None:
        async with self._lock:
            if session_id in self._sessions:
                self._sessions[session_id].content_length_history.append(length)

    async def add_mitre_tag(self, session_id: str, tag: str) -> None:
        async with self._lock:
            if session_id in self._sessions:
                if tag not in self._sessions[session_id].mitre_tags:
                    self._sessions[session_id].mitre_tags.append(tag)

    async def terminate(self, session_id: str) -> None:
        await self.update_state(session_id, SessionState.TERMINATED)

    async def get_session(self, session_id: str) -> Optional[Session]:
        async with self._lock:
            return self._sessions.get(session_id)

    async def get_all_active(self) -> list[Session]:
        async with self._lock:
            return [
                s for s in self._sessions.values()
                if s.state != SessionState.TERMINATED
            ]

    async def get_all(self) -> list[Session]:
        async with self._lock:
            return list(self._sessions.values())

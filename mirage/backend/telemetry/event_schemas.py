from enum import Enum
from typing import Optional

from pydantic import BaseModel


class EventType(str, Enum):
    CONNECTION = "CONNECTION"
    ANOMALY_SCORE = "ANOMALY_SCORE"
    STATE_TRANSITION = "STATE_TRANSITION"
    DECEPTION_ENGAGE = "DECEPTION_ENGAGE"
    INTERACTION = "INTERACTION"
    SESSION_TERMINATED = "SESSION_TERMINATED"
    REPORT_READY = "REPORT_READY"


class TelemetryEvent(BaseModel):
    event_type: EventType
    timestamp: str
    session_id: str
    source_ip_masked: str
    anomaly_score: float = 0.0
    previous_state: Optional[str] = None
    new_state: Optional[str] = None
    persona_assigned: Optional[str] = None
    attacker_message: Optional[str] = None
    deception_reply: Optional[str] = None
    mitre_tags: list[str] = []
    layer_triggered: Optional[int] = None

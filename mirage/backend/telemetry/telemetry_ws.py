import asyncio
import logging

from fastapi import WebSocket, WebSocketDisconnect

from telemetry.event_schemas import TelemetryEvent

logger = logging.getLogger(__name__)


class TelemetryBroadcaster:
    def __init__(self) -> None:
        self._clients: set[WebSocket] = set()
        self._queue: asyncio.Queue = asyncio.Queue(maxsize=1000)

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self._clients.add(ws)
        logger.info("WS client connected; total=%d", len(self._clients))

    def disconnect(self, ws: WebSocket) -> None:
        self._clients.discard(ws)
        logger.info("WS client disconnected; total=%d", len(self._clients))

    async def emit(self, event: TelemetryEvent) -> None:
        try:
            self._queue.put_nowait(event.model_dump_json())
        except asyncio.QueueFull:
            logger.warning("Telemetry queue full — dropping event")

    async def broadcast_loop(self) -> None:
        while True:
            payload = await self._queue.get()
            dead: set[WebSocket] = set()
            for client in list(self._clients):
                try:
                    await client.send_text(payload)
                except Exception:
                    dead.add(client)
            self._clients -= dead

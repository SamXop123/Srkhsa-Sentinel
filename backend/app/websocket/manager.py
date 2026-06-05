import logging
import json
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger("SuRakshaSentinel.Websocket")

class ConnectionManager:
    def __init__(self):
        # Maps circular_id -> list of WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, circular_id: str):
        await websocket.accept()
        if circular_id not in self.active_connections:
            self.active_connections[circular_id] = []
        self.active_connections[circular_id].append(websocket)
        logger.info(f"WebSocket client connected to circular_id: {circular_id}")

    def disconnect(self, websocket: WebSocket, circular_id: str):
        if circular_id in self.active_connections:
            if websocket in self.active_connections[circular_id]:
                self.active_connections[circular_id].remove(websocket)
                logger.info(f"WebSocket client disconnected from circular_id: {circular_id}")
            if not self.active_connections[circular_id]:
                del self.active_connections[circular_id]

    async def broadcast_to_circular(self, circular_id: str, message: dict):
        if circular_id in self.active_connections:
            payload = json.dumps(message)
            for connection in self.active_connections[circular_id]:
                try:
                    await connection.send_text(payload)
                except Exception as e:
                    logger.error(f"Failed to send log message over WS: {e}")

manager = ConnectionManager()

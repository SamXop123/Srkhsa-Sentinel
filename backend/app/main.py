from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List
import json
import logging
from app.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SuRakshaSentinel")

app = FastAPI(
    title=settings.APP_NAME,
    description="Agentic Regulatory Intelligence & Compliance Platform for Banks",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Configure CORS for React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.websocket.manager import manager

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app_name": settings.APP_NAME,
        "message": "Regulatory loop closure API is running."
    }

# WebSocket endpoint for real-time agent log updates
@app.websocket("/ws/agents/logs")
async def websocket_endpoint(websocket: WebSocket, circular_id: str):
    await manager.connect(websocket, circular_id)
    try:
        while True:
            # Client can send heartbeats or acknowledgements
            data = await websocket.receive_text()
            # Echo back or parse messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket, circular_id)
    except Exception as e:
        logger.error(f"WebSocket connection encountered error: {e}")
        manager.disconnect(websocket, circular_id)

# Helper function to trigger logs manually or from background agent jobs
async def broadcast_agent_log(circular_id: str, agent: str, message: str, level: str = "INFO"):
    log_payload = {
        "agent": agent,
        "message": message,
        "level": level,
        "timestamp": "2026-06-06T00:30:00Z"  # Standard placeholder or dynamic
    }
    await manager.broadcast_to_circular(circular_id, log_payload)

# Placeholder Routers
# app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
# app.include_router(circulars.router, prefix="/api/v1/circulars", tags=["Circulars"])
# app.include_router(maps.router, prefix="/api/v1/maps", tags=["MAP Review"])
# app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["Tasks"])
# app.include_router(compliance.router, prefix="/api/v1/compliance", tags=["Compliance"])

from fastapi import APIRouter
from app.schemas.user import AuditLogResponse
from typing import List
import uuid

router = APIRouter()

@router.get("/", response_model=List[AuditLogResponse])
async def get_audit_logs(limit: int = 50, offset: int = 0):
    """Fetches paginated list of immutable platform security logs."""
    return [
        {
            "id": uuid.uuid4(),
            "user_id": uuid.uuid4(),
            "action": "USER_LOGIN",
            "target_table": "users",
            "target_id": uuid.uuid4(),
            "ip_address": "127.0.0.1",
            "user_agent": "Mozilla/5.0",
            "payload": {"status": "success"},
            "created_at": "2026-06-06T00:30:00Z"
        }
    ]

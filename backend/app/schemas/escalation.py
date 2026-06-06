from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class EscalationBase(BaseModel):
    task_id: UUID
    level: int
    trigger_reason: str

class EscalationCreate(EscalationBase):
    pass

class EscalationResponse(EscalationBase):
    id: UUID
    status: str
    resolved_by: Optional[UUID] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

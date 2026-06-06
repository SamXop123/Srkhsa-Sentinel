from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class MapBase(BaseModel):
    regulation_id: UUID
    description: str
    risk_classification: str
    department_id: UUID

class MapCreate(MapBase):
    pass

class MapResponse(MapBase):
    id: UUID
    status: str
    created_by_agent: bool
    auditor_review_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

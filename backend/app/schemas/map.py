from pydantic import BaseModel
from uuid import UUID
from datetime import datetime, date
from typing import Optional, Dict, Any

class MapBase(BaseModel):
    regulation_id: UUID
    task_title: str
    task_description: str
    department: str
    priority: str
    risk_level: str
    deadline: date
    required_outcome: str
    verification_method: str
    confidence_score: float
    reasoning: Optional[Dict[str, str]] = None

class MapCreate(MapBase):
    pass

class MapUpdate(BaseModel):
    task_title: Optional[str] = None
    task_description: Optional[str] = None
    department: Optional[str] = None
    priority: Optional[str] = None
    risk_level: Optional[str] = None
    deadline: Optional[date] = None
    required_outcome: Optional[str] = None
    verification_method: Optional[str] = None
    confidence_score: Optional[float] = None
    status: Optional[str] = None

class MapResponse(MapBase):
    id: UUID
    status: str
    created_at: datetime
    updated_at: datetime
    # Joined helper attributes for frontend display convenience
    regulation_ref: Optional[str] = None
    regulation_title: Optional[str] = None

    class Config:
        from_attributes = True

from pydantic import BaseModel
from uuid import UUID
from datetime import datetime, date
from typing import Optional, Dict, Any

class CircularBase(BaseModel):
    title: str
    source_org: str
    circular_number: str
    publication_date: date
    file_path: str

class CircularCreate(CircularBase):
    pass

class CircularResponse(CircularBase):
    id: UUID
    status: str
    raw_metadata: Dict[str, Any]
    uploaded_by: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RegulationBase(BaseModel):
    clause_number: str
    clause_title: Optional[str] = None
    clause_text: str
    penalty_details: Optional[str] = None
    effective_date: date

class RegulationCreate(RegulationBase):
    circular_id: UUID

class RegulationResponse(RegulationBase):
    id: UUID
    circular_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class AgentLogBase(BaseModel):
    agent_name: str
    log_level: str
    message: str

class AgentLogResponse(AgentLogBase):
    id: UUID
    circular_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

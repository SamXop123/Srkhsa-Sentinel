from pydantic import BaseModel
from uuid import UUID
from datetime import datetime, date
from typing import Optional, Dict, Any

class TaskBase(BaseModel):
    map_id: UUID
    title: str
    description: str
    department_id: UUID
    assigned_to_user_id: Optional[UUID] = None
    deadline: date

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: UUID
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TaskEvidenceBase(BaseModel):
    file_name: str
    file_path: str
    metadata_info: Dict[str, Any] = {}

class TaskEvidenceCreate(TaskEvidenceBase):
    task_id: UUID
    uploaded_by: UUID

class TaskEvidenceResponse(TaskEvidenceBase):
    id: UUID
    task_id: UUID
    uploaded_by: UUID
    uploaded_at: datetime

    class Config:
        from_attributes = True

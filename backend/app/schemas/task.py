from pydantic import BaseModel
from uuid import UUID
from datetime import datetime, date
from typing import Optional, Dict, Any, List

class TaskBase(BaseModel):
    map_id: UUID
    department_id: UUID
    assigned_to: str
    title: str
    description: str
    priority: str
    deadline: date
    status: str

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[date] = None
    status: Optional[str] = None

class TaskEvidenceResponse(BaseModel):
    id: UUID
    task_id: UUID
    file_name: str
    file_path: str
    uploaded_by: UUID
    uploaded_at: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class TaskResponse(TaskBase):
    id: UUID
    assignment_reasoning: Dict[str, str] = {}
    comments: List[Dict[str, Any]] = []
    created_at: datetime
    updated_at: datetime
    # Joined attributes for detailed UI rendering
    regulation_title: Optional[str] = None
    regulation_summary: Optional[str] = None
    regulator: Optional[str] = None
    regulation_ref: Optional[str] = None
    regulation_effective_date: Optional[date] = None
    regulation_penalty: Optional[str] = None
    map_outcome: Optional[str] = None
    map_verification: Optional[str] = None
    department_name: Optional[str] = None
    evidences: List[TaskEvidenceResponse] = []

    class Config:
        from_attributes = True

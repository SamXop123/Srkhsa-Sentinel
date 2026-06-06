from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    manager_id: Optional[UUID] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

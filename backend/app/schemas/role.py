from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleResponse(RoleBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
from typing import Optional

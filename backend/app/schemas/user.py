from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, Any

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role_id: UUID
    department_id: Optional[UUID] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AuditLogBase(BaseModel):
    action: str
    target_table: str
    target_id: Optional[UUID] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    payload: Dict[str, Any] = {}

class AuditLogResponse(AuditLogBase):
    id: UUID
    user_id: Optional[UUID]
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationBase(BaseModel):
    title: str
    message: str
    type: str
    read_status: bool = False

class NotificationResponse(NotificationBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

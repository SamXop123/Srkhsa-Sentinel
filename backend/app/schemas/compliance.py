from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class ComplianceRecordBase(BaseModel):
    task_id: UUID
    auditor_id: UUID
    status: str # Verified, Rejected
    verification_notes: str

class ComplianceRecordCreate(ComplianceRecordBase):
    pass

class ComplianceRecordResponse(ComplianceRecordBase):
    id: UUID
    verified_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True

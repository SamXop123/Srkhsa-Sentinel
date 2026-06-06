import uuid
from datetime import datetime, date
from typing import List, Optional
from sqlalchemy import String, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base import Base

class Task(Base):
    __tablename__ = "tasks"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    map_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("maps.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    department_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=False)
    assigned_to_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="Pending", index=True) # Pending, In_Progress, Under_Review, Completed, Overdue
    deadline: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    map: Mapped["Map"] = relationship(back_populates="tasks")
    department: Mapped["Department"] = relationship(back_populates="tasks")
    assignee: Mapped[Optional["User"]] = relationship(back_populates="assigned_tasks")
    evidences: Mapped[List["TaskEvidence"]] = relationship(back_populates="task", cascade="all, delete-orphan")
    compliance_records: Mapped[List["ComplianceRecord"]] = relationship(back_populates="task", cascade="all, delete-orphan")
    escalations: Mapped[List["Escalation"]] = relationship(back_populates="task", cascade="all, delete-orphan")


class TaskEvidence(Base):
    __tablename__ = "task_evidences"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    metadata_info: Mapped[dict] = mapped_column(JSONB, default=dict)

    # Relationships
    task: Mapped["Task"] = relationship(back_populates="evidences")

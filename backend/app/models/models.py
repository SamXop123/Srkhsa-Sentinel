import uuid
from datetime import datetime, date
from typing import List, Optional
from sqlalchemy import String, Boolean, DateTime, Date, ForeignKey, Integer, JSON, Text, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base import Base

class Role(Base):
    __tablename__ = "roles"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    users: Mapped[List["User"]] = relationship(back_populates="role")


class User(Base):
    __tablename__ = "users"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=False)
    department_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    role: Mapped["Role"] = relationship(back_populates="users")
    department: Mapped[Optional["Department"]] = relationship(foreign_keys=[department_id], back_populates="members")
    uploaded_circulars: Mapped[List["Circular"]] = relationship(back_populates="uploader")
    assigned_tasks: Mapped[List["Task"]] = relationship(back_populates="assignee")
    verified_records: Mapped[List["ComplianceRecord"]] = relationship(back_populates="auditor")
    audit_logs: Mapped[List["AuditLog"]] = relationship(back_populates="user")
    notifications: Mapped[List["Notification"]] = relationship(back_populates="user")


class Department(Base):
    __tablename__ = "departments"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    manager_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", use_alter=True, name="fk_dept_manager"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    members: Mapped[List["User"]] = relationship(foreign_keys=[User.department_id], back_populates="department")
    maps: Mapped[List["Map"]] = relationship(back_populates="department")
    tasks: Mapped[List["Task"]] = relationship(back_populates="department")


class Circular(Base):
    __tablename__ = "circulars"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    source_org: Mapped[str] = mapped_column(String(50), nullable=False, index=True) # RBI, SEBI, FIU-IND
    circular_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    publication_date: Mapped[date] = mapped_column(Date, nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="Ingested", index=True) # Ingested, Parsing, Parsed, MAP_Generated, Dispatched, Failed
    raw_metadata: Mapped[dict] = mapped_column(JSONB, default=dict)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    uploader: Mapped["User"] = relationship(back_populates="uploaded_circulars")
    regulations: Mapped[List["Regulation"]] = relationship(back_populates="circular", cascade="all, delete-orphan")
    agent_logs: Mapped[List["AgentLog"]] = relationship(back_populates="circular", cascade="all, delete-orphan")


class Regulation(Base):
    __tablename__ = "regulations"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    circular_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("circulars.id"), nullable=False)
    clause_number: Mapped[str] = mapped_column(String(50), nullable=False)
    clause_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    clause_text: Mapped[str] = mapped_column(Text, nullable=False)
    penalty_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    effective_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    circular: Mapped["Circular"] = relationship(back_populates="regulations")
    maps: Mapped[List["Map"]] = relationship(back_populates="regulation", cascade="all, delete-orphan")


class Map(Base):
    __tablename__ = "maps"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    regulation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("regulations.id"), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    risk_classification: Mapped[str] = mapped_column(String(20), nullable=False, index=True) # High, Medium, Low
    department_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="Pending_Review", index=True) # Pending_Review, Approved, Rejected
    created_by_agent: Mapped[bool] = mapped_column(Boolean, default=True)
    auditor_review_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    regulation: Mapped["Regulation"] = relationship(back_populates="maps")
    department: Mapped["Department"] = relationship(back_populates="maps")
    tasks: Mapped[List["Task"]] = relationship(back_populates="map", cascade="all, delete-orphan")


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
    metadata_info: Mapped[dict] = mapped_column(JSONB, default=dict) # hash checks, file types, size

    # Relationships
    task: Mapped["Task"] = relationship(back_populates="evidences")


class ComplianceRecord(Base):
    __tablename__ = "compliance_records"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    auditor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False) # Verified, Rejected
    verification_notes: Mapped[str] = mapped_column(Text, nullable=False)
    verified_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    task: Mapped["Task"] = relationship(back_populates="compliance_records")
    auditor: Mapped["User"] = relationship(back_populates="verified_records")


class Escalation(Base):
    __tablename__ = "escalations"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    level: Mapped[int] = mapped_column(Integer, nullable=False) # 1, 2, 3
    status: Mapped[str] = mapped_column(String(20), default="Open", index=True) # Open, Resolved
    trigger_reason: Mapped[str] = mapped_column(Text, nullable=False)
    resolved_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    task: Mapped["Task"] = relationship(back_populates="escalations")


class Notification(Base):
    __tablename__ = "notifications"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False) # Task_Assignment, Overdue_Task, Escalation, Audit_Alert
    read_status: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="notifications")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    target_table: Mapped[str] = mapped_column(String(50), nullable=False)
    target_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user: Mapped[Optional["User"]] = relationship(back_populates="audit_logs")


class AgentLog(Base):
    __tablename__ = "agent_logs"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    circular_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("circulars.id"), nullable=False)
    agent_name: Mapped[str] = mapped_column(String(50), nullable=False, index=True) # Scout, Architect, Dispatcher, Auditor
    log_level: Mapped[str] = mapped_column(String(20), default="INFO") # INFO, WARNING, ERROR
    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    circular: Mapped["Circular"] = relationship(back_populates="agent_logs")

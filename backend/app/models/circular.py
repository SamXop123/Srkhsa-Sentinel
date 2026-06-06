import uuid
from datetime import datetime, date
from typing import List, Optional
from sqlalchemy import String, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base import Base

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

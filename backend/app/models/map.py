import uuid
from datetime import datetime, date
from typing import List, Optional
from sqlalchemy import String, Date, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base import Base

class Map(Base):
    __tablename__ = "maps"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    regulation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("regulations.id"), nullable=False)
    task_title: Mapped[str] = mapped_column(String(255), nullable=False)
    task_description: Mapped[str] = mapped_column(Text, nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    priority: Mapped[str] = mapped_column(String(20), nullable=False, index=True) # High, Medium, Low
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False, index=True) # Low, Medium, High, Critical
    deadline: Mapped[date] = mapped_column(Date, nullable=False)
    required_outcome: Mapped[str] = mapped_column(Text, nullable=False)
    verification_method: Mapped[str] = mapped_column(String(255), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    status: Mapped[str] = mapped_column(String(30), default="Pending", index=True) # Pending, Approved, Rejected
    reasoning: Mapped[dict] = mapped_column(JSONB, default=dict) # why_generated, why_department, why_risk, why_verification
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    regulation: Mapped["Regulation"] = relationship(back_populates="maps")
    tasks: Mapped[List["Task"]] = relationship(back_populates="map", cascade="all, delete-orphan")

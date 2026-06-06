import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

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

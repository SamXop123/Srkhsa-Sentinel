from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.repositories.base import BaseRepository
from app.models.models import ComplianceRecord, Task

class ComplianceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.record_repo = BaseRepository(ComplianceRecord, db)
        self.task_repo = BaseRepository(Task, db)

    async def verify_task_compliance(self, task_id: UUID, auditor_id: UUID, status: str, notes: str) -> ComplianceRecord:
        """Audits task evidence submission and writes compliance record."""
        # 1. Update task status
        task = await self.task_repo.get(task_id)
        if task:
            task_status = "Completed" if status == "Verified" else "Pending"
            await self.task_repo.update(task, {"status": task_status})
            
        # 2. Record compliance audit log
        record_data = {
            "task_id": task_id,
            "auditor_id": auditor_id,
            "status": status,
            "verification_notes": notes
        }
        record = await self.record_repo.create(record_data)
        return record

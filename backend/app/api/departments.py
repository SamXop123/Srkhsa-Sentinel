from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.db.session import get_db
from app.models.department import Department
from app.models.task import Task
from app.models.map import Map
from app.models.circular import Circular, Regulation
from app.schemas.task import TaskResponse
from app.api.tasks import map_db_task_to_response
from typing import List, Dict, Any
import uuid
import datetime
import logging

logger = logging.getLogger("SuRakshaSentinel.Api.Departments")
router = APIRouter()

@router.get("/")
async def get_departments(db: AsyncSession = Depends(get_db)):
    """Retrieves standard directory listing of all banking divisions."""
    try:
        stmt = select(Department).order_by(Department.name.asc())
        res = await db.execute(stmt)
        return res.scalars().all()
    except Exception as e:
        logger.error(f"Error fetching departments list: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query departments: {str(e)}"
        )

@router.get("/{id}/dashboard")
async def get_department_dashboard(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Aggregates active task counts, overdue counts, compliance scores, and upcoming deadlines for department views."""
    try:
        # Check department existence
        stmt = select(Department).where(Department.id == id)
        res = await db.execute(stmt)
        dept = res.scalar_one_or_none()
        
        if not dept:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found."
            )
            
        today = datetime.date.today()
        
        # 1. Completed tasks
        completed = await db.scalar(
            select(func.count(Task.id)).where(Task.department_id == id, Task.status == "Completed")
        )
        completed = completed or 0
        
        # 2. Overdue tasks
        overdue = await db.scalar(
            select(func.count(Task.id)).where(
                Task.department_id == id,
                (Task.status == "Overdue") | ((Task.status != "Completed") & (Task.deadline < today))
            )
        )
        overdue = overdue or 0
        
        # 3. Total tasks
        total = await db.scalar(select(func.count(Task.id)).where(Task.department_id == id))
        total = total or 0
        
        # 4. Open tasks
        open_tasks = await db.scalar(
            select(func.count(Task.id)).where(
                Task.department_id == id,
                Task.status.in_(["Pending", "Assigned", "In Progress", "Awaiting Verification"])
            )
        )
        open_tasks = open_tasks or 0
        
        # 5. Compute compliance score
        compliance_score = 100.0
        if total > 0:
            compliance_score = round((completed / total) * 100, 1)
            
        # 6. Fetch upcoming deadlines (due in next 14 days)
        deadline_limit = today + datetime.timedelta(days=14)
        stmt_upcoming = select(
            Task,
            Regulation.title,
            Regulation.summary,
            Circular.circular_number,
            Regulation.effective_date,
            Regulation.penalty_clause,
            Circular.source_org,
            Map.required_outcome,
            Map.verification_method,
            Department.name,
            Task.evidences
        ).join(
            Map, Task.map_id == Map.id
        ).join(
            Regulation, Map.regulation_id == Regulation.id
        ).join(
            Circular, Regulation.circular_id == Circular.id
        ).join(
            Department, Task.department_id == Department.id
        ).where(
            Task.department_id == id,
            Task.status.in_(["Pending", "Assigned", "In Progress"]),
            Task.deadline >= today,
            Task.deadline <= deadline_limit
        ).order_by(Task.deadline.asc())
        
        res_upcoming = await db.execute(stmt_upcoming)
        rows_upcoming = res_upcoming.all()
        
        seen = set()
        upcoming_list = []
        for r in rows_upcoming:
            task_id = r[0].id
            if task_id not in seen:
                seen.add(task_id)
                upcoming_list.append(map_db_task_to_response(r))
                
        return {
            "department_id": str(id),
            "department_name": dept.name,
            "head_name": dept.head_name,
            "email": dept.email,
            "open_tasks": open_tasks,
            "completed_tasks": completed,
            "overdue_tasks": overdue,
            "total_tasks": total,
            "compliance_score": compliance_score,
            "upcoming_deadlines": upcoming_list
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating dashboard metrics for department {id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate department dashboard metrics: {str(e)}"
        )

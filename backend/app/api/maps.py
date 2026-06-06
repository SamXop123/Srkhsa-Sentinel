from fastapi import APIRouter, Depends, HTTPException, status as fastapi_status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.db.session import get_db
from app.models.map import Map
from app.models.circular import Circular, Regulation
from app.schemas.map import MapResponse, MapUpdate
from app.agents.graph import dispatch_graph
from typing import List, Dict, Any
import uuid
import logging
import datetime

logger = logging.getLogger("SuRakshaSentinel.Api.Maps")
router = APIRouter()

async def run_dispatch_workflow_async(map_id: uuid.UUID):
    """Triggers the compiled dispatch workflow in the background."""
    try:
        await dispatch_graph.ainvoke({
            "map_id": str(map_id),
            "task_id": None,
            "notification_id": None,
            "errors": []
        })
    except Exception as e:
        logger.error(f"Failed executing dispatch graph background task: {e}")

@router.get("/", response_model=List[MapResponse])
async def get_maps(db: AsyncSession = Depends(get_db)):
    """Retrieves all generated MAPs joined with regulation title and circular number."""
    try:
        stmt = select(Map, Regulation.title, Circular.circular_number).join(
            Regulation, Map.regulation_id == Regulation.id
        ).join(
            Circular, Regulation.circular_id == Circular.id
        ).order_by(Map.created_at.desc())
        
        result = await db.execute(stmt)
        response_items = []
        
        for item, reg_title, circ_num in result.all():
            response_items.append(
                MapResponse(
                    id=item.id,
                    regulation_id=item.regulation_id,
                    task_title=item.task_title,
                    task_description=item.task_description,
                    department=item.department,
                    priority=item.priority,
                    risk_level=item.risk_level,
                    deadline=item.deadline,
                    required_outcome=item.required_outcome,
                    verification_method=item.verification_method,
                    confidence_score=item.confidence_score,
                    status=item.status,
                    reasoning=item.reasoning,
                    created_at=item.created_at,
                    updated_at=item.updated_at,
                    regulation_ref=circ_num,
                    regulation_title=reg_title
                )
            )
        return response_items
    except Exception as e:
        logger.error(f"Error fetching maps: {e}")
        raise HTTPException(
            status_code=fastapi_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve MAPs: {str(e)}"
        )

@router.get("/metrics")
async def get_map_metrics(db: AsyncSession = Depends(get_db)):
    """Aggregates and returns summary counters for generated MAP items."""
    try:
        total = await db.scalar(select(func.count(Map.id)))
        high_risk = await db.scalar(
            select(func.count(Map.id)).where(Map.risk_level.in_(["High", "Critical"]))
        )
        pending = await db.scalar(select(func.count(Map.id)).where(Map.status == "Pending"))
        approved = await db.scalar(select(func.count(Map.id)).where(Map.status == "Approved"))
        
        return {
            "total_maps": total or 0,
            "high_risk_maps": high_risk or 0,
            "pending_approval": pending or 0,
            "approved_maps": approved or 0
        }
    except Exception as e:
        logger.error(f"Error calculating map metrics: {e}")
        raise HTTPException(
            status_code=fastapi_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate metrics: {str(e)}"
        )

@router.put("/{id}", response_model=MapResponse)
async def update_map(id: uuid.UUID, payload: MapUpdate, db: AsyncSession = Depends(get_db)):
    """Saves inline edits made to a generated MAP item."""
    try:
        stmt = select(Map, Regulation.title, Circular.circular_number).join(
            Regulation, Map.regulation_id == Regulation.id
        ).join(
            Circular, Regulation.circular_id == Circular.id
        ).where(Map.id == id)
        
        res = await db.execute(stmt)
        row = res.one_or_none()
        
        if not row:
            raise HTTPException(
                status_code=fastapi_status.HTTP_404_NOT_FOUND,
                detail="MAP action item not found."
            )
            
        item, reg_title, circ_num = row
        update_data = payload.dict(exclude_unset=True)
        
        for key, val in update_data.items():
            setattr(item, key, val)
            
        item.updated_at = datetime.datetime.utcnow()
        await db.commit()
        await db.refresh(item)
        
        return MapResponse(
            id=item.id,
            regulation_id=item.regulation_id,
            task_title=item.task_title,
            task_description=item.task_description,
            department=item.department,
            priority=item.priority,
            risk_level=item.risk_level,
            deadline=item.deadline,
            required_outcome=item.required_outcome,
            verification_method=item.verification_method,
            confidence_score=item.confidence_score,
            status=item.status,
            reasoning=item.reasoning,
            created_at=item.created_at,
            updated_at=item.updated_at,
            regulation_ref=circ_num,
            regulation_title=reg_title
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating map {id}: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=fastapi_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update MAP: {str(e)}"
        )

@router.post("/{id}/approve", response_model=MapResponse)
async def approve_map(
    id: uuid.UUID, 
    background_tasks: BackgroundTasks, 
    status: str = "Approved", 
    db: AsyncSession = Depends(get_db)
):
    """Updates status parameter of a MAP item (Approved, Rejected, Pending) and triggers dispatch if approved."""
    try:
        if status not in ["Pending", "Approved", "Rejected"]:
            raise HTTPException(
                status_code=fastapi_status.HTTP_400_BAD_REQUEST,
                detail="Invalid status. Allowed values: Pending, Approved, Rejected"
            )
            
        stmt = select(Map, Regulation.title, Circular.circular_number).join(
            Regulation, Map.regulation_id == Regulation.id
        ).join(
            Circular, Regulation.circular_id == Circular.id
        ).where(Map.id == id)
        
        res = await db.execute(stmt)
        row = res.one_or_none()
        
        if not row:
            raise HTTPException(
                status_code=fastapi_status.HTTP_404_NOT_FOUND,
                detail="MAP action item not found."
            )
            
        item, reg_title, circ_num = row
        item.status = status
        item.updated_at = datetime.datetime.utcnow()
        
        await db.commit()
        await db.refresh(item)
        
        # Trigger Dispatcher workflow in background if status is Approved
        if status == "Approved":
            background_tasks.add_task(run_dispatch_workflow_async, id)
            
        return MapResponse(
            id=item.id,
            regulation_id=item.regulation_id,
            task_title=item.task_title,
            task_description=item.task_description,
            department=item.department,
            priority=item.priority,
            risk_level=item.risk_level,
            deadline=item.deadline,
            required_outcome=item.required_outcome,
            verification_method=item.verification_method,
            confidence_score=item.confidence_score,
            status=item.status,
            reasoning=item.reasoning,
            created_at=item.created_at,
            updated_at=item.updated_at,
            regulation_ref=circ_num,
            regulation_title=reg_title
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing status for map {id}: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=fastapi_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to change status: {str(e)}"
        )

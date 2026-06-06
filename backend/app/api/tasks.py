from fastapi import APIRouter, UploadFile, File, Form, status as fastapi_status, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models.task import Task, TaskEvidence
from app.models.map import Map
from app.models.circular import Circular, Regulation
from app.models.department import Department
from app.schemas.task import TaskResponse, TaskEvidenceResponse
from typing import List, Optional
import uuid
import os
import shutil
import logging
import datetime

logger = logging.getLogger("SuRakshaSentinel.Api.Tasks")
router = APIRouter()

EVIDENCE_UPLOAD_DIR = os.path.join("backend", "uploads", "evidences")
os.makedirs(EVIDENCE_UPLOAD_DIR, exist_ok=True)

def map_db_task_to_response(row) -> TaskResponse:
    """Helper mapper function to pack joins into the TaskResponse schema."""
    item, reg_title, reg_sum, reg_num, reg_eff, reg_pen, regulator, map_out, map_ver, dept_name, evidences = row
    
    # Map evidences list
    evidence_schemas = []
    for ev in evidences:
        evidence_schemas.append(
            TaskEvidenceResponse(
                id=ev.id,
                task_id=ev.task_id,
                file_name=ev.file_name,
                file_path=ev.file_path,
                uploaded_by=ev.uploaded_by,
                uploaded_at=ev.uploaded_at,
                notes=ev.notes
            )
        )
        
    return TaskResponse(
        id=item.id,
        map_id=item.map_id,
        department_id=item.department_id,
        assigned_to=item.assigned_to,
        title=item.title,
        description=item.description,
        priority=item.priority,
        deadline=item.deadline,
        status=item.status,
        assignment_reasoning=item.assignment_reasoning or {},
        comments=item.comments or [],
        created_at=item.created_at,
        updated_at=item.updated_at,
        regulation_title=reg_title,
        regulation_summary=reg_sum,
        regulator=regulator,
        regulation_ref=reg_num,
        regulation_effective_date=reg_eff,
        regulation_penalty=reg_pen,
        map_outcome=map_out,
        map_verification=map_ver,
        department_name=dept_name,
        evidences=evidence_schemas
    )

@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    department_id: Optional[uuid.UUID] = None,
    assigned_to: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Retrieves list of active tasks with query filters."""
    try:
        stmt = select(
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
        )
        
        if department_id:
            stmt = stmt.where(Task.department_id == department_id)
        if assigned_to:
            stmt = stmt.where(Task.assigned_to == assigned_to)
        if status:
            stmt = stmt.where(Task.status == status)
            
        stmt = stmt.order_by(Task.created_at.desc())
        result = await db.execute(stmt)
        rows = result.all()
        
        # Deduplicate rows by task ID (due to join with relationship)
        seen = set()
        response_list = []
        for r in rows:
            task_id = r[0].id
            if task_id not in seen:
                seen.add(task_id)
                response_list.append(map_db_task_to_response(r))
        return response_list
    except Exception as e:
        logger.error(f"Error querying tasks: {e}")
        raise HTTPException(
            status_code=fastapi_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query tasks: {str(e)}"
        )

@router.get("/{id}", response_model=TaskResponse)
async def get_task(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Retrieves full specification for a single compliance task."""
    try:
        stmt = select(
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
        ).where(Task.id == id)
        
        result = await db.execute(stmt)
        row = result.first()
        
        if not row:
            raise HTTPException(
                status_code=fastapi_status.HTTP_404_NOT_FOUND,
                detail="Task not found in queue."
            )
            
        return map_db_task_to_response(row)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching task details {id}: {e}")
        raise HTTPException(
            status_code=fastapi_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch task: {str(e)}"
        )

@router.put("/{id}/status", response_model=TaskResponse)
async def update_task_status(id: uuid.UUID, status: str = Form(...), db: AsyncSession = Depends(get_db)):
    """Updates active task state parameters (Pending, Assigned, In Progress, Awaiting Verification, Completed, Rejected)."""
    try:
        allowed = ["Pending", "Assigned", "In Progress", "Awaiting Verification", "Completed", "Overdue", "Rejected"]
        if status not in allowed:
            raise HTTPException(
                status_code=fastapi_status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid task status. Allowed values: {', '.join(allowed)}"
            )
            
        stmt = select(Task).where(Task.id == id)
        res = await db.execute(stmt)
        item = res.scalar_one_or_none()
        
        if not item:
            raise HTTPException(
                status_code=fastapi_status.HTTP_404_NOT_FOUND,
                detail="Task not found in registry."
            )
            
        item.status = status
        item.updated_at = datetime.datetime.utcnow()
        await db.commit()
        
        # Load joined payload for return
        return await get_task(id, db)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating task status {id}: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=fastapi_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update task status: {str(e)}"
        )

@router.post("/{id}/comment", response_model=TaskResponse)
async def add_task_comment(
    id: uuid.UUID,
    author: str = Form(...),
    text: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    """Appends comments to the task operations ledger."""
    try:
        stmt = select(Task).where(Task.id == id)
        res = await db.execute(stmt)
        item = res.scalar_one_or_none()
        
        if not item:
            raise HTTPException(
                status_code=fastapi_status.HTTP_404_NOT_FOUND,
                detail="Task not found."
            )
            
        current_comments = list(item.comments or [])
        current_comments.append({
            "author": author,
            "text": text,
            "timestamp": datetime.datetime.utcnow().isoformat()
        })
        
        item.comments = current_comments
        item.updated_at = datetime.datetime.utcnow()
        await db.commit()
        
        return await get_task(id, db)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding comment to task {id}: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=fastapi_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add comment: {str(e)}"
        )

@router.post("/{id}/evidence", status_code=fastapi_status.HTTP_201_CREATED)
async def upload_task_evidence(
    id: uuid.UUID,
    file: UploadFile = File(...),
    notes: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    """Uploads audit evidence documents (PDF, DOCX, PNG/JPG) and marks task as Awaiting Verification."""
    # 1. Validate file format extension
    ext = file.filename.split(".")[-1].lower()
    allowed_exts = ["pdf", "docx", "png", "jpg", "jpeg"]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=fastapi_status.HTTP_400_BAD_REQUEST,
            detail=f"Validation Error: Unsupported file format. Supported extensions: {', '.join(allowed_exts)}"
        )
        
    try:
        # Check task existence
        stmt = select(Task).where(Task.id == id)
        res = await db.execute(stmt)
        task_item = res.scalar_one_or_none()
        
        if not task_item:
            raise HTTPException(
                status_code=fastapi_status.HTTP_404_NOT_FOUND,
                detail="Task not found in queue."
            )
            
        # 2. Store locally in static directory
        evidence_id = uuid.uuid4()
        saved_filename = f"{evidence_id}.{ext}"
        saved_filepath = os.path.join(EVIDENCE_UPLOAD_DIR, saved_filename)
        
        with open(saved_filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 3. Save Evidence details
        # Default uploader is the task assignee / mock auditor
        uploader_id = uuid.UUID("a9b8c7d6-e5f4-4321-b123-a1b2c3d4e5f6")
        
        evidence_record = TaskEvidence(
            id=evidence_id,
            task_id=id,
            file_name=file.filename,
            file_path=os.path.join("uploads", "evidences", saved_filename),
            uploaded_by=uploader_id,
            notes=notes
        )
        
        db.add(evidence_record)
        
        # Advance task status to Awaiting Verification
        task_item.status = "Awaiting Verification"
        task_item.updated_at = datetime.datetime.utcnow()
        
        await db.commit()
        
        return {
            "evidence_id": str(evidence_id),
            "task_id": str(id),
            "status": "Awaiting Verification",
            "file_name": file.filename,
            "file_path": evidence_record.file_path,
            "message": "Compliance artifact uploaded. Task status advanced to Awaiting Verification."
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading evidence for task {id}: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=fastapi_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evidence upload failed: {str(e)}"
        )

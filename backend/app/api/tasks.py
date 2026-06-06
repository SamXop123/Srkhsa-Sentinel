from fastapi import APIRouter, UploadFile, File, Form, status, HTTPException
from app.schemas.task import TaskResponse
from typing import List
import uuid

router = APIRouter()

@router.get("/department/{dept_id}", response_model=List[TaskResponse])
async def get_department_tasks(dept_id: uuid.UUID):
    """Retrieves list of active tasks assigned to the department."""
    return [
        {
            "id": uuid.uuid4(),
            "map_id": uuid.uuid4(),
            "title": "Establish CISO Board Charter",
            "description": "Establish designated CISO appointment board, assign reporting lines, and publish regulatory governance updates.",
            "department_id": dept_id,
            "status": "In_Progress",
            "deadline": "2026-06-15",
            "created_at": "2026-06-06T00:30:00Z",
            "updated_at": "2026-06-06T00:30:00Z"
        }
    ]

@router.post("/{id}/submit-evidence", status_code=status.HTTP_201_CREATED)
async def submit_evidence(
    id: uuid.UUID,
    file: UploadFile = File(...),
    comment: str = Form(None)
):
    """Submits evidence attachment PDF and moves task to validation stage."""
    # Mock return model
    return {
        "task_id": str(id),
        "status": "Under_Review",
        "evidence_id": str(uuid.uuid4()),
        "file_name": file.filename,
        "message": "Audit evidence received. Forwarded to Auditor Agent."
    }

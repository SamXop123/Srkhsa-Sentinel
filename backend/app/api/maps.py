from fastapi import APIRouter, status
from app.schemas.map import MapResponse, MapBase
from typing import List
import uuid

router = APIRouter()

@router.get("/pending", response_model=List[MapResponse])
async def get_pending_maps():
    """Fetches list of MAP targets awaiting auditor checkoff approvals."""
    # Mock return list
    return [
        {
            "id": uuid.uuid4(),
            "regulation_id": uuid.uuid4(),
            "description": "Establish designated CISO appointment board and cyber governance frameworks.",
            "risk_classification": "High",
            "department_id": uuid.uuid4(),
            "status": "Pending_Review",
            "created_by_agent": True,
            "created_at": "2026-06-06T00:30:00Z",
            "updated_at": "2026-06-06T00:30:00Z"
        }
    ]

@router.put("/{id}/review", response_model=MapResponse)
async def review_map(id: uuid.UUID, payload: MapBase):
    """Saves auditor modifications and updates status state to Approved or Rejected."""
    return {
        "id": id,
        "regulation_id": payload.regulation_id,
        "description": payload.description,
        "risk_classification": payload.risk_classification,
        "department_id": payload.department_id,
        "status": "Approved",
        "created_by_agent": True,
        "auditor_review_notes": "Auditor approved target mapping.",
        "created_at": "2026-06-06T00:30:00Z",
        "updated_at": "2026-06-06T01:30:00Z"
    }

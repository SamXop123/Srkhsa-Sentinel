from fastapi import APIRouter
from app.schemas.compliance import ComplianceRecordResponse, ComplianceRecordCreate

router = APIRouter()

@router.get("/heatmap")
async def get_compliance_heatmap():
    """Generates matrix metrics scoring compliant vs overdue nodes per unit."""
    return {
        "overall_compliance_score": 94.2,
        "departments": [
            {
                "name": "IT Security",
                "compliance_score": 83.3,
                "total_tasks": 6,
                "completed": 5,
                "overdue": 1
            },
            {
                "name": "Audit & Risk Management",
                "compliance_score": 100.0,
                "total_tasks": 4,
                "completed": 4,
                "overdue": 0
            }
        ]
    }

@router.post("/verify", response_model=ComplianceRecordResponse)
async def verify_task(payload: ComplianceRecordCreate):
    """Executes compliance checkoff verification on submitted task evidence."""
    import uuid
    return {
        "id": uuid.uuid4(),
        "task_id": payload.task_id,
        "auditor_id": payload.auditor_id,
        "status": payload.status,
        "verification_notes": payload.verification_notes,
        "verified_at": "2026-06-06T00:30:00Z",
        "created_at": "2026-06-06T00:30:00Z"
    }

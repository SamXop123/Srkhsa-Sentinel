from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import UserCreate, UserResponse
from typing import Dict

router = APIRouter()

@router.post("/login", status_code=status.HTTP_200_OK)
async def login(payload: Dict[str, str]):
    """Authenticate auditor or officer credentials and return session tokens."""
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Mock JWT generation for MVP skeleton
    return {
        "access_token": "mock-jwt-access-token-xyz",
        "refresh_token": "mock-jwt-refresh-token-abc",
        "token_type": "bearer",
        "user": {
            "id": "a9b8c7d6-e5f4-4321-b123-a1b2c3d4e5f6",
            "email": email,
            "role": "Auditor"
        }
    }

@router.post("/refresh", status_code=status.HTTP_200_OK)
async def refresh_token():
    """Rotate access tokens using HTTP-only cookies verification."""
    return {
        "access_token": "mock-jwt-access-token-new-xyz",
        "refresh_token": "mock-jwt-refresh-token-new-abc",
        "token_type": "bearer"
    }

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.core.config import settings
from app.websocket.manager import manager

# Router Imports
from app.api import auth, circulars, maps, tasks, compliance, escalations, audit, departments

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SuRakshaSentinel")

from app.db.base import Base
from app.db.session import engine, AsyncSessionLocal
from app.models.role import Role
from app.models.user import User
from sqlalchemy.future import select
import uuid
import app.db.models # Ensure all models are registered

from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(
    title=settings.APP_NAME,
    description="Agentic Regulatory Intelligence & Compliance Platform for Banks",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Ensure uploads folder is created
os.makedirs(os.path.join("backend", "uploads", "circulars"), exist_ok=True)

# Mount static folder for PDFs
app.mount("/uploads", StaticFiles(directory=os.path.join("backend", "uploads")), name="uploads")

@app.on_event("startup")
async def on_startup():
    # 1. Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    # 2. Seed database roles, departments, and managers
    async with AsyncSessionLocal() as session:
        try:
            # Seed Roles
            roles_to_seed = {
                "Admin": ("b2e5a4d1-c6b7-8e9f-0a1b-2c3d4e5f6a7b", "Super administrator"),
                "Auditor": ("d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a", "Audits circulars and MAPs"),
                "Compliance Officer": ("c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f", "Compliance officer"),
                "Department Head": ("e5f6a7b8-9c0d-1e2f-3a4b-5c6d7e8f9a0b", "Manages department task queue"),
                "CEO": ("f6a7b89c-0d1e-2f3a-4b5c-6d7e8f9a0b1c", "Executive overview access")
            }
            role_map = {}
            for name, (rid_str, desc) in roles_to_seed.items():
                rid = uuid.UUID(rid_str)
                stmt = select(Role).where(Role.name == name)
                res = await session.execute(stmt)
                role_obj = res.scalar_one_or_none()
                if not role_obj:
                    role_obj = Role(id=rid, name=name, description=desc)
                    session.add(role_obj)
                    await session.flush()
                role_map[name] = role_obj.id

            # Seed Auditor user
            user_id = uuid.UUID("a9b8c7d6-e5f4-4321-b123-a1b2c3d4e5f6")
            user_stmt = select(User).where(User.id == user_id)
            user_res = await session.execute(user_stmt)
            auditor_user = user_res.scalar_one_or_none()
            
            if not auditor_user:
                auditor_user = User(
                    id=user_id,
                    email="auditor@sentinel.com",
                    password_hash="scrypt:32768:8:1$mock-hash",
                    first_name="R.",
                    last_name="Kumar",
                    role_id=role_map["Auditor"],
                    is_active=True
                )
                session.add(auditor_user)

            # Seed Departments and Department Head Users
            depts_to_seed = [
                ("Customer Operations", "Sarah", "Jenkins", "sarah.j@sentinel.com"),
                ("Retail Loans", "David", "Miller", "david.m@sentinel.com"),
                ("Corporate Banking", "Robert", "Chen", "robert.c@sentinel.com"),
                ("Risk Management", "Elena", "Rostova", "elena.r@sentinel.com"),
                ("Treasury", "Sanjay", "Kumar", "sanjay.k@sentinel.com"),
                ("Cyber Security", "Alex", "Mercer", "alex.m@sentinel.com"),
                ("IT Operations", "Vikram", "Shah", "vikram.s@sentinel.com"),
                ("Compliance", "Meera", "Nair", "meera.n@sentinel.com"),
                ("Legal", "James", "O'Connor", "james.o@sentinel.com"),
                ("AML Team", "Ananya", "Sen", "ananya.s@sentinel.com"),
                ("Fraud Monitoring", "Karan", "Johar", "karan.j@sentinel.com"),
                ("Vendor Management", "Lisa", "Wong", "lisa.w@sentinel.com"),
                ("Human Resources", "Tina", "Alva", "tina.a@sentinel.com"),
            ]
            
            from app.models.department import Department
            for dept_name, first, last, email in depts_to_seed:
                # Check department
                stmt = select(Department).where(Department.name == dept_name)
                res = await session.execute(stmt)
                dept_obj = res.scalar_one_or_none()
                
                if not dept_obj:
                    dept_obj = Department(
                        id=uuid.uuid4(),
                        name=dept_name,
                        head_name=f"{first} {last}",
                        email=email,
                        active=True
                    )
                    session.add(dept_obj)
                    await session.flush()
                
                # Check manager User account
                stmt = select(User).where(User.email == email)
                res = await session.execute(stmt)
                user_obj = res.scalar_one_or_none()
                
                if not user_obj:
                    user_obj = User(
                        id=uuid.uuid4(),
                        email=email,
                        password_hash="scrypt:32768:8:1$mock-hash",
                        first_name=first,
                        last_name=last,
                        role_id=role_map["Department Head"],
                        department_id=dept_obj.id,
                        is_active=True
                    )
                    session.add(user_obj)
                    await session.flush()

            await session.commit()
        except Exception as e:
            logger.error(f"Error seeding database: {e}")
            await session.rollback()

# Configure CORS for React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app_name": settings.APP_NAME,
        "message": "Regulatory loop closure API is running."
    }

# Register Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(circulars.router, prefix="/api/v1/circulars", tags=["Circulars"])
app.include_router(maps.router, prefix="/api/v1/maps", tags=["MAP Review"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["Tasks"])
app.include_router(departments.router, prefix="/api/v1/departments", tags=["Departments"])
app.include_router(compliance.router, prefix="/api/v1/compliance", tags=["Compliance"])
app.include_router(escalations.router, prefix="/api/v1/escalations", tags=["Escalations"])
app.include_router(audit.router, prefix="/api/v1/audit-logs", tags=["Audit Logs"])

# WebSocket endpoint for real-time agent log updates
@app.websocket("/ws/agents/logs")
async def websocket_endpoint(websocket: WebSocket, circular_id: str):
    await manager.connect(websocket, circular_id)
    try:
        while True:
            # Client can send heartbeats or acknowledgements
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, circular_id)
    except Exception as e:
        logger.error(f"WebSocket connection encountered error: {e}")
        manager.disconnect(websocket, circular_id)

# Helper function to trigger logs manually or from background agent jobs
async def broadcast_agent_log(circular_id: str, agent: str, message: str, level: str = "INFO"):
    log_payload = {
        "agent": agent,
        "message": message,
        "level": level,
        "timestamp": "2026-06-06T00:30:00Z"
    }
    await manager.broadcast_to_circular(circular_id, log_payload)

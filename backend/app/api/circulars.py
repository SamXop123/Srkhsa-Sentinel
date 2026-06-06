from fastapi import APIRouter, UploadFile, File, Form, status, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models.circular import Circular, Regulation
from app.schemas.circular import CircularResponse, RegulationResponse
from app.agents.graph import compliance_graph
import uuid
import os
import shutil
import fitz  # PyMuPDF
from datetime import datetime, date
from typing import List, Optional, Dict, Any

router = APIRouter()

# Local storage directories
UPLOAD_DIR = os.path.join("backend", "uploads", "circulars")
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def run_agentic_workflow(circular_id: uuid.UUID):
    """Executes the compiled LangGraph compliance workflow in the background."""
    initial_state = {
        "circular_id": str(circular_id),
        "file_path": "",
        "parsed_clauses": [],
        "generated_maps": [],
        "task_ids": [],
        "verification_results": [],
        "execution_logs": [],
        "current_node": "",
        "errors": []
    }
    await compliance_graph.ainvoke(initial_state)

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_circular(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    source_org: str = Form(...),
    title: str = Form(...),
    circular_number: str = Form(...),
    publication_date: str = Form(...),
    effective_date: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Ingests compliance PDFs, extracts text/page count, saves file locally, and registers in DB.
    """
    # 1. Validation Rules: PDF format only
    if not file.filename.lower().endswith(".pdf") or file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Validation Error: Only PDF file formats (.pdf) are allowed."
        )

    circular_id = uuid.uuid4()
    pdf_filename = f"{circular_id}.pdf"
    txt_filename = f"{circular_id}.txt"
    pdf_path = os.path.join(UPLOAD_DIR, pdf_filename)
    txt_path = os.path.join(UPLOAD_DIR, txt_filename)

    # 2. Local File Storage
    try:
        with open(pdf_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store PDF file locally: {str(e)}"
        )

    # 3. PDF text and metadata extraction using PyMuPDF (fitz)
    raw_text = ""
    page_count = 0
    doc_metadata = {}
    try:
        doc = fitz.open(pdf_path)
        page_count = len(doc)
        doc_metadata = doc.metadata
        for page in doc:
            raw_text += page.get_text()
        doc.close()
    except Exception as e:
        # Clean up file on failure
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to process PDF content: {str(e)}"
        )

    # Store text file locally
    try:
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(raw_text)
    except Exception as e:
        pass  # Non-blocking if txt save fails, raw_text is stored in DB too.

    # 4. Parse Dates
    try:
        pub_date = datetime.strptime(publication_date, "%Y-%m-%d").date()
    except Exception:
        pub_date = date.today()

    try:
        eff_date_str = effective_date if effective_date else publication_date
        eff_date = datetime.strptime(eff_date_str, "%Y-%m-%d").date()
    except Exception:
        eff_date = pub_date

    # 5. Database Persistence
    # Use mock auditor user ID
    uploader_id = uuid.UUID("a9b8c7d6-e5f4-4321-b123-a1b2c3d4e5f6")

    # Check if circular_number already exists
    stmt = select(Circular).where(Circular.circular_number == circular_number)
    existing = await db.execute(stmt)
    if existing.scalar_one_or_none():
        # Clean up files
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        if os.path.exists(txt_path):
            os.remove(txt_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Validation Error: A circular with number '{circular_number}' is already registered."
        )

    new_circular = Circular(
        id=circular_id,
        title=title,
        source_org=source_org,
        circular_number=circular_number,
        publication_date=pub_date,
        file_path=os.path.join("uploads", "circulars", pdf_filename),
        status="Parsed",
        raw_metadata={
            "page_count": page_count,
            "effective_date": str(eff_date),
            "file_size_bytes": os.path.getsize(pdf_path),
            "pdf_metadata": doc_metadata,
            "extracted_text": raw_text[:50000] # Cap text stored in JSONB to avoid extreme payloads
        },
        uploaded_by=uploader_id
    )

    try:
        db.add(new_circular)
        await db.commit()
        await db.refresh(new_circular)
        # Schedule the Scout Agent LangGraph pipeline
        background_tasks.add_task(run_agentic_workflow, new_circular.id)
    except Exception as e:
        await db.rollback()
        # Clean up files
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        if os.path.exists(txt_path):
            os.remove(txt_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database registration failed: {str(e)}"
        )

    return new_circular

@router.get("/", response_model=List[CircularResponse])
async def get_circulars(db: AsyncSession = Depends(get_db)):
    """Retrieves all registered circulars in reverse chronological order."""
    stmt = select(Circular).order_by(Circular.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/regulations/recent")
async def get_recent_regulations(db: AsyncSession = Depends(get_db)):
    """Retrieves recently extracted Scout regulations joined with circular number and title."""
    stmt = select(Regulation, Circular.circular_number, Circular.title).join(
        Circular, Regulation.circular_id == Circular.id
    ).order_by(Regulation.created_at.desc()).limit(5)
    result = await db.execute(stmt)
    
    recent_list = []
    for reg, circ_num, circ_title in result.all():
        recent_list.append({
            "id": str(reg.id),
            "circular_id": str(reg.circular_id),
            "regulation_id": reg.regulation_id,
            "circular_number": circ_num,
            "circular_title": circ_title,
            "title": reg.title,
            "regulator": reg.regulator,
            "effective_date": str(reg.effective_date),
            "risk_level": reg.risk_level,
            "summary": reg.summary,
            "created_at": reg.created_at.isoformat()
        })
    return recent_list

@router.get("/{id}", response_model=CircularResponse)
async def get_circular(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Retrieves a circular's metadata and extraction payload by ID."""
    stmt = select(Circular).where(Circular.id == id)
    result = await db.execute(stmt)
    circular = result.scalar_one_or_none()
    if not circular:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Circular not found."
        )
    return circular

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_circular(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Deletes a circular record from DB and cleans up local storage files."""
    stmt = select(Circular).where(Circular.id == id)
    result = await db.execute(stmt)
    circular = result.scalar_one_or_none()
    if not circular:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Circular not found."
        )

    # Delete local files
    pdf_filename = f"{id}.pdf"
    txt_filename = f"{id}.txt"
    pdf_path = os.path.join(UPLOAD_DIR, pdf_filename)
    txt_path = os.path.join(UPLOAD_DIR, txt_filename)

    if os.path.exists(pdf_path):
        os.remove(pdf_path)
    if os.path.exists(txt_path):
        os.remove(txt_path)

    try:
        await db.delete(circular)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete circular: {str(e)}"
        )

    return {
        "circular_id": str(id),
        "status": "Deleted",
        "message": "Circular deleted successfully from database and local storage."
    }

@router.get("/{id}/regulation", response_model=RegulationResponse)
async def get_circular_regulation(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Retrieves the Scout Agent structured regulation record for a given circular."""
    stmt = select(Regulation).where(Regulation.circular_id == id)
    result = await db.execute(stmt)
    regulation = result.scalar_one_or_none()
    if not regulation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Regulation not extracted yet. Please wait for Scout Agent analysis."
        )
    return regulation

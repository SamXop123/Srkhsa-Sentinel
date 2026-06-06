from langgraph.graph import StateGraph, END
from app.agents.state import ComplianceGraphState, AgentExecutionLog
from app.agents.scout import run_scout_agent
from app.agents.architect import run_architect_agent
from app.agents.dispatcher import run_dispatcher_agent
from app.db.session import AsyncSessionLocal
from app.models.circular import Circular, Regulation, AgentLog
from app.models.map import Map
from app.models.task import Task
from app.models.user import User, Notification
from app.models.department import Department
from app.websocket.manager import manager
from sqlalchemy.future import select
from sqlalchemy import delete
from typing import TypedDict, Optional, List
import uuid
import datetime
import logging
import asyncio

logger = logging.getLogger("SuRakshaSentinel.Graph")

async def send_agent_log(circular_id: str, agent: str, message: str, level: str = "INFO"):
    """Pushes real-time execution logs through WS and stores them in agent_logs table."""
    # 1. Broadcast over WS
    log_payload = {
        "agent": agent,
        "message": message,
        "level": level,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    await manager.broadcast_to_circular(circular_id, log_payload)

    # 2. Persist to DB for history
    async with AsyncSessionLocal() as session:
        try:
            db_log = AgentLog(
                id=uuid.uuid4(),
                circular_id=uuid.UUID(circular_id),
                agent_name=agent,
                log_level=level,
                message=message
            )
            session.add(db_log)
            await session.commit()
        except Exception as e:
            logger.error(f"Failed to save agent log to database: {e}")

async def scout_node(state: ComplianceGraphState) -> ComplianceGraphState:
    """
    Parses circular PDF text, extracts regulation parameters, saves to SQLite DB,
    and updates circular status to Scout_Complete. Streams progress logs via WS.
    """
    circ_id_str = state["circular_id"]
    circ_id = uuid.UUID(circ_id_str)
    
    # Start Log
    await send_agent_log(circ_id_str, "Scout", "[Scout] Initializing circular parsing pipeline...", "INFO")
    await asyncio.sleep(0.5)

    # 1. Fetch Circular from database
    async with AsyncSessionLocal() as session:
        stmt = select(Circular).where(Circular.id == circ_id)
        res = await session.execute(stmt)
        circular = res.scalar_one_or_none()
        
        if not circular:
            err_msg = "Circular record not found in database registry."
            await send_agent_log(circ_id_str, "Scout", f"[Scout] Error: {err_msg}", "ERROR")
            state["errors"].append(err_msg)
            return state

        raw_text = circular.raw_metadata.get("extracted_text", "")
        source_org = circular.source_org
        pub_date = str(circular.publication_date)
        circ_num = circular.circular_number
        circ_title = circular.title

    await send_agent_log(circ_id_str, "Scout", f"[Scout] Ingested document: {circ_num}", "INFO")
    await asyncio.sleep(0.5)
    await send_agent_log(circ_id_str, "Scout", "[Scout] Extracting regulation ID, title, regulator, and issue date...", "INFO")
    await asyncio.sleep(0.5)

    # 2. Execute Scout Agent
    try:
        scout_output = run_scout_agent(
            raw_text=raw_text,
            source_org=source_org,
            publication_date=pub_date,
            circular_number=circ_num,
            circular_title=circ_title
        )
    except Exception as e:
        err_msg = f"LLM parser failed: {str(e)}"
        await send_agent_log(circ_id_str, "Scout", f"[Scout] Error: {err_msg}", "ERROR")
        state["errors"].append(err_msg)
        return state

    await send_agent_log(
        circ_id_str, 
        "Scout", 
        f"[Scout] Discovered regulation: Title='{scout_output.title}', Risk Level={scout_output.risk_level}", 
        "INFO"
    )
    await asyncio.sleep(0.5)

    if scout_output.penalty_clause:
        await send_agent_log(
            circ_id_str,
            "Scout",
            f"[Scout] Penalty clauses flagged! Affected domains: {', '.join(scout_output.affected_domains)}",
            "WARNING"
        )
        await asyncio.sleep(0.5)

    # 3. Save structured Regulation to DB
    async with AsyncSessionLocal() as session:
        try:
            # Check if Regulation record already exists for this circular
            reg_stmt = select(Regulation).where(Regulation.circular_id == circ_id)
            reg_res = await session.execute(reg_stmt)
            existing_reg = reg_res.scalar_one_or_none()
            
            # Map Pydantic date string
            try:
                eff_date = datetime.datetime.strptime(scout_output.effective_date, "%Y-%m-%d").date()
            except Exception:
                eff_date = datetime.date.today()
                
            if not existing_reg:
                new_reg = Regulation(
                    id=uuid.uuid4(),
                    circular_id=circ_id,
                    regulation_id=scout_output.regulation_id,
                    title=scout_output.title,
                    regulator=scout_output.regulator,
                    effective_date=eff_date,
                    penalty_clause=scout_output.penalty_clause,
                    risk_level=scout_output.risk_level,
                    affected_domains=scout_output.affected_domains,
                    summary=scout_output.summary
                )
                session.add(new_reg)
            else:
                existing_reg.regulation_id = scout_output.regulation_id
                existing_reg.title = scout_output.title
                existing_reg.regulator = scout_output.regulator
                existing_reg.effective_date = eff_date
                existing_reg.penalty_clause = scout_output.penalty_clause
                existing_reg.risk_level = scout_output.risk_level
                existing_reg.affected_domains = scout_output.affected_domains
                existing_reg.summary = scout_output.summary
                
            # Update circular status to "Scout_Complete"
            circ_stmt = select(Circular).where(Circular.id == circ_id)
            circ_res = await session.execute(circ_stmt)
            circ_record = circ_res.scalar_one()
            circ_record.status = "Scout_Complete"
            
            await session.commit()
        except Exception as e:
            await session.rollback()
            err_msg = f"Database commit failed: {str(e)}"
            await send_agent_log(circ_id_str, "Scout", f"[Scout] Error: {err_msg}", "ERROR")
            state["errors"].append(err_msg)
            return state

    await send_agent_log(circ_id_str, "Scout", "[Scout] Regulation registered in DB. Scout analysis completed successfully.", "INFO")
    
    # Record logs in graph state
    log: AgentExecutionLog = {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "agent": "Scout",
        "message": f"Scout Analysis complete. Status updated to Scout_Complete.",
        "level": "INFO"
    }
    state["execution_logs"].append(log)
    state["current_node"] = "scout"
    
    return state

async def architect_node(state: ComplianceGraphState) -> ComplianceGraphState:
    """
    Evaluates Scout-extracted intelligence, designs assignable, deadline-driven 
    Measurable Action Points (MAPs), and saves them to the DB.
    """
    circ_id_str = state["circular_id"]
    circ_id = uuid.UUID(circ_id_str)

    await send_agent_log(circ_id_str, "Architect", "[Architect] Evaluating Regulation and penalty frameworks...", "INFO")
    await asyncio.sleep(0.5)

    # 1. Fetch extracted Regulation and Circular details
    async with AsyncSessionLocal() as session:
        reg_stmt = select(Regulation).where(Regulation.circular_id == circ_id)
        reg_res = await session.execute(reg_stmt)
        regulation = reg_res.scalar_one_or_none()

        if not regulation:
            err_msg = "Regulation metadata not found. Cannot proceed with MAP creation."
            await send_agent_log(circ_id_str, "Architect", f"[Architect] Error: {err_msg}", "ERROR")
            state["errors"].append(err_msg)
            return state

        reg_ref = regulation.regulation_id
        reg_title = regulation.title
        regulator = regulation.regulator
        summary = regulation.summary
        risk_level = regulation.risk_level
        penalty_clause = regulation.penalty_clause
        affected_domains = regulation.affected_domains
        regulation_id = regulation.id

    # 2. Execute Architect Agent
    try:
        architect_output = run_architect_agent(
            regulation_ref=reg_ref,
            regulation_title=reg_title,
            regulator=regulator,
            summary=summary,
            risk_level=risk_level,
            penalty_clause=penalty_clause,
            affected_domains=affected_domains
        )
    except Exception as e:
        err_msg = f"Architect reasoning failed: {str(e)}"
        await send_agent_log(circ_id_str, "Architect", f"[Architect] Error: {err_msg}", "ERROR")
        state["errors"].append(err_msg)
        return state

    maps_count = len(architect_output.maps)
    await send_agent_log(circ_id_str, "Architect", f"[Architect] Generated {maps_count} MAPs...", "INFO")
    await asyncio.sleep(0.5)

    # 3. Store generated MAPs to DB
    async with AsyncSessionLocal() as session:
        try:
            # Delete any existing MAPs for this regulation to support re-runs
            del_stmt = delete(Map).where(Map.regulation_id == regulation_id)
            await session.execute(del_stmt)

            state_maps = []
            for item in architect_output.maps:
                # Parse deadline
                try:
                    deadline_date = datetime.datetime.strptime(item.deadline, "%Y-%m-%d").date()
                except Exception:
                    deadline_date = datetime.date.today()

                reasoning_dict = {
                    "why_generated": item.why_generated,
                    "why_department": item.why_department,
                    "why_risk": item.why_risk,
                    "why_verification": item.why_verification
                }

                new_map = Map(
                    id=uuid.uuid4(),
                    regulation_id=regulation_id,
                    task_title=item.task_title,
                    task_description=item.task_description,
                    department=item.department,
                    priority=item.priority,
                    risk_level=item.risk_level,
                    deadline=deadline_date,
                    required_outcome=item.required_outcome,
                    verification_method=item.verification_method,
                    confidence_score=item.confidence_score,
                    status="Pending",
                    reasoning=reasoning_dict
                )
                session.add(new_map)
                
                # Broadcast assignment log
                await send_agent_log(
                    circ_id_str, 
                    "Architect", 
                    f"[Architect] Assigned task to {item.department}: '{item.task_title}'", 
                    "INFO"
                )
                await asyncio.sleep(0.3)

                # Keep track for state
                state_maps.append({
                    "task_title": item.task_title,
                    "department": item.department,
                    "risk_level": item.risk_level,
                    "deadline": item.deadline,
                    "required_outcome": item.required_outcome,
                    "verification_method": item.verification_method,
                    "confidence_score": item.confidence_score,
                    "reasoning": reasoning_dict
                })

            # Assign risk levels log
            await send_agent_log(circ_id_str, "Architect", "[Architect] Assigned risk levels and compliance priority tiers...", "INFO")
            await asyncio.sleep(0.5)

            # Update Circular Status to MAP_Generated
            circ_stmt = select(Circular).where(Circular.id == circ_id)
            circ_res = await session.execute(circ_stmt)
            circ_record = circ_res.scalar_one()
            circ_record.status = "MAP_Generated"

            await session.commit()
        except Exception as e:
            await session.rollback()
            err_msg = f"Database commit of MAPs failed: {str(e)}"
            await send_agent_log(circ_id_str, "Architect", f"[Architect] Error: {err_msg}", "ERROR")
            state["errors"].append(err_msg)
            return state

    await send_agent_log(circ_id_str, "Architect", f"[Architect] Analysis completed successfully. {maps_count} Measurable Action Points registered.", "INFO")

    log: AgentExecutionLog = {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "agent": "Architect",
        "message": f"Architect generation complete. Generated {maps_count} MAPs. Status updated to MAP_Generated.",
        "level": "INFO"
    }
    state["execution_logs"].append(log)
    state["generated_maps"] = state_maps
    state["current_node"] = "architect"

    return state


# Setup the LangGraph Ingestion Workflow
workflow = StateGraph(ComplianceGraphState)
workflow.add_node("scout", scout_node)
workflow.add_node("architect", architect_node)
workflow.set_entry_point("scout")
workflow.add_edge("scout", "architect")
workflow.add_edge("architect", END)
compliance_graph = workflow.compile()


# ────────────────────────────────────────────────────────
# Dispatcher Workflow Setup (Step 4 & 5 Integration)
# ────────────────────────────────────────────────────────

class DispatchGraphState(TypedDict):
    map_id: str
    task_id: Optional[str]
    notification_id: Optional[str]
    errors: List[str]

async def dispatcher_node(state: DispatchGraphState) -> DispatchGraphState:
    """
    Dispatcher Node. Routes approved MAP, assigns department head manager,
    creates Task, inserts Notification, and updates Circular status.
    """
    map_id_str = state["map_id"]
    map_uuid = uuid.UUID(map_id_str)

    async with AsyncSessionLocal() as session:
        # Fetch Map, joined with Regulation and Circular
        stmt = select(Map, Regulation, Circular).join(
            Regulation, Map.regulation_id == Regulation.id
        ).join(
            Circular, Regulation.circular_id == Circular.id
        ).where(Map.id == map_uuid)
        
        res = await session.execute(stmt)
        row = res.one_or_none()
        
        if not row:
            err = "Map record not found in database workspace."
            state["errors"].append(err)
            return state
            
        map_item, regulation, circular = row
        circular_id_str = str(circular.id)

    # 1. Start Dispatch logs
    await send_agent_log(circular_id_str, "Dispatcher", "[Dispatcher] Reviewing approved MAP specifications...", "INFO")
    await asyncio.sleep(0.5)

    # 2. Run Dispatcher Agent to classify department and managers
    try:
        dispatcher_output = run_dispatcher_agent(
            map_title=map_item.task_title,
            map_description=map_item.task_description,
            department_name=map_item.department,
            priority=map_item.priority,
            risk_level=map_item.risk_level,
            deadline=str(map_item.deadline),
            required_outcome=map_item.required_outcome,
            verification_method=map_item.verification_method,
            regulation_title=regulation.title,
            regulation_ref=circular.circular_number
        )
    except Exception as e:
        err = f"Dispatcher reasoning execution failed: {str(e)}"
        await send_agent_log(circular_id_str, "Dispatcher", f"[Dispatcher] Error: {err}", "ERROR")
        state["errors"].append(err)
        return state

    await send_agent_log(
        circular_id_str, 
        "Dispatcher", 
        f"[Dispatcher] Routed to {dispatcher_output.assigned_department} (Contact: {dispatcher_output.assigned_to})", 
        "INFO"
    )
    await asyncio.sleep(0.5)

    # 3. Resolve target Department ID from Seeding
    async with AsyncSessionLocal() as session:
        try:
            dept_stmt = select(Department).where(Department.name == dispatcher_output.assigned_department)
            dept_res = await session.execute(dept_stmt)
            department = dept_res.scalar_one_or_none()
            
            if not department:
                # Dynamically create if seeding missed it
                department = Department(
                    id=uuid.uuid4(),
                    name=dispatcher_output.assigned_department,
                    head_name="Sarah Jenkins",
                    email=dispatcher_output.assigned_to,
                    active=True
                )
                session.add(department)
                await session.flush()
                
            # Locate department head User to link notifications
            user_stmt = select(User).where(User.email == department.email)
            user_res = await session.execute(user_stmt)
            manager_user = user_res.scalar_one_or_none()
            
            # Default to mock auditor if no head user matches
            manager_user_id = manager_user.id if manager_user else uuid.UUID("a9b8c7d6-e5f4-4321-b123-a1b2c3d4e5f6")

            # Check if task already exists for this MAP to avoid duplicates
            task_stmt = select(Task).where(Task.map_id == map_item.id)
            task_res = await session.execute(task_stmt)
            existing_task = task_res.scalar_one_or_none()

            reasoning_dict = {
                "why_department_chosen": dispatcher_output.why_department_chosen,
                "why_task_belongs": dispatcher_output.why_task_belongs,
                "relevant_regulation_section": dispatcher_output.relevant_regulation_section
            }

            if not existing_task:
                task_obj = Task(
                    id=uuid.uuid4(),
                    map_id=map_item.id,
                    department_id=department.id,
                    assigned_to=department.email,
                    title=dispatcher_output.task_title,
                    description=dispatcher_output.task_description,
                    priority=map_item.priority,
                    deadline=map_item.deadline,
                    status="Assigned",
                    assignment_reasoning=reasoning_dict,
                    comments=[]
                )
                session.add(task_obj)
                await session.flush()
                state["task_id"] = str(task_obj.id)
            else:
                existing_task.department_id = department.id
                existing_task.assigned_to = department.email
                existing_task.title = dispatcher_output.task_title
                existing_task.description = dispatcher_output.task_description
                existing_task.priority = map_item.priority
                existing_task.deadline = map_item.deadline
                existing_task.assignment_reasoning = reasoning_dict
                state["task_id"] = str(existing_task.id)

            # Insert Notification record
            notify_obj = Notification(
                id=uuid.uuid4(),
                user_id=manager_user_id,
                title=f"New Task Dispatched: {dispatcher_output.task_title}",
                message=f"A new task from regulation {circular.circular_number} has been routed to your department. Deadline: {map_item.deadline}.",
                type="Task_Assignment",
                is_read=False
            )
            session.add(notify_obj)
            await session.flush()
            state["notification_id"] = str(notify_obj.id)

            # Verify if all maps for this regulation / circular are approved or rejected.
            # If yes, we can set the circular status to "Dispatched"!
            all_maps_stmt = select(Map).where(Map.regulation_id == regulation.id)
            all_maps_res = await session.execute(all_maps_stmt)
            all_maps = all_maps_res.scalars().all()

            # We assume this approval counts!
            all_reviewed = True
            for m in all_maps:
                # If checking this active map, use "Approved" instead of DB status which we just updated in API
                m_status = "Approved" if m.id == map_item.id else m.status
                if m_status == "Pending":
                    all_reviewed = False
                    break

            if all_reviewed:
                circ_stmt = select(Circular).where(Circular.id == circular.id)
                circ_res = await session.execute(circ_stmt)
                circ_record = circ_res.scalar_one()
                circ_record.status = "Dispatched"

            await session.commit()
        except Exception as e:
            await session.rollback()
            err = f"Database dispatch persistence failed: {str(e)}"
            await send_agent_log(circular_id_str, "Dispatcher", f"[Dispatcher] Error: {err}", "ERROR")
            state["errors"].append(err)
            return state

    # 4. Stream operational progress logs sequentially after committing to avoid SQLite deadlocks
    await send_agent_log(circular_id_str, "Dispatcher", "[Dispatcher] Created operational task record in queue...", "INFO")
    await asyncio.sleep(0.5)

    head_name = department.head_name if 'department' in locals() else "Department Head"
    await send_agent_log(circular_id_str, "Dispatcher", f"[Dispatcher] Generated dashboard notification for head {head_name}...", "INFO")
    await asyncio.sleep(0.5)

    if 'all_reviewed' in locals() and all_reviewed:
        await send_agent_log(circular_id_str, "Dispatcher", "[Dispatcher] All action items processed. Circular status updated to Dispatched.", "INFO")
        await asyncio.sleep(0.3)

    await send_agent_log(circular_id_str, "Dispatcher", "[Dispatcher] Dispatch completed successfully.", "INFO")

    return state

# Setup Dispatcher LangGraph Workflow
dispatch_workflow = StateGraph(DispatchGraphState)
dispatch_workflow.add_node("dispatcher", dispatcher_node)
dispatch_workflow.set_entry_point("dispatcher")
dispatch_workflow.add_edge("dispatcher", END)
dispatch_graph = dispatch_workflow.compile()

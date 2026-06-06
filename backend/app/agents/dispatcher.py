from pydantic import BaseModel, Field
from typing import Optional, List
from app.core.config import settings
import logging
import datetime
import re

logger = logging.getLogger("SuRakshaSentinel.Dispatcher")

class DispatcherOutput(BaseModel):
    assigned_department: str = Field(description="The standard resolved department name")
    task_title: str = Field(description="Formatted task title")
    task_description: str = Field(description="Refined actionable task instruction details")
    assigned_to: str = Field(description="Email or name of the assigned department head")
    why_department_chosen: str = Field(description="Detailed reason why this department was chosen")
    why_task_belongs: str = Field(description="Operational reasoning explaining how the task fits the department's mandate")
    relevant_regulation_section: str = Field(description="Specific paragraph, clause, or page number referenced")

def run_dispatcher_agent(
    map_title: str,
    map_description: str,
    department_name: str,
    priority: str,
    risk_level: str,
    deadline: str,
    required_outcome: str,
    verification_method: str,
    regulation_title: str,
    regulation_ref: str
) -> DispatcherOutput:
    """
    Runs the Dispatcher Agent.
    Routes an approved MAP to a target department, assigns ownership, and builds assignment reasoning.
    Uses GPT-4o-mini structured output if OPENAI_API_KEY is configured,
    otherwise executes a rule-based matching fallback engine.
    """
    if settings.OPENAI_API_KEY:
        try:
            logger.info("Executing Dispatcher Agent with GPT-4o-mini structured output...")
            from langchain_openai import ChatOpenAI
            
            llm = ChatOpenAI(
                model="gpt-4o-mini",
                api_key=settings.OPENAI_API_KEY,
                temperature=0
            )
            
            structured_llm = llm.with_structured_output(DispatcherOutput)
            
            prompt = f"""
            You are Dispatcher Agent, an operational coordinator for banking compliance.
            Your task is to assign an approved Measurable Action Point (MAP) to a specific department head and generate detailed assignment reasoning for auditors.
            
            Approved MAP Details:
            Title: {map_title}
            Description: {map_description}
            Target Department: {department_name}
            Priority: {priority}
            Risk Level: {risk_level}
            Compliance Deadline: {deadline}
            Required Outcome: {required_outcome}
            Verification Method: {verification_method}
            
            Source Regulation:
            Title: {regulation_title}
            Ref/Number: {regulation_ref}
            
            Roster of Standard Banking Departments and Managers:
            - Customer Operations (Sarah Jenkins, Email: sarah.j@sentinel.com)
            - Retail Loans (David Miller, Email: david.m@sentinel.com)
            - Corporate Banking (Robert Chen, Email: robert.c@sentinel.com)
            - Risk Management (Elena Rostova, Email: elena.r@sentinel.com)
            - Treasury (Sanjay Kumar, Email: sanjay.k@sentinel.com)
            - Cyber Security (Alex Mercer, Email: alex.m@sentinel.com)
            - IT Operations (Vikram Shah, Email: vikram.s@sentinel.com)
            - Compliance (Meera Nair, Email: meera.n@sentinel.com)
            - Legal (James O'Connor, Email: james.o@sentinel.com)
            - AML Team (Ananya Sen, Email: ananya.s@sentinel.com)
            - Fraud Monitoring (Karan Johar, Email: karan.j@sentinel.com)
            - Vendor Management (Lisa Wong, Email: lisa.w@sentinel.com)
            - Human Resources (Tina Alva, Email: tina.a@sentinel.com)
            
            Perform task packaging:
            1. Map the target department to the closest standard department from the roster.
            2. Assign manager contact (name and email).
            3. Construct the assignment reasoning justifications for auditors:
               - why_department_chosen: Why this department was selected based on scope.
               - why_task_belongs: How this task maps to the department's day-to-day operational controls.
               - relevant_regulation_section: Identify the specific circular clause or reference parameter.
            """
            result = structured_llm.invoke(prompt)
            return result
        except Exception as e:
            logger.error(f"Failed to execute OpenAI structured LLM, falling back to heuristic engine: {e}")
            
    # Heuristic fallback engine
    logger.info("Executing Dispatcher Agent heuristic rule-based parsing engine...")
    
    # Resolve closest matching department and manager
    dept_lower = department_name.lower()
    
    resolved_dept = "Compliance"
    assigned_to = "meera.n@sentinel.com"
    
    roster = [
        ("Customer Operations", "sarah.j@sentinel.com"),
        ("Retail Loans", "david.m@sentinel.com"),
        ("Corporate Banking", "robert.c@sentinel.com"),
        ("Risk Management", "elena.r@sentinel.com"),
        ("Treasury", "sanjay.k@sentinel.com"),
        ("Cyber Security", "alex.m@sentinel.com"),
        ("IT Operations", "vikram.s@sentinel.com"),
        ("Compliance", "meera.n@sentinel.com"),
        ("Legal", "james.o@sentinel.com"),
        ("AML Team", "ananya.s@sentinel.com"),
        ("Fraud Monitoring", "karan.j@sentinel.com"),
        ("Vendor Management", "lisa.w@sentinel.com"),
        ("Human Resources", "tina.a@sentinel.com"),
    ]
    
    # Simple scoring substring match
    best_score = 0
    for dept, email in roster:
        score = 0
        tokens = dept.lower().split()
        for tok in tokens:
            if tok in dept_lower:
                score += 2
        # special overrides
        if "kyc" in dept_lower and dept == "Customer Operations":
            score += 5
        if "ciso" in dept_lower and dept == "Cyber Security":
            score += 5
        if "vapt" in dept_lower and dept == "IT Operations":
            score += 5
        if "security" in dept_lower and dept == "Cyber Security":
            score += 3
        if "aml" in dept_lower and dept == "AML Team":
            score += 5
        if "fraud" in dept_lower and dept == "Fraud Monitoring":
            score += 5
        if "vendor" in dept_lower and dept == "Vendor Management":
            score += 5
        if "outsourcing" in dept_lower and dept == "Vendor Management":
            score += 4
        if "loan" in dept_lower and dept == "Retail Loans":
            score += 5
            
        if score > best_score:
            best_score = score
            resolved_dept = dept
            assigned_to = email

    # Build justification narratives
    why_department_chosen = f"The {resolved_dept} division was selected because they manage the active business processes and frontline policies affected by this directive."
    why_task_belongs = f"This task involves implementing operational controls and validation checks that fall directly under the daily duties of the {resolved_dept} team."
    
    # Extract clause or section if present in map ref
    clause_match = re.search(r'(clause\s+\d+(\.\d+)*([a-z])?|section\s+\d+(\.\d+)*)', regulation_ref.lower())
    relevant_section = clause_match.group(0).upper() if clause_match else "GENERAL PROVISIONS"
    
    return DispatcherOutput(
        assigned_department=resolved_dept,
        task_title=map_title,
        task_description=map_description,
        assigned_to=assigned_to,
        why_department_chosen=why_department_chosen,
        why_task_belongs=why_task_belongs,
        relevant_regulation_section=relevant_section
    )

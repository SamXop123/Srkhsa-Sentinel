from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from app.core.config import settings
import logging
import re
import datetime

logger = logging.getLogger("SuRakshaSentinel.Architect")

class ArchitectMapItem(BaseModel):
    task_title: str = Field(description="Specific, assignable, and measurable action item title")
    task_description: str = Field(description="Detailed description of the task, deadline driven and actionable")
    department: str = Field(description="Assigned department from the bank's operational roster")
    priority: str = Field(description="Assigned priority: High, Medium, or Low")
    risk_level: str = Field(description="Assessed risk level: Low, Medium, High, or Critical")
    deadline: str = Field(description="Target deadline date in YYYY-MM-DD format")
    required_outcome: str = Field(description="Verifiable target outcome or outcome metric")
    verification_method: str = Field(description="Verification method: Policy Review, Config Audit, System Audit, Contract Audit, Employee Sign-off, etc.")
    confidence_score: float = Field(description="Confidence score between 0.0 and 1.0")
    why_generated: str = Field(description="Reason why this MAP was generated based on the regulatory text")
    why_department: str = Field(description="Reason why this department was selected")
    why_risk: str = Field(description="Reason why this risk level was assigned")
    why_verification: str = Field(description="Reason why this verification method was chosen")

class ArchitectOutput(BaseModel):
    maps: List[ArchitectMapItem]

def run_architect_agent(
    regulation_ref: str,
    regulation_title: str,
    regulator: str,
    summary: str,
    risk_level: str,
    penalty_clause: Optional[str] = None,
    affected_domains: List[str] = None
) -> ArchitectOutput:
    """
    Executes the Architect Agent. Evaluates regulatory metadata and generates structured Measurable Action Points (MAPs).
    Uses OpenAI GPT-4o-mini structured output if OPENAI_API_KEY is configured,
    otherwise executes a rule-based deterministic classifier as a fallback.
    """
    if settings.OPENAI_API_KEY:
        try:
            logger.info("Executing Architect Agent with GPT-4o-mini structured output...")
            from langchain_openai import ChatOpenAI
            
            llm = ChatOpenAI(
                model="gpt-4o-mini",
                api_key=settings.OPENAI_API_KEY,
                temperature=0
            )
            
            structured_llm = llm.with_structured_output(ArchitectOutput)
            
            prompt = f"""
            You are Architect Agent, an expert regulatory compliance architect.
            Your task is to transform regulatory intelligence extracted by Scout Agent into a list of Measurable Action Points (MAPs) for bank implementation.
            
            Source Regulation:
            Regulator: {regulator}
            Title: {regulation_title}
            ID/Ref: {regulation_ref}
            Summary: {summary}
            Assessed Risk Level: {risk_level}
            Enforcement/Penalty clauses: {penalty_clause or "None"}
            Affected Compliance Domains: {', '.join(affected_domains) if affected_domains else "None"}
            
            Every generated MAP must be:
            1. Specific: Clearly defined action item.
            2. Assignable: Map to exactly one department from this list:
               - Customer Operations
               - Retail Loans
               - Corporate Banking
               - Risk Management
               - Treasury
               - Cyber Security
               - IT Operations
               - Compliance
               - Legal
               - AML Team
               - Fraud Monitoring
               - Vendor Management
               - Human Resources
            3. Priority: High, Medium, or Low.
            4. Risk Level: Low, Medium, High, or Critical.
            5. Deadline: Date in YYYY-MM-DD format (must be before or on the regulation's effective date, or logically set based on complexity).
            6. Required Outcome: Verifiable, deadline-driven target outcome or metric.
            7. Verification Method: Audit verification method (e.g. Policy Review, Config Audit, System Audit, Contract Audit, Employee Sign-off).
            8. Confidence Score: A confidence score between 0.0 and 1.0.
            9. Justification reasoning blocks:
               - why_generated: Explanation of the regulatory clause driving this action.
               - why_department: Clear reasoning why the assigned department is responsible.
               - why_risk: Reason for the risk classification based on penalty clauses or deadline severity.
               - why_verification: Rationale for why the selected verification method validates the task.
            """
            
            result = structured_llm.invoke(prompt)
            return result
        except Exception as e:
            logger.error(f"Failed to execute OpenAI structured LLM, falling back to heuristic engine: {e}")
            # Fall through to fallback
            
    # Deterministic fallback logic
    logger.info("Executing Architect Agent heuristic rule-based parsing engine...")
    
    generated_items = []
    text_to_search = (regulation_title + " " + summary + " " + (penalty_clause or "")).lower()
    
    # Base deadline is current date + 30 days
    base_date = datetime.date.today() + datetime.timedelta(days=45)
    deadline_str = base_date.isoformat()
    
    # 1. Look for Cyber security triggers
    if any(kw in text_to_search for kw in ["cyber", "security", "ciso", "vapt", "penetration", "mfa", "auth", "biometric", "information security"]):
        # Map 1: CISO Appointment / Governance
        ciso_map = ArchitectMapItem(
            task_title="Designate and Appoint CISO & Cyber Governance Charter",
            task_description="Formalize Chief Information Security Officer (CISO) role specifications and secure board approval for the updated cybersecurity governance policy.",
            department="Cyber Security",
            priority="High",
            risk_level="Critical" if "penalty" in text_to_search else "High",
            deadline=(datetime.date.today() + datetime.timedelta(days=25)).isoformat(),
            required_outcome="Board resolution appointing a qualified CISO and approved Cybersecurity Charter.",
            verification_method="Policy Review",
            confidence_score=0.94,
            why_generated="The regulation explicitly mandates dedicated cybersecurity leadership and operational governance oversight.",
            why_department="Cyber Security is the designated team responsible for information security operational controls.",
            why_risk="Failure to designate a CISO exposes the bank to serious compliance failures and board-level penalties.",
            why_verification="Reviewing the formal board resolution and policy charter verifies legal appointment and operational mandate."
        )
        generated_items.append(ciso_map)
        
        # Map 2: VAPT & Audit
        audit_map = ArchitectMapItem(
            task_title="Conduct CERT-In Empanelled VAPT Security Audits",
            task_description="Execute comprehensive vulnerability assessment and penetration testing (VAPT) across core banking application endpoints using a Certified Auditor.",
            department="IT Operations",
            priority="High",
            risk_level="High",
            deadline=(datetime.date.today() + datetime.timedelta(days=60)).isoformat(),
            required_outcome="Signed VAPT remediation report and patch compliance checklist.",
            verification_method="System Audit",
            confidence_score=0.91,
            why_generated="Security circulars require yearly or periodic penetration tests to identify infrastructure vulnerabilities.",
            why_department="IT Operations manages hosting environments, patch pipelines, and infrastructure deployment.",
            why_risk="Unpatched security bugs can lead to data breaches and immediate regulatory warning notices.",
            why_verification="Checking system vulnerability logs and remediation receipts validates actual closure of threat doors."
        )
        generated_items.append(audit_map)

    # 2. Look for KYC / AML triggers
    if any(kw in text_to_search for kw in ["kyc", "aml", "know your customer", "laundering", "fiu", "suspicious", "str", "monitoring"]):
        # Map 1: KYC policy update
        kyc_map = ArchitectMapItem(
            task_title="Update KYC Customer Retention & Verification SOPs",
            task_description="Revise customer onboarding guidelines to incorporate updated identity verification steps, biometric details, and file retention policies.",
            department="Customer Operations",
            priority="High",
            risk_level="Critical" if "penalty" in text_to_search else "High",
            deadline=(datetime.date.today() + datetime.timedelta(days=30)).isoformat(),
            required_outcome="Updated KYC Standard Operating Procedure manual approved by Compliance Head.",
            verification_method="Policy Review",
            confidence_score=0.96,
            why_generated="The regulatory directive mandates stricter checks on customer record retention and identity validation.",
            why_department="Customer Operations manages frontline staff, account openings, and KYC data intake channels.",
            why_risk="Lax KYC controls lead directly to financial crime onboarding and massive statutory regulators' fines.",
            why_verification="Confirming the revised operations handbook guarantees the procedures are distributed to branches."
        )
        generated_items.append(kyc_map)

        # Map 2: Suspicious transaction rules
        aml_map = ArchitectMapItem(
            task_title="Deploy AML Monitoring and Suspicious Activity Rules",
            task_description="Incorporate crypto-asset transaction monitoring parameters and wallet monitoring triggers into the Suspicious Transaction Reporting (STR) ledger.",
            department="AML Team",
            priority="High",
            risk_level="High",
            deadline=(datetime.date.today() + datetime.timedelta(days=40)).isoformat(),
            required_outcome="AML detection rules deployed to production monitoring engine.",
            verification_method="System Audit",
            confidence_score=0.89,
            why_generated="FIU-IND mandates immediate reporting of crypto-asset transaction overlaps using updated patterns.",
            why_department="The AML Team is specifically structured to audit suspicious logs and file regulatory STR filings.",
            why_risk="Delayed or missed STR filings trigger audit violations and AML non-compliance citations.",
            why_verification="Simulating a transaction and verifying the rule flags it in the system proves active operational surveillance."
        )
        generated_items.append(aml_map)

    # 3. Look for Retail Lending triggers
    if any(kw in text_to_search for kw in ["loan", "borrower", "interest", "floating", "disbursement", "lending"]):
        loan_map = ArchitectMapItem(
            task_title="Configure Floating Interest Rate Borrowers Alerts",
            task_description="Implement system triggers to send automated reset notifications showing old/new EMI details to borrowers during rate shifts.",
            department="Retail Loans",
            priority="Medium",
            risk_level="Medium",
            deadline=(datetime.date.today() + datetime.timedelta(days=45)).isoformat(),
            required_outcome="Automated reset notification templates active in core system.",
            verification_method="System Audit",
            confidence_score=0.92,
            why_generated="Regulators require transparent floating benchmark rate notification to retail customers.",
            why_department="Retail Loans manages loan account servicing, pricing schedules, and floating rate sheets.",
            why_risk="Failing to alert borrowers triggers massive customer grievances and reputation risk.",
            why_verification="Checking customer communications log files for rate reset alerts validates compliance."
        )
        generated_items.append(loan_map)

    # 4. Look for Vendor outsourcing triggers
    if any(kw in text_to_search for kw in ["vendor", "outsourcing", "third party", "agreement", "contract"]):
        vendor_map = ArchitectMapItem(
            task_title="Amend Third-Party Outsourcing Service Agreements",
            task_description="Conduct audit of active SaaS and cloud provider agreements and execute contract addendums guaranteeing data audit rights.",
            department="Vendor Management",
            priority="Medium",
            risk_level="Medium",
            deadline=(datetime.date.today() + datetime.timedelta(days=50)).isoformat(),
            required_outcome="Executed contract addendums with critical security clauses for top tier vendors.",
            verification_method="Contract Audit",
            confidence_score=0.88,
            why_generated="Regulatory standards demand banks preserve explicit audit access rights for third-party systems.",
            why_department="Vendor Management handles supplier negotiations, service level reviews, and central contracting.",
            why_risk="A vendor data leak without explicit security indemnity or audit rights leaves the bank legally exposed.",
            why_verification="Examining contract files for security clauses ensures the legal shield is active."
        )
        generated_items.append(vendor_map)

    # Default fallback if nothing specifically matches
    if not generated_items:
        general_map = ArchitectMapItem(
            task_title="Perform General Compliance Audit & Policy Update",
            task_description="Update the bank's internal compliance manual to integrate regulatory references, and perform a gaps assessment review.",
            department="Compliance",
            priority="Medium",
            risk_level="Medium",
            deadline=deadline_str,
            required_outcome="Compliance manuals updated with references and approved by Board.",
            verification_method="Policy Review",
            confidence_score=0.85,
            why_generated="General regulatory ingestion mandates periodic manual revision and policy alignment checks.",
            why_department="Compliance division monitors systemic updates and coordinates policy audits across teams.",
            why_risk="Outdated policies lead to gradual drift and systemic audit compliance marks.",
            why_verification="Checking the manual revision history and board approval seal validates compliance."
        )
        generated_items.append(general_map)

    return ArchitectOutput(maps=generated_items)

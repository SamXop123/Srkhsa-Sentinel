from pydantic import BaseModel, Field
from typing import Optional, List
from app.core.config import settings
import logging
import re
import datetime

logger = logging.getLogger("SuRakshaSentinel.Scout")

class ScoutOutput(BaseModel):
    regulation_id: str = Field(description="The unique identifier or reference number of the regulation (e.g. circular number)")
    title: str = Field(description="The primary title of the regulation")
    regulator: str = Field(description="The name of the regulator (e.g., RBI, SEBI, FIU-IND)")
    effective_date: str = Field(description="The effective date of the regulation in YYYY-MM-DD format")
    penalty_clause: Optional[str] = Field(None, description="Direct quotes or summary of any penalty or enforcement clauses, or null if none exist")
    risk_level: str = Field(description="Assessed risk level: High, Medium, or Low")
    affected_domains: List[str] = Field(description="List of domains affected (e.g. KYC, AML, Cybersecurity, Retail Lending, Risk Management, Customer Operations)")
    summary: str = Field(description="Detailed executive summary of the regulation requirements")

def run_scout_agent(
    raw_text: str,
    source_org: str,
    publication_date: str,
    circular_number: str,
    circular_title: str
) -> ScoutOutput:
    """
    Executes the Scout Agent. Extracts structured regulation details from raw circular text.
    Uses OpenAI GPT-4o-mini structured output if OPENAI_API_KEY is configured,
    otherwise executes a regex-based heuristic extractor as a robust fallback.
    """
    if settings.OPENAI_API_KEY:
        try:
            logger.info("Executing Scout Agent with GPT-4o-mini structured output...")
            from langchain_openai import ChatOpenAI
            
            llm = ChatOpenAI(
                model="gpt-4o-mini",
                api_key=settings.OPENAI_API_KEY,
                temperature=0
            )
            
            structured_llm = llm.with_structured_output(ScoutOutput)
            
            prompt = f"""
            You are Scout Agent, an AI regulatory compliance auditor.
            Analyze the following official banking circular text and extract structured regulatory specifications.
            
            Source Organization: {source_org}
            Circular Number: {circular_number}
            Circular Title: {circular_title}
            Ingested Date: {publication_date}
            
            Circular Document Text:
            {raw_text[:40000]}
            
            Perform detailed extraction of regulation ID, title, regulator, effective date, penalty clauses, risk level, affected domains, and a comprehensive summary.
            """
            
            result = structured_llm.invoke(prompt)
            return result
        except Exception as e:
            logger.error(f"Failed to execute OpenAI structured LLM, falling back to heuristic engine: {e}")
            # Fall through to fallback
            
    # Deterministic heuristic fallback engine
    logger.info("Executing Scout Agent heuristic rule-based parsing engine...")
    
    # 1. Regulation ID
    reg_id = circular_number or "RBI/2026-27/MOCK-1"
    
    # 2. Title
    title = circular_title or f"Compliance Mandates on {source_org} Directives"
    
    # 3. Regulator
    regulator = source_org
    
    # 4. Effective Date - Look for YYYY-MM-DD or parse from text
    effective_date = publication_date
    date_matches = re.findall(r'\b(202\d-\d{2}-\d{2})\b', raw_text)
    if date_matches:
        effective_date = date_matches[0]
    else:
        # Search for months e.g. "July 1, 2026"
        month_match = re.search(r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+202\d', raw_text, re.IGNORECASE)
        if month_match:
            try:
                dt = datetime.datetime.strptime(month_match.group(0), "%B %d, %Y")
                effective_date = dt.date().isoformat()
            except Exception:
                pass

    # 5. Penalty Clause search
    penalty_matches = []
    penalty_keywords = ["penalty", "fine", "lakh", "crore", "imprisonment", "violation", "non-compliance", "penalty of"]
    for sentence in re.split(r'(?<=[.!?])\s+', raw_text):
        if any(kw in sentence.lower() for kw in penalty_keywords):
            if len(sentence.strip()) > 15:
                penalty_matches.append(sentence.strip())
                if len(penalty_matches) >= 3:
                    break
                    
    penalty_clause = " ".join(penalty_matches) if penalty_matches else None
    
    # 6. Risk Level
    risk_level = "Medium"
    if penalty_clause or any(kw in raw_text.lower() for kw in ["critical", "high risk", "severe penalty"]):
        risk_level = "High"
    if any(kw in raw_text.lower() for kw in ["ciso", "biometric", "fraud", "cybersecurity"]):
        risk_level = "Critical"

    # 7. Affected Domains
    domains = []
    domain_map = {
        "kyc": "KYC",
        "aml": "AML",
        "know your customer": "KYC",
        "cyber": "Cybersecurity",
        "information security": "Cybersecurity",
        "digital lending": "Retail Lending",
        "loan": "Retail Lending",
        "floating": "Retail Lending",
        "interest": "Retail Lending",
        "treasury": "Treasury",
        "liquidity": "Risk Management",
        "risk": "Risk Management",
        "outsourcing": "Vendor Management",
        "third party": "Vendor Management",
        "grievance": "Customer Operations",
        "complaint": "Customer Operations"
    }
    for key, val in domain_map.items():
        if key in raw_text.lower() and val not in domains:
            domains.append(val)
            
    if not domains:
        domains = ["General Compliance"]

    # 8. Executive Summary
    summary = f"This document outlines regulatory requirements issued by {source_org} regarding {title}. It establishes crucial parameters for risk classification and mandates strict implementation procedures across {', '.join(domains)} domains. reg_id: {reg_id}."
    
    return ScoutOutput(
        regulation_id=reg_id,
        title=title,
        regulator=regulator,
        effective_date=effective_date,
        penalty_clause=penalty_clause,
        risk_level=risk_level,
        affected_domains=domains,
        summary=summary
    )

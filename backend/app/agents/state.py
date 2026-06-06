from typing import TypedDict, List, Dict, Any, Optional

class AgentExecutionLog(TypedDict):
    timestamp: str
    agent: str
    message: str
    level: str  # INFO, WARNING, ERROR

class ComplianceGraphState(TypedDict):
    # Core reference identifiers
    circular_id: str
    file_path: str
    
    # Scout parsed nodes
    parsed_clauses: List[Dict[str, Any]]
    
    # Architect translation nodes
    generated_maps: List[Dict[str, Any]]
    
    # Dispatcher task mappings
    task_ids: List[str]
    
    # Auditor verification nodes
    verification_results: List[Dict[str, Any]]
    
    # Active logger states
    execution_logs: List[AgentExecutionLog]
    
    # Tracking status
    current_node: str
    errors: List[str]

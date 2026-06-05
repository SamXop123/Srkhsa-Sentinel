export interface AgentExecutionLog {
  timestamp: string;
  agent: "Scout" | "Architect" | "Dispatcher" | "Auditor";
  message: string;
  level: "INFO" | "WARNING" | "ERROR";
}

export interface ComplianceGraphState {
  circular_id: string;
  file_path: string;
  parsed_clauses: Array<{
    clause_number: string;
    clause_title?: string;
    clause_text: string;
    penalty_details?: string;
    effective_date: string;
  }>;
  generated_maps: Array<{
    regulation_id?: string;
    description: string;
    risk_classification: "High" | "Medium" | "Low";
    department_id: string;
    created_by_agent: boolean;
  }>;
  task_ids: string[];
  verification_results: Array<{
    task_id: string;
    status: "Verified" | "Rejected";
    verification_notes: string;
  }>;
  execution_logs: AgentExecutionLog[];
  current_node: string;
}

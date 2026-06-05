export type RoleName = "Admin" | "Auditor" | "Compliance Officer" | "Department Head" | "CEO";

export interface Role {
  id: string;
  name: RoleName;
  description: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_id: string;
  department_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  manager_id: string | null;
  created_at: string;
}

export type CircularStatus = "Ingested" | "Parsing" | "Parsed" | "MAP_Generated" | "Dispatched" | "Failed";

export interface Circular {
  id: string;
  title: string;
  source_org: "RBI" | "SEBI" | "FIU-IND";
  circular_number: string;
  publication_date: string;
  file_path: string;
  status: CircularStatus;
  raw_metadata: Record<string, any>;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface Regulation {
  id: string;
  circular_id: string;
  clause_number: string;
  clause_title: string | null;
  clause_text: string;
  penalty_details: string | null;
  effective_date: string;
  created_at: string;
}

export type MapStatus = "Pending_Review" | "Approved" | "Rejected";
export type RiskClassification = "High" | "Medium" | "Low";

export interface MAP {
  id: string;
  regulation_id: string;
  description: string;
  risk_classification: RiskClassification;
  department_id: string;
  status: MapStatus;
  created_by_agent: boolean;
  auditor_review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = "Pending" | "In_Progress" | "Under_Review" | "Completed" | "Overdue";

export interface Task {
  id: string;
  map_id: string;
  title: string;
  description: string;
  department_id: string;
  assigned_to_user_id: string | null;
  status: TaskStatus;
  deadline: string;
  evidence_file_path: string | null;
  evidence_uploaded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplianceRecord {
  id: string;
  task_id: string;
  auditor_id: string;
  status: "Verified" | "Rejected";
  verification_notes: string;
  verified_at: string;
  created_at: string;
}

export interface Escalation {
  id: string;
  task_id: string;
  level: 1 | 2 | 3;
  status: "Open" | "Resolved";
  trigger_reason: string;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "Task_Assignment" | "Overdue_Task" | "Escalation" | "Audit_Alert";
  read_status: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  target_table: string;
  target_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  payload: Record<string, any>;
  created_at: string;
}

export interface AgentLog {
  id: string;
  circular_id: string;
  agent_name: "Scout" | "Architect" | "Dispatcher" | "Auditor";
  log_level: "INFO" | "WARNING" | "ERROR";
  message: string;
  created_at: string;
}

import { User, MAP, Task, Circular, CircularStatus, RiskClassification } from "./database";

// Auth Endpoint Payloads
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

// Circular Status Payload
export interface CircularUploadResponse {
  circular_id: string;
  status: "Ingested";
  message: string;
}

export interface CircularStatusResponse {
  circular_id: string;
  status: CircularStatus;
  current_agent: "Scout" | "Architect" | "Dispatcher" | "Auditor" | null;
  last_updated: string;
}

// MAP Review Action
export interface MapReviewRequest {
  status: "Approved" | "Rejected";
  description: string;
  risk_classification: RiskClassification;
  department_id: string;
  auditor_review_notes?: string;
}

// Task Evidence Submission
export interface EvidenceSubmitResponse {
  task_id: string;
  status: "Under_Review";
  evidence_file_path: string;
  evidence_uploaded_at: string;
}

// Heatmap Payload
export interface DepartmentHeatmapMetrics {
  name: string;
  compliance_score: number; // 0 to 100
  total_tasks: number;
  completed: number;
  overdue: number;
}

export interface ComplianceHeatmapResponse {
  overall_compliance_score: number;
  departments: DepartmentHeatmapMetrics[];
}

// Escalation Actions
export interface ResolveEscalationRequest {
  resolution_notes: string;
}

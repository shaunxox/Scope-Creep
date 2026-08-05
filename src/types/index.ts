// ─── Core Domain Types ────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export interface StagedTask {
  id?: string;
  project_id?: string;
  title: string;
  description: string;
  complexity: "low" | "medium" | "high";
  category: string;
  status?: "staged" | "approved" | "rejected";
  created_at?: string;
}

export interface BaselineItem {
  id: string;
  project_id?: string;
  deliverable: string;
  exclusions: string | null;
  assumptions: string | null;
  source_text?: string;
}

export interface ScopeEvent {
  id: string;
  project_id: string;
  request_text: string;
  verdict: "in_scope" | "out_of_scope";
  discrepancy_note: string;
  extra_hours: number;
  extra_cost: number;
  status: "pending" | "quoted" | "resolved";
  created_at?: string;
}

export interface EmailDraft {
  subject: string;
  body: string;
  email?: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiError {
  error: string;
}

export interface ProjectsResponse {
  projects: Project[];
}

export interface ProjectResponse {
  project: Project;
}

export interface StagedTasksResponse {
  tasks: StagedTask[];
}

export interface ExtractResponse {
  tasks: StagedTask[];
}

export interface BaselineResponse {
  items: BaselineItem[];
}

export interface ScopeCheckResponse {
  scopeEvent: ScopeEvent;
}

export interface EmailDraftResponse extends EmailDraft {
  email: string;
}

// ─── UI State Types ───────────────────────────────────────────────────────────

export type ActiveTab = "phase1" | "phase2";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info" | "brand";

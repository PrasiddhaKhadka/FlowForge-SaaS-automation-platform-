export type Role = "owner" | "admin" | "member";

export type TriggerConfigType = "webhook" | "schedule" | "email";

export type ActionConfigType = "http_request" | "send_email" | "slack_message";

export type JobStatus = "queued" | "running" | "success" | "failed";

export type JobCompletedStatus = "success" | "failed";

export interface User {
  id: string;
  email: string;
  orgId: string;
  role: Role;
  createdAt: Date;
}

export interface Workflow {
  id: string;
  orgId: string;
  name: string;
  trigger: TriggerConfig;
  actions: ActionConfig[];
  isActive: boolean;
  createdAt: Date;
}

export interface TriggerConfig {
  type: TriggerConfigType;
  config: Record<string, unknown>;
}

export interface ActionConfig {
  id: string;
  type: ActionConfigType;
  config: Record<string, unknown>;
}

export interface Job {
  id: string;
  workflowId: string;
  orgId: string;
  status: JobStatus;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface JobCompletedEvent {
  jobId: string;
  workflowId: string;
  orgId: string;
  userId: string;
  status: JobCompletedStatus;
  completedAt: Date;
  error?: string;
}

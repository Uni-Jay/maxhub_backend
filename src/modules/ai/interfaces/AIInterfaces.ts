export type GeminiModel = 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.5-flash-lite' | 'gemini-3.5-flash';
export type AIRole = 'system' | 'user' | 'assistant';
export type AIFeature = 'chat' | 'report' | 'summarize' | 'email' | 'tasks' | 'reminder';
export type ReportType = 'attendance' | 'payroll' | 'leave' | 'performance';
export type EmailType =
  | 'leave_approval'
  | 'leave_rejection'
  | 'meeting_invitation'
  | 'payroll_notification'
  | 'warning_letter'
  | 'onboarding';
export type ReminderType = 'payroll' | 'meeting' | 'approval' | 'contract_renewal' | 'leave' | 'birthday';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface AIMessage {
  role: AIRole;
  content: string;
}

// ── Chat ────────────────────────────────────────────────────
export interface ChatRequest {
  messages: AIMessage[];
  model?: string;
  conversationId?: string;
}

export interface ChatResponse {
  reply: string;
  model: string;
  conversationId?: string;
}

// ── Report ──────────────────────────────────────────────────
export interface ReportRequest {
  type: ReportType;
  data: Record<string, unknown>;
  period?: string;
  staffId?: number;
  departmentId?: number;
  model?: string;
}

export interface ReportResponse {
  report: string;
  type: ReportType;
  generatedAt: string;
}

// ── Meeting Summary ─────────────────────────────────────────
export interface MeetingSummaryRequest {
  title: string;
  transcript: string;
  participants?: string[];
  model?: string;
}

export interface ActionItem {
  task: string;
  assignee?: string;
  deadline?: string;
  priority: TaskPriority;
}

export interface MeetingSummaryResponse {
  title: string;
  summary: string;
  actionItems: ActionItem[];
  keyDecisions: string[];
  nextSteps: string[];
  model: string;
}

// ── Email Draft ─────────────────────────────────────────────
export interface EmailDraftRequest {
  type: EmailType;
  recipient: string;
  context: Record<string, unknown>;
  model?: string;
}

export interface EmailDraftResponse {
  subject: string;
  body: string;
  type: EmailType;
}

// ── Task Suggestions ────────────────────────────────────────
export interface TaskSuggestionRequest {
  overdueTasks: TaskItem[];
  pendingTasks: TaskItem[];
  teamWorkload?: TeamMemberWorkload[];
  model?: string;
}

export interface TaskItem {
  id: string | number;
  title: string;
  dueDate?: string;
  assignee?: string;
  priority?: string;
  status?: string;
  projectName?: string;
}

export interface TeamMemberWorkload {
  name: string;
  activeTasks: number;
  overdueTasks: number;
}

export interface TaskSuggestion {
  taskId?: string | number;
  action: string;
  reason: string;
  priority: TaskPriority;
}

export interface TaskSuggestionResponse {
  priorityOrder: (string | number)[];
  suggestions: TaskSuggestion[];
  workloadNotes: string;
}

// ── Smart Reminder ──────────────────────────────────────────
export interface ReminderRequest {
  type: ReminderType;
  context: Record<string, unknown>;
  model?: string;
}

export interface ReminderResponse {
  title: string;
  message: string;
  urgency: 'critical' | 'high' | 'normal';
  suggestedSendTime?: string;
}

export type OllamaModel = 'llama3' | 'deepseek-r1' | 'mistral' | 'gemma';
export type AIRole = 'system' | 'user' | 'assistant';
export type AIFeature = 'chat' | 'report' | 'summarize' | 'email' | 'tasks' | 'reminder';
export type ReportType = 'attendance' | 'payroll' | 'leave' | 'performance';
export type EmailType = 'leave_approval' | 'leave_rejection' | 'meeting_invitation' | 'payroll_notification' | 'warning_letter' | 'onboarding';
export type ReminderType = 'payroll' | 'meeting' | 'approval' | 'contract_renewal' | 'leave' | 'birthday';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export interface AIMessage {
    role: AIRole;
    content: string;
}
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
export interface OllamaMessage {
    role: AIRole;
    content: string;
}
export interface OllamaChatPayload {
    model: string;
    messages: OllamaMessage[];
    stream: false;
    options?: {
        temperature?: number;
        top_p?: number;
        num_ctx?: number;
    };
}
export interface OllamaChatApiResponse {
    model: string;
    message: OllamaMessage;
    done: boolean;
    eval_count?: number;
}
//# sourceMappingURL=AIInterfaces.d.ts.map
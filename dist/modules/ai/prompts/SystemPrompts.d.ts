export declare const ROLE_SYSTEM_PROMPTS: Record<string, string>;
export declare function buildChatSystem(roleName: string, userName?: string, businessUnit?: string): string;
export declare function buildReportPrompt(type: string, data: Record<string, unknown>, period?: string): string;
export declare function buildMeetingSummaryPrompt(title: string, transcript: string, participants?: string[]): string;
export declare function buildEmailPrompt(type: string, recipient: string, context: Record<string, unknown>): string;
export declare function buildTaskSuggestionsPrompt(overdueTasks: unknown[], pendingTasks: unknown[], teamWorkload?: unknown[]): string;
export declare function buildReminderPrompt(type: string, context: Record<string, unknown>): string;
//# sourceMappingURL=SystemPrompts.d.ts.map
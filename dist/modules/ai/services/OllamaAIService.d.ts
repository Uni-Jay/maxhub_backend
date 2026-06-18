import type { ChatToolDeclaration } from '../providers/AIProvider.interface';
import { AIConversation } from '../models/AIConversation.model';
import { AIMessage } from '../models/AIMessage.model';
import { AIMeetingSummary } from '../models/AIMeetingSummary.model';
import { AIReminder } from '../models/AIReminder.model';
import type { ChatRequest, ChatResponse, ReportRequest, ReportResponse, MeetingSummaryRequest, MeetingSummaryResponse, EmailDraftRequest, EmailDraftResponse, TaskSuggestionRequest, TaskSuggestionResponse, ReminderRequest, ReminderResponse } from '../interfaces/AIInterfaces';
declare class OllamaAIService {
    chat(request: ChatRequest, userId: number | bigint, roleName: string, userName?: string, businessUnit?: string, toolSupport?: {
        tools: ChatToolDeclaration[];
        executeTool: (name: string, args: Record<string, unknown>) => Promise<string>;
    }): Promise<ChatResponse>;
    generateReport(request: ReportRequest, userId: number | bigint): Promise<ReportResponse>;
    summarizeMeeting(request: MeetingSummaryRequest, userId: number | bigint): Promise<MeetingSummaryResponse>;
    draftEmail(request: EmailDraftRequest, userId: number | bigint): Promise<EmailDraftResponse>;
    suggestTasks(request: TaskSuggestionRequest, userId: number | bigint): Promise<TaskSuggestionResponse>;
    generateReminder(request: ReminderRequest, userId: number | bigint): Promise<ReminderResponse>;
    listConversations(userId: number | bigint, feature?: string): Promise<AIConversation[]>;
    getConversation(uuid: string, userId: number | bigint): Promise<{
        conversation: AIConversation;
        messages: AIMessage[];
    } | null>;
    getMeetingSummaries(userId: number | bigint): Promise<AIMeetingSummary[]>;
    getReminders(userId: number | bigint): Promise<AIReminder[]>;
}
declare const _default: OllamaAIService;
export default _default;
//# sourceMappingURL=OllamaAIService.d.ts.map
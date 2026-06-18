import { Request, Response } from 'express';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import OllamaAIService from '../services/OllamaAIService';
import { getActiveProvider, getActiveProviderName } from '../providers/ProviderFactory';
import { ERP_TOOL_DECLARATIONS, createToolExecutor } from '../tools/ERPTools';
import type {
  ChatRequest,
  ReportRequest,
  MeetingSummaryRequest,
  EmailDraftRequest,
  TaskSuggestionRequest,
  ReminderRequest,
  OllamaModel,
} from '../interfaces/AIInterfaces';

function getUser(req: Request) {
  return (req as any).user as {
    id: number;
    roles: string[];
    name?: string;
    businessUnit?: string;
  };
}

export class AIController {
  // GET /api/ai/status
  static async status(req: Request, res: Response): Promise<void> {
    const provider = getActiveProvider();
    const providerName = getActiveProviderName();
    const available = await provider.isAvailable();
    const models = available ? await provider.listModels() : [];
    ResponseFormatter.success(res, {
      provider: providerName,
      available,
      activeModel: provider.getDefaultModel(),
      availableModels: models,
      supportedModels: provider.getSupportedModels(),
      // legacy fields kept for the existing frontend status banner
      ollamaAvailable: providerName === 'ollama' && available,
      ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    }, available ? `${providerName} is available` : `${providerName} is not available`);
  }

  // POST /api/ai/chat
  static async chat(req: Request, res: Response): Promise<void> {
    const { messages, model, conversationId } = req.body as ChatRequest;
    if (!Array.isArray(messages) || messages.length === 0) {
      ResponseFormatter.error(res, 'messages array is required', 400);
      return;
    }

    const user = getUser(req);
    const roleName = user.roles?.[0] ?? 'staff';

    const result = await OllamaAIService.chat(
      { messages, model: model as OllamaModel, conversationId },
      user.id,
      roleName,
      user.name,
      user.businessUnit,
      { tools: ERP_TOOL_DECLARATIONS, executeTool: createToolExecutor(req) },
    );

    ResponseFormatter.success(res, result, 'AI response generated');
  }

  // POST /api/ai/report
  static async generateReport(req: Request, res: Response): Promise<void> {
    const { type, data, period, staffId, departmentId, model } = req.body as ReportRequest;
    if (!type || !data) {
      ResponseFormatter.error(res, 'type and data are required', 400);
      return;
    }

    const user = getUser(req);
    const result = await OllamaAIService.generateReport({ type, data, period, staffId, departmentId, model }, user.id);
    ResponseFormatter.success(res, result, 'Report generated');
  }

  // POST /api/ai/summarize
  static async summarizeMeeting(req: Request, res: Response): Promise<void> {
    const { title, transcript, participants, model } = req.body as MeetingSummaryRequest;
    if (!transcript?.trim()) {
      ResponseFormatter.error(res, 'transcript is required', 400);
      return;
    }

    const user = getUser(req);
    const result = await OllamaAIService.summarizeMeeting(
      { title: title || 'Untitled Meeting', transcript, participants, model },
      user.id,
    );
    ResponseFormatter.success(res, result, 'Meeting summarized');
  }

  // POST /api/ai/email-draft
  static async draftEmail(req: Request, res: Response): Promise<void> {
    const { type, recipient, context, model } = req.body as EmailDraftRequest;
    if (!type || !recipient) {
      ResponseFormatter.error(res, 'type and recipient are required', 400);
      return;
    }

    const user = getUser(req);
    const result = await OllamaAIService.draftEmail({ type, recipient, context: context || {}, model }, user.id);
    ResponseFormatter.success(res, result, 'Email draft generated');
  }

  // POST /api/ai/task-suggestions
  static async taskSuggestions(req: Request, res: Response): Promise<void> {
    const { overdueTasks, pendingTasks, teamWorkload, model } = req.body as TaskSuggestionRequest;
    if (!Array.isArray(overdueTasks) || !Array.isArray(pendingTasks)) {
      ResponseFormatter.error(res, 'overdueTasks and pendingTasks arrays are required', 400);
      return;
    }

    const user = getUser(req);
    const result = await OllamaAIService.suggestTasks({ overdueTasks, pendingTasks, teamWorkload, model }, user.id);
    ResponseFormatter.success(res, result, 'Task suggestions generated');
  }

  // POST /api/ai/reminder
  static async generateReminder(req: Request, res: Response): Promise<void> {
    const { type, context, model } = req.body as ReminderRequest;
    if (!type) {
      ResponseFormatter.error(res, 'type is required', 400);
      return;
    }

    const user = getUser(req);
    const result = await OllamaAIService.generateReminder({ type, context: context || {}, model }, user.id);
    ResponseFormatter.success(res, result, 'Reminder generated');
  }

  // GET /api/ai/conversations
  static async listConversations(req: Request, res: Response): Promise<void> {
    const user = getUser(req);
    const feature = req.query.feature as string | undefined;
    const data = await OllamaAIService.listConversations(user.id, feature);
    ResponseFormatter.success(res, data);
  }

  // GET /api/ai/conversations/:uuid
  static async getConversation(req: Request, res: Response): Promise<void> {
    const user = getUser(req);
    const data = await OllamaAIService.getConversation(req.params.uuid, user.id);
    if (!data) {
      ResponseFormatter.notFound(res, 'Conversation not found');
      return;
    }
    ResponseFormatter.success(res, data);
  }

  // GET /api/ai/meeting-summaries
  static async listMeetingSummaries(req: Request, res: Response): Promise<void> {
    const user = getUser(req);
    const data = await OllamaAIService.getMeetingSummaries(user.id);
    ResponseFormatter.success(res, data);
  }

  // GET /api/ai/reminders
  static async listReminders(req: Request, res: Response): Promise<void> {
    const user = getUser(req);
    const data = await OllamaAIService.getReminders(user.id);
    ResponseFormatter.success(res, data);
  }
}

export default AIController;

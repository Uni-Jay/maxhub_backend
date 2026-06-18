import { getActiveProvider } from '../providers/ProviderFactory';
import type { ChatToolDeclaration } from '../providers/AIProvider.interface';
import {
  buildChatSystem,
  buildReportPrompt,
  buildMeetingSummaryPrompt,
  buildEmailPrompt,
  buildTaskSuggestionsPrompt,
  buildReminderPrompt,
} from '../prompts/SystemPrompts';
import { AIConversation } from '../models/AIConversation.model';
import { AIMessage } from '../models/AIMessage.model';
import { AIMeetingSummary } from '../models/AIMeetingSummary.model';
import { AIReminder } from '../models/AIReminder.model';
import type {
  ChatRequest,
  ChatResponse,
  ReportRequest,
  ReportResponse,
  MeetingSummaryRequest,
  MeetingSummaryResponse,
  EmailDraftRequest,
  EmailDraftResponse,
  TaskSuggestionRequest,
  TaskSuggestionResponse,
  ReminderRequest,
  ReminderResponse,
} from '../interfaces/AIInterfaces';

function safeParseJSON<T>(text: string, fallback: T): T {
  // Extract JSON from response even if the model wrapped it in markdown
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) return fallback;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return fallback;
  }
}

class AIAssistantService {
  // ── Chat ──────────────────────────────────────────────────

  async chat(
    request: ChatRequest,
    userId: number | bigint,
    roleName: string,
    userName?: string,
    businessUnit?: string,
    toolSupport?: {
      tools: ChatToolDeclaration[];
      executeTool: (name: string, args: Record<string, unknown>) => Promise<string>;
    },
  ): Promise<ChatResponse> {
    const model = request.model ?? process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
    const systemPrompt = buildChatSystem(roleName, userName, businessUnit);

    const chatMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...request.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const provider = getActiveProvider();
    const reply = toolSupport
      ? await provider.chatWithTools(chatMessages, toolSupport.tools, toolSupport.executeTool, model)
      : await provider.chat(chatMessages, model);

    // Persist conversation + messages
    let conversationId = request.conversationId;
    let conversation: AIConversation | null = null;

    if (conversationId) {
      conversation = await AIConversation.findOne({ where: { uuid: conversationId, userId: BigInt(userId) } });
    }

    if (!conversation) {
      const firstUserMsg = request.messages.find((m) => m.role === 'user')?.content ?? 'New chat';
      conversation = await AIConversation.create({
        userId: BigInt(userId),
        title: firstUserMsg.slice(0, 80),
        model,
        feature: 'chat',
        messageCount: 0,
      });
    }

    // Persist only the latest user message + AI reply
    const lastUserMsg = request.messages[request.messages.length - 1];
    if (lastUserMsg?.role === 'user') {
      await AIMessage.create({ conversationId: conversation.id, role: 'user', content: lastUserMsg.content });
    }
    await AIMessage.create({ conversationId: conversation.id, role: 'assistant', content: reply });
    await conversation.update({ messageCount: conversation.messageCount + 2 });

    return { reply, model, conversationId: conversation.uuid };
  }

  // ── Report Generation ─────────────────────────────────────

  async generateReport(request: ReportRequest, userId: number | bigint): Promise<ReportResponse> {
    const model = request.model ?? process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
    const prompt = buildReportPrompt(request.type, request.data, request.period);

    const report = await getActiveProvider().generate(prompt, model, 0.4);

    // Save to conversation log
    const conv = await AIConversation.create({
      userId: BigInt(userId),
      title: `${request.type} Report — ${request.period ?? new Date().toLocaleDateString()}`,
      model,
      feature: 'report',
      messageCount: 2,
    });
    await AIMessage.bulkCreate([
      { conversationId: conv.id, role: 'user', content: `Generate ${request.type} report` },
      { conversationId: conv.id, role: 'assistant', content: report },
    ]);

    return { report, type: request.type, generatedAt: new Date().toISOString() };
  }

  // ── Meeting Summary ───────────────────────────────────────

  async summarizeMeeting(request: MeetingSummaryRequest, userId: number | bigint): Promise<MeetingSummaryResponse> {
    const model = request.model ?? process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
    const prompt = buildMeetingSummaryPrompt(request.title, request.transcript, request.participants);

    const raw = await getActiveProvider().generate(prompt, model, 0.3);
    const parsed = safeParseJSON<Partial<MeetingSummaryResponse>>(raw, {});

    const result: MeetingSummaryResponse = {
      title: request.title,
      summary: parsed.summary ?? raw,
      actionItems: parsed.actionItems ?? [],
      keyDecisions: parsed.keyDecisions ?? [],
      nextSteps: parsed.nextSteps ?? [],
      model,
    };

    // Persist
    await AIMeetingSummary.create({
      userId: BigInt(userId),
      title: request.title,
      transcript: request.transcript,
      summary: result.summary,
      actionItems: result.actionItems,
      keyDecisions: result.keyDecisions,
      nextSteps: result.nextSteps,
      participants: request.participants,
      model,
    });

    return result;
  }

  // ── Email Drafting ────────────────────────────────────────

  async draftEmail(request: EmailDraftRequest, userId: number | bigint): Promise<EmailDraftResponse> {
    const model = request.model ?? process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
    const prompt = buildEmailPrompt(request.type, request.recipient, request.context);

    const raw = await getActiveProvider().generate(prompt, model, 0.6);
    const parsed = safeParseJSON<{ subject?: string; body?: string }>(raw, {});

    const result: EmailDraftResponse = {
      subject: parsed.subject ?? `${request.type.replace(/_/g, ' ')} — ${new Date().toLocaleDateString()}`,
      body: parsed.body ?? raw,
      type: request.type,
    };

    // Log to conversation
    const conv = await AIConversation.create({
      userId: BigInt(userId),
      title: `Email: ${result.subject.slice(0, 60)}`,
      model,
      feature: 'email',
      messageCount: 2,
    });
    await AIMessage.bulkCreate([
      { conversationId: conv.id, role: 'user', content: `Draft ${request.type} email to ${request.recipient}` },
      { conversationId: conv.id, role: 'assistant', content: JSON.stringify(result) },
    ]);

    return result;
  }

  // ── Task Suggestions ──────────────────────────────────────

  async suggestTasks(request: TaskSuggestionRequest, userId: number | bigint): Promise<TaskSuggestionResponse> {
    const model = request.model ?? process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
    const prompt = buildTaskSuggestionsPrompt(request.overdueTasks, request.pendingTasks, request.teamWorkload);

    const raw = await getActiveProvider().generate(prompt, model, 0.4);
    const parsed = safeParseJSON<Partial<TaskSuggestionResponse>>(raw, {});

    return {
      priorityOrder: parsed.priorityOrder ?? [],
      suggestions: parsed.suggestions ?? [],
      workloadNotes: parsed.workloadNotes ?? raw,
    };
  }

  // ── Smart Reminder ────────────────────────────────────────

  async generateReminder(request: ReminderRequest, userId: number | bigint): Promise<ReminderResponse> {
    const model = request.model ?? process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
    const prompt = buildReminderPrompt(request.type, request.context);

    const raw = await getActiveProvider().generate(prompt, model, 0.5);
    const parsed = safeParseJSON<Partial<ReminderResponse>>(raw, {});

    const result: ReminderResponse = {
      title: parsed.title ?? `${request.type} Reminder`,
      message: parsed.message ?? raw,
      urgency: parsed.urgency ?? 'normal',
      suggestedSendTime: parsed.suggestedSendTime,
    };

    // Persist reminder
    await AIReminder.create({
      userId: BigInt(userId),
      type: request.type,
      title: result.title,
      message: result.message,
      urgency: result.urgency,
      suggestedSendTime: result.suggestedSendTime,
      context: request.context,
      model,
      sent: false,
    });

    return result;
  }

  // ── History ───────────────────────────────────────────────

  async listConversations(userId: number | bigint, feature?: string) {
    const where: Record<string, unknown> = { userId: BigInt(userId) };
    if (feature) where.feature = feature;
    return AIConversation.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
  }

  async getConversation(uuid: string, userId: number | bigint) {
    const conv = await AIConversation.findOne({ where: { uuid, userId: BigInt(userId) } });
    if (!conv) return null;
    const messages = await AIMessage.findAll({
      where: { conversationId: conv.id },
      order: [['createdAt', 'ASC']],
    });
    return { conversation: conv, messages };
  }

  async getMeetingSummaries(userId: number | bigint) {
    return AIMeetingSummary.findAll({
      where: { userId: BigInt(userId) },
      order: [['createdAt', 'DESC']],
      limit: 30,
    });
  }

  async getReminders(userId: number | bigint) {
    return AIReminder.findAll({
      where: { userId: BigInt(userId) },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
  }
}

export default new AIAssistantService();

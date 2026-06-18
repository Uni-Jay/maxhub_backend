"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ProviderFactory_1 = require("../providers/ProviderFactory");
const SystemPrompts_1 = require("../prompts/SystemPrompts");
const AIConversation_model_1 = require("../models/AIConversation.model");
const AIMessage_model_1 = require("../models/AIMessage.model");
const AIMeetingSummary_model_1 = require("../models/AIMeetingSummary.model");
const AIReminder_model_1 = require("../models/AIReminder.model");
function safeParseJSON(text, fallback) {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match)
        return fallback;
    try {
        return JSON.parse(match[0]);
    }
    catch {
        return fallback;
    }
}
class AIAssistantService {
    async chat(request, userId, roleName, userName, businessUnit, toolSupport) {
        const model = request.model ?? process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
        const systemPrompt = (0, SystemPrompts_1.buildChatSystem)(roleName, userName, businessUnit);
        const chatMessages = [
            { role: 'system', content: systemPrompt },
            ...request.messages.map((m) => ({ role: m.role, content: m.content })),
        ];
        const provider = (0, ProviderFactory_1.getActiveProvider)();
        const reply = toolSupport
            ? await provider.chatWithTools(chatMessages, toolSupport.tools, toolSupport.executeTool, model)
            : await provider.chat(chatMessages, model);
        let conversationId = request.conversationId;
        let conversation = null;
        if (conversationId) {
            conversation = await AIConversation_model_1.AIConversation.findOne({ where: { uuid: conversationId, userId: BigInt(userId) } });
        }
        if (!conversation) {
            const firstUserMsg = request.messages.find((m) => m.role === 'user')?.content ?? 'New chat';
            conversation = await AIConversation_model_1.AIConversation.create({
                userId: BigInt(userId),
                title: firstUserMsg.slice(0, 80),
                model,
                feature: 'chat',
                messageCount: 0,
            });
        }
        const lastUserMsg = request.messages[request.messages.length - 1];
        if (lastUserMsg?.role === 'user') {
            await AIMessage_model_1.AIMessage.create({ conversationId: conversation.id, role: 'user', content: lastUserMsg.content });
        }
        await AIMessage_model_1.AIMessage.create({ conversationId: conversation.id, role: 'assistant', content: reply });
        await conversation.update({ messageCount: conversation.messageCount + 2 });
        return { reply, model, conversationId: conversation.uuid };
    }
    async generateReport(request, userId) {
        const model = request.model ?? process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
        const prompt = (0, SystemPrompts_1.buildReportPrompt)(request.type, request.data, request.period);
        const report = await (0, ProviderFactory_1.getActiveProvider)().generate(prompt, model, 0.4);
        const conv = await AIConversation_model_1.AIConversation.create({
            userId: BigInt(userId),
            title: `${request.type} Report — ${request.period ?? new Date().toLocaleDateString()}`,
            model,
            feature: 'report',
            messageCount: 2,
        });
        await AIMessage_model_1.AIMessage.bulkCreate([
            { conversationId: conv.id, role: 'user', content: `Generate ${request.type} report` },
            { conversationId: conv.id, role: 'assistant', content: report },
        ]);
        return { report, type: request.type, generatedAt: new Date().toISOString() };
    }
    async summarizeMeeting(request, userId) {
        const model = request.model ?? process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
        const prompt = (0, SystemPrompts_1.buildMeetingSummaryPrompt)(request.title, request.transcript, request.participants);
        const raw = await (0, ProviderFactory_1.getActiveProvider)().generate(prompt, model, 0.3);
        const parsed = safeParseJSON(raw, {});
        const result = {
            title: request.title,
            summary: parsed.summary ?? raw,
            actionItems: parsed.actionItems ?? [],
            keyDecisions: parsed.keyDecisions ?? [],
            nextSteps: parsed.nextSteps ?? [],
            model,
        };
        await AIMeetingSummary_model_1.AIMeetingSummary.create({
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
    async draftEmail(request, userId) {
        const model = request.model ?? process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
        const prompt = (0, SystemPrompts_1.buildEmailPrompt)(request.type, request.recipient, request.context);
        const raw = await (0, ProviderFactory_1.getActiveProvider)().generate(prompt, model, 0.6);
        const parsed = safeParseJSON(raw, {});
        const result = {
            subject: parsed.subject ?? `${request.type.replace(/_/g, ' ')} — ${new Date().toLocaleDateString()}`,
            body: parsed.body ?? raw,
            type: request.type,
        };
        const conv = await AIConversation_model_1.AIConversation.create({
            userId: BigInt(userId),
            title: `Email: ${result.subject.slice(0, 60)}`,
            model,
            feature: 'email',
            messageCount: 2,
        });
        await AIMessage_model_1.AIMessage.bulkCreate([
            { conversationId: conv.id, role: 'user', content: `Draft ${request.type} email to ${request.recipient}` },
            { conversationId: conv.id, role: 'assistant', content: JSON.stringify(result) },
        ]);
        return result;
    }
    async suggestTasks(request, userId) {
        const model = request.model ?? process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
        const prompt = (0, SystemPrompts_1.buildTaskSuggestionsPrompt)(request.overdueTasks, request.pendingTasks, request.teamWorkload);
        const raw = await (0, ProviderFactory_1.getActiveProvider)().generate(prompt, model, 0.4);
        const parsed = safeParseJSON(raw, {});
        return {
            priorityOrder: parsed.priorityOrder ?? [],
            suggestions: parsed.suggestions ?? [],
            workloadNotes: parsed.workloadNotes ?? raw,
        };
    }
    async generateReminder(request, userId) {
        const model = request.model ?? process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
        const prompt = (0, SystemPrompts_1.buildReminderPrompt)(request.type, request.context);
        const raw = await (0, ProviderFactory_1.getActiveProvider)().generate(prompt, model, 0.5);
        const parsed = safeParseJSON(raw, {});
        const result = {
            title: parsed.title ?? `${request.type} Reminder`,
            message: parsed.message ?? raw,
            urgency: parsed.urgency ?? 'normal',
            suggestedSendTime: parsed.suggestedSendTime,
        };
        await AIReminder_model_1.AIReminder.create({
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
    async listConversations(userId, feature) {
        const where = { userId: BigInt(userId) };
        if (feature)
            where.feature = feature;
        return AIConversation_model_1.AIConversation.findAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: 50,
        });
    }
    async getConversation(uuid, userId) {
        const conv = await AIConversation_model_1.AIConversation.findOne({ where: { uuid, userId: BigInt(userId) } });
        if (!conv)
            return null;
        const messages = await AIMessage_model_1.AIMessage.findAll({
            where: { conversationId: conv.id },
            order: [['createdAt', 'ASC']],
        });
        return { conversation: conv, messages };
    }
    async getMeetingSummaries(userId) {
        return AIMeetingSummary_model_1.AIMeetingSummary.findAll({
            where: { userId: BigInt(userId) },
            order: [['createdAt', 'DESC']],
            limit: 30,
        });
    }
    async getReminders(userId) {
        return AIReminder_model_1.AIReminder.findAll({
            where: { userId: BigInt(userId) },
            order: [['createdAt', 'DESC']],
            limit: 50,
        });
    }
}
exports.default = new AIAssistantService();
//# sourceMappingURL=AIAssistantService.js.map
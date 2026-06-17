"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIController = void 0;
const ResponseFormatter_1 = require("../../../utils/ResponseFormatter");
const OllamaAIService_1 = __importDefault(require("../services/OllamaAIService"));
const OllamaProvider_1 = __importDefault(require("../providers/OllamaProvider"));
function getUser(req) {
    return req.user;
}
class AIController {
    static async status(req, res) {
        const available = await OllamaProvider_1.default.isAvailable();
        const models = available ? await OllamaProvider_1.default.listModels() : [];
        ResponseFormatter_1.ResponseFormatter.success(res, {
            ollamaAvailable: available,
            ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
            activeModel: process.env.AI_MODEL || 'llama3',
            availableModels: models,
            supportedModels: OllamaProvider_1.default.getSupportedModels(),
        }, available ? 'Ollama is running' : 'Ollama is not available');
    }
    static async chat(req, res) {
        const { messages, model, conversationId } = req.body;
        if (!Array.isArray(messages) || messages.length === 0) {
            ResponseFormatter_1.ResponseFormatter.error(res, 'messages array is required', 400);
            return;
        }
        const user = getUser(req);
        const roleName = user.roles?.[0] ?? 'staff';
        const result = await OllamaAIService_1.default.chat({ messages, model: model, conversationId }, user.id, roleName, user.name, user.businessUnit);
        ResponseFormatter_1.ResponseFormatter.success(res, result, 'AI response generated');
    }
    static async generateReport(req, res) {
        const { type, data, period, staffId, departmentId, model } = req.body;
        if (!type || !data) {
            ResponseFormatter_1.ResponseFormatter.error(res, 'type and data are required', 400);
            return;
        }
        const user = getUser(req);
        const result = await OllamaAIService_1.default.generateReport({ type, data, period, staffId, departmentId, model }, user.id);
        ResponseFormatter_1.ResponseFormatter.success(res, result, 'Report generated');
    }
    static async summarizeMeeting(req, res) {
        const { title, transcript, participants, model } = req.body;
        if (!transcript?.trim()) {
            ResponseFormatter_1.ResponseFormatter.error(res, 'transcript is required', 400);
            return;
        }
        const user = getUser(req);
        const result = await OllamaAIService_1.default.summarizeMeeting({ title: title || 'Untitled Meeting', transcript, participants, model }, user.id);
        ResponseFormatter_1.ResponseFormatter.success(res, result, 'Meeting summarized');
    }
    static async draftEmail(req, res) {
        const { type, recipient, context, model } = req.body;
        if (!type || !recipient) {
            ResponseFormatter_1.ResponseFormatter.error(res, 'type and recipient are required', 400);
            return;
        }
        const user = getUser(req);
        const result = await OllamaAIService_1.default.draftEmail({ type, recipient, context: context || {}, model }, user.id);
        ResponseFormatter_1.ResponseFormatter.success(res, result, 'Email draft generated');
    }
    static async taskSuggestions(req, res) {
        const { overdueTasks, pendingTasks, teamWorkload, model } = req.body;
        if (!Array.isArray(overdueTasks) || !Array.isArray(pendingTasks)) {
            ResponseFormatter_1.ResponseFormatter.error(res, 'overdueTasks and pendingTasks arrays are required', 400);
            return;
        }
        const user = getUser(req);
        const result = await OllamaAIService_1.default.suggestTasks({ overdueTasks, pendingTasks, teamWorkload, model }, user.id);
        ResponseFormatter_1.ResponseFormatter.success(res, result, 'Task suggestions generated');
    }
    static async generateReminder(req, res) {
        const { type, context, model } = req.body;
        if (!type) {
            ResponseFormatter_1.ResponseFormatter.error(res, 'type is required', 400);
            return;
        }
        const user = getUser(req);
        const result = await OllamaAIService_1.default.generateReminder({ type, context: context || {}, model }, user.id);
        ResponseFormatter_1.ResponseFormatter.success(res, result, 'Reminder generated');
    }
    static async listConversations(req, res) {
        const user = getUser(req);
        const feature = req.query.feature;
        const data = await OllamaAIService_1.default.listConversations(user.id, feature);
        ResponseFormatter_1.ResponseFormatter.success(res, data);
    }
    static async getConversation(req, res) {
        const user = getUser(req);
        const data = await OllamaAIService_1.default.getConversation(req.params.uuid, user.id);
        if (!data) {
            ResponseFormatter_1.ResponseFormatter.notFound(res, 'Conversation not found');
            return;
        }
        ResponseFormatter_1.ResponseFormatter.success(res, data);
    }
    static async listMeetingSummaries(req, res) {
        const user = getUser(req);
        const data = await OllamaAIService_1.default.getMeetingSummaries(user.id);
        ResponseFormatter_1.ResponseFormatter.success(res, data);
    }
    static async listReminders(req, res) {
        const user = getUser(req);
        const data = await OllamaAIService_1.default.getReminders(user.id);
        ResponseFormatter_1.ResponseFormatter.success(res, data);
    }
}
exports.AIController = AIController;
exports.default = AIController;
//# sourceMappingURL=AIController.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
const generative_ai_1 = require("@google/generative-ai");
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const SUPPORTED_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
function toGeminiHistory(messages) {
    const systemParts = messages.filter((m) => m.role === 'system').map((m) => m.content);
    const conversational = messages.filter((m) => m.role !== 'system');
    const last = conversational[conversational.length - 1];
    const history = conversational.slice(0, -1).map((m) => ({
        role: (m.role === 'assistant' ? 'model' : 'user'),
        parts: [{ text: m.content }],
    }));
    return {
        systemInstruction: systemParts.length ? systemParts.join('\n\n') : undefined,
        history,
        lastMessage: last?.content ?? '',
    };
}
class GeminiProvider {
    constructor() {
        this.client = null;
    }
    getClient() {
        if (!this.client) {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey)
                throw new Error('GEMINI_API_KEY is not set');
            this.client = new generative_ai_1.GoogleGenerativeAI(apiKey);
        }
        return this.client;
    }
    resolveModel(model) {
        return model && SUPPORTED_MODELS.includes(model) ? model : DEFAULT_MODEL;
    }
    async chat(messages, model, temperature = 0.7) {
        const { systemInstruction, history, lastMessage } = toGeminiHistory(messages);
        const genModel = this.getClient().getGenerativeModel({
            model: this.resolveModel(model),
            systemInstruction,
            generationConfig: { temperature },
        });
        const result = await genModel.startChat({ history }).sendMessage(lastMessage);
        return result.response.text().trim();
    }
    async chatWithTools(messages, tools, executeTool, model, temperature = 0.7) {
        const { systemInstruction, history, lastMessage } = toGeminiHistory(messages);
        const genModel = this.getClient().getGenerativeModel({
            model: this.resolveModel(model),
            systemInstruction,
            generationConfig: { temperature },
            tools: tools.length ? [{ functionDeclarations: tools }] : undefined,
        });
        const chatSession = genModel.startChat({ history });
        let result = await chatSession.sendMessage(lastMessage);
        let calls = result.response.functionCalls();
        let guard = 0;
        while (calls && calls.length > 0 && guard < 5) {
            const responseParts = await Promise.all(calls.map(async (call) => ({
                functionResponse: {
                    name: call.name,
                    response: { result: await executeTool(call.name, (call.args ?? {})) },
                },
            })));
            result = await chatSession.sendMessage(responseParts);
            calls = result.response.functionCalls();
            guard++;
        }
        return result.response.text().trim();
    }
    async generate(prompt, model, temperature = 0.5) {
        const genModel = this.getClient().getGenerativeModel({
            model: this.resolveModel(model),
            generationConfig: { temperature },
        });
        const result = await genModel.generateContent(prompt);
        return result.response.text().trim();
    }
    async listModels() {
        return [...SUPPORTED_MODELS];
    }
    async isAvailable() {
        return !!process.env.GEMINI_API_KEY;
    }
    getDefaultModel() { return DEFAULT_MODEL; }
    getSupportedModels() { return [...SUPPORTED_MODELS]; }
}
exports.GeminiProvider = GeminiProvider;
exports.default = new GeminiProvider();
//# sourceMappingURL=GeminiProvider.js.map
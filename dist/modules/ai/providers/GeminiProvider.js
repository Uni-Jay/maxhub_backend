"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = exports.AIUnavailableError = void 0;
const generative_ai_1 = require("@google/generative-ai");
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const SUPPORTED_MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];
const FALLBACKS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];
class AIUnavailableError extends Error {
    constructor(message, status = 503) { super(message); this.status = status; }
}
exports.AIUnavailableError = AIUnavailableError;
function classify(err) {
    const msg = String(err?.message || err || '');
    const status = Number(err?.status || (msg.match(/\[(\d{3})/) || [])[1] || 0);
    if (status === 404 || /not found|not supported|is not available|no longer|deprecated|permission.*model|access/i.test(msg))
        return 'model';
    if (status === 429 || status === 503 || status === 500 || /quota|rate|overloaded|unavailable|timeout/i.test(msg))
        return 'busy';
    if (status === 401 || status === 403 || /api key|API_KEY|unauthori/i.test(msg))
        return 'key';
    return 'other';
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function withFallback(preferred, fn) {
    const order = [preferred, ...FALLBACKS.filter((m) => m !== preferred)];
    let last = null;
    for (const model of order) {
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                return await fn(model);
            }
            catch (err) {
                last = err;
                const kind = classify(err);
                console.error(`[AI] ${model} failed (${kind}): ${String(err?.message || err).slice(0, 300)}`);
                if (kind === 'busy' && attempt === 0) {
                    await sleep(1500);
                    continue;
                }
                if (kind === 'key')
                    throw new AIUnavailableError('The AI service key is missing or invalid. Ask the administrator to check GEMINI_API_KEY on the server.');
                break;
            }
        }
    }
    const kind = classify(last);
    if (kind === 'busy')
        throw new AIUnavailableError('The AI service is busy right now (rate limit). Please try again in a minute.', 429);
    throw new AIUnavailableError(`The AI service could not answer: ${String(last?.message || 'unknown error').slice(0, 200)}`);
}
function genConfig(model, temperature) {
    return model.startsWith('gemini-2.5') ? { temperature, thinkingConfig: { thinkingBudget: 0 } } : { temperature };
}
function toGeminiHistory(messages) {
    const systemParts = messages.filter((m) => m.role === 'system').map((m) => m.content);
    let conversational = messages.filter((m) => m.role !== 'system');
    while (conversational.length && conversational[0].role !== 'user') {
        conversational = conversational.slice(1);
    }
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
        return withFallback(this.resolveModel(model), async (m) => {
            const genModel = this.getClient().getGenerativeModel({ model: m, systemInstruction, generationConfig: genConfig(m, temperature) });
            const result = await genModel.startChat({ history }).sendMessage(lastMessage);
            return result.response.text().trim();
        });
    }
    async chatWithTools(messages, tools, executeTool, model, temperature = 0.7) {
        const { systemInstruction, history, lastMessage } = toGeminiHistory(messages);
        return withFallback(this.resolveModel(model), async (m) => {
            const genModel = this.getClient().getGenerativeModel({
                model: m,
                systemInstruction,
                generationConfig: genConfig(m, temperature),
                tools: tools.length ? [{ functionDeclarations: tools }] : undefined,
            });
            const chatSession = genModel.startChat({ history });
            let result = await chatSession.sendMessage(lastMessage);
            let calls = result.response.functionCalls();
            let guard = 0;
            while (calls && calls.length > 0 && guard < 6) {
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
            const text = result.response.text().trim();
            return text || 'I could not find an answer to that. Try asking in a different way.';
        });
    }
    async generate(prompt, model, temperature = 0.5) {
        return withFallback(this.resolveModel(model), async (m) => {
            const genModel = this.getClient().getGenerativeModel({ model: m, generationConfig: genConfig(m, temperature) });
            const result = await genModel.generateContent(prompt);
            return result.response.text().trim();
        });
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
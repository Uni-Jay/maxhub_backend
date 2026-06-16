"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaProvider = void 0;
const SUPPORTED_MODELS = ['llama3', 'deepseek-r1', 'mistral', 'gemma'];
class OllamaProvider {
    constructor() {
        this.baseUrl = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
        const envModel = process.env.AI_MODEL;
        this.defaultModel = SUPPORTED_MODELS.includes(envModel) ? envModel : 'llama3';
    }
    resolveModel(model) {
        if (model && SUPPORTED_MODELS.includes(model))
            return model;
        return this.defaultModel;
    }
    async chat(messages, model, temperature = 0.7) {
        const targetModel = this.resolveModel(model);
        const payload = {
            model: targetModel,
            messages,
            stream: false,
            options: { temperature, top_p: 0.9, num_ctx: 4096 },
        };
        const res = await this.post('/api/chat', payload, targetModel);
        return res.message.content.trim();
    }
    async generate(prompt, model, temperature = 0.5) {
        const targetModel = this.resolveModel(model);
        const res = await this.post('/api/generate', {
            model: targetModel,
            prompt,
            stream: false,
            options: { temperature, top_p: 0.9, num_ctx: 4096 },
        }, targetModel);
        return res.response.trim();
    }
    async listModels() {
        try {
            const res = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
            if (!res.ok)
                return [];
            const data = await res.json();
            return (data.models || []).map((m) => m.name);
        }
        catch {
            return [];
        }
    }
    async isAvailable() {
        try {
            const res = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
            return res.ok;
        }
        catch {
            return false;
        }
    }
    getDefaultModel() { return this.defaultModel; }
    getSupportedModels() { return [...SUPPORTED_MODELS]; }
    async post(path, body, model) {
        let res;
        try {
            res = await fetch(`${this.baseUrl}${path}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(120000),
            });
        }
        catch (err) {
            if (err.cause?.code === 'ECONNREFUSED' || err.name === 'TypeError') {
                throw new Error(`Ollama is not running at ${this.baseUrl}. ` +
                    `Start it with: ollama serve`);
            }
            throw new Error(`Ollama request failed: ${err.message}`);
        }
        if (res.status === 404) {
            throw new Error(`Model "${model}" not found in Ollama. Pull it with: ollama pull ${model}`);
        }
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`Ollama returned ${res.status}: ${text}`);
        }
        return res.json();
    }
}
exports.OllamaProvider = OllamaProvider;
exports.default = new OllamaProvider();
//# sourceMappingURL=OllamaProvider.js.map
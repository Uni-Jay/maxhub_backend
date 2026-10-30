import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIMessage } from '../interfaces/AIInterfaces';
import type { AIProvider, ChatToolDeclaration } from './AIProvider.interface';

// Google retires Gemini models regularly (2.0 is gone, 2.5 is limited to
// existing users, 3.5 Flash is deprecated). We use the current stable model
// and fall back automatically if one is unavailable for this API key.
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const SUPPORTED_MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];
const FALLBACKS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];

/** Friendly reason for a failed AI call (also logged in full on the server). */
export class AIUnavailableError extends Error {
  status: number;
  constructor(message: string, status = 503) { super(message); this.status = status; }
}

function classify(err: any): 'model' | 'busy' | 'key' | 'other' {
  const msg = String(err?.message || err || '');
  const status = Number(err?.status || (msg.match(/\[(\d{3})/) || [])[1] || 0);
  if (status === 404 || /not found|not supported|is not available|no longer|deprecated|permission.*model|access/i.test(msg)) return 'model';
  if (status === 429 || status === 503 || status === 500 || /quota|rate|overloaded|unavailable|timeout/i.test(msg)) return 'busy';
  if (status === 401 || status === 403 || /api key|API_KEY|unauthori/i.test(msg)) return 'key';
  return 'other';
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Runs fn with the chosen model, then the fallbacks; retries once when Google is busy. */
async function withFallback<T>(preferred: string, fn: (model: string) => Promise<T>): Promise<T> {
  const order = [preferred, ...FALLBACKS.filter((m) => m !== preferred)];
  let last: any = null;
  for (const model of order) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await fn(model);
      } catch (err: any) {
        last = err;
        const kind = classify(err);
        console.error(`[AI] ${model} failed (${kind}): ${String(err?.message || err).slice(0, 300)}`);
        if (kind === 'busy' && attempt === 0) { await sleep(1500); continue; }
        if (kind === 'key') throw new AIUnavailableError('The AI service key is missing or invalid. Ask the administrator to check GEMINI_API_KEY on the server.');
        break; // try the next model
      }
    }
  }
  const kind = classify(last);
  if (kind === 'busy') throw new AIUnavailableError('The AI service is busy right now (rate limit). Please try again in a minute.', 429);
  throw new AIUnavailableError(`The AI service could not answer: ${String(last?.message || 'unknown error').slice(0, 200)}`);
}

/** Older 2.5 models accept a zero thinking budget for fast answers; newer models choose their own. */
function genConfig(model: string, temperature: number) {
  return model.startsWith('gemini-2.5') ? { temperature, thinkingConfig: { thinkingBudget: 0 } } : { temperature };
}

interface GeminiHistory {
  systemInstruction?: string;
  history: { role: 'user' | 'model'; parts: { text: string }[] }[];
  lastMessage: string;
}

/** Gemini has no 'system' role in chat history — folds it into systemInstruction instead, and uses 'model' instead of 'assistant'. */
function toGeminiHistory(messages: AIMessage[]): GeminiHistory {
  const systemParts = messages.filter((m) => m.role === 'system').map((m) => m.content);
  let conversational = messages.filter((m) => m.role !== 'system');
  // Gemini requires history to start with a 'user' turn. Callers (e.g. the chat UI's
  // hardcoded greeting bubble) may prepend an assistant turn that was never a real
  // model reply — drop any leading non-user turns rather than erroring.
  while (conversational.length && conversational[0].role !== 'user') {
    conversational = conversational.slice(1);
  }
  const last = conversational[conversational.length - 1];
  const history = conversational.slice(0, -1).map((m) => ({
    role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
    parts: [{ text: m.content }],
  }));
  return {
    systemInstruction: systemParts.length ? systemParts.join('\n\n') : undefined,
    history,
    lastMessage: last?.content ?? '',
  };
}

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI | null = null;

  private getClient(): GoogleGenerativeAI {
    if (!this.client) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
      this.client = new GoogleGenerativeAI(apiKey);
    }
    return this.client;
  }

  private resolveModel(model?: string): string {
    return model && SUPPORTED_MODELS.includes(model) ? model : DEFAULT_MODEL;
  }

  async chat(messages: AIMessage[], model?: string, temperature = 0.7): Promise<string> {
    const { systemInstruction, history, lastMessage } = toGeminiHistory(messages);
    return withFallback(this.resolveModel(model), async (m) => {
      const genModel = this.getClient().getGenerativeModel({ model: m, systemInstruction, generationConfig: genConfig(m, temperature) as any });
      const result = await genModel.startChat({ history }).sendMessage(lastMessage);
      return result.response.text().trim();
    });
  }

  /** Executes the full tool round-trip internally (Gemini may ask for one or more function calls before answering). */
  async chatWithTools(
    messages: AIMessage[],
    tools: ChatToolDeclaration[],
    executeTool: (name: string, args: Record<string, unknown>) => Promise<string>,
    model?: string,
    temperature = 0.7,
  ): Promise<string> {
    const { systemInstruction, history, lastMessage } = toGeminiHistory(messages);
    return withFallback(this.resolveModel(model), async (m) => {
      const genModel = this.getClient().getGenerativeModel({
        model: m,
        systemInstruction,
        generationConfig: genConfig(m, temperature) as any,
        tools: tools.length ? [{ functionDeclarations: tools as any }] : undefined,
      });
      const chatSession = genModel.startChat({ history });
      let result = await chatSession.sendMessage(lastMessage);
      let calls = result.response.functionCalls();
      let guard = 0;
      while (calls && calls.length > 0 && guard < 6) {
        const responseParts = await Promise.all(calls.map(async (call) => ({
          functionResponse: {
            name: call.name,
            response: { result: await executeTool(call.name, (call.args ?? {}) as Record<string, unknown>) },
          },
        })));
        result = await chatSession.sendMessage(responseParts as any);
        calls = result.response.functionCalls();
        guard++;
      }
      const text = result.response.text().trim();
      return text || 'I could not find an answer to that. Try asking in a different way.';
    });
  }

  async generate(prompt: string, model?: string, temperature = 0.5): Promise<string> {
    return withFallback(this.resolveModel(model), async (m) => {
      const genModel = this.getClient().getGenerativeModel({ model: m, generationConfig: genConfig(m, temperature) as any });
      const result = await genModel.generateContent(prompt);
      return result.response.text().trim();
    });
  }

  /** Reads an image (e.g. a receipt photo) and answers in JSON. */
  async generateFromImage(prompt: string, imageBase64: string, mimeType: string, model?: string): Promise<string> {
    return withFallback(this.resolveModel(model), async (m) => {
      const genModel = this.getClient().getGenerativeModel({ model: m, generationConfig: { ...(genConfig(m, 0.1) as any), responseMimeType: 'application/json' } });
      const result = await genModel.generateContent([{ text: prompt }, { inlineData: { data: imageBase64, mimeType } }] as any);
      return result.response.text().trim();
    });
  }

  async listModels(): Promise<string[]> {
    return [...SUPPORTED_MODELS];
  }

  async isAvailable(): Promise<boolean> {
    return !!process.env.GEMINI_API_KEY;
  }

  getDefaultModel(): string { return DEFAULT_MODEL; }
  getSupportedModels(): string[] { return [...SUPPORTED_MODELS]; }
}

export default new GeminiProvider();

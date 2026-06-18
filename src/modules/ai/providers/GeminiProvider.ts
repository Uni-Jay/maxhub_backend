import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIMessage } from '../interfaces/AIInterfaces';
import type { AIProvider, ChatToolDeclaration } from './AIProvider.interface';

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const SUPPORTED_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

interface GeminiHistory {
  systemInstruction?: string;
  history: { role: 'user' | 'model'; parts: { text: string }[] }[];
  lastMessage: string;
}

/** Gemini has no 'system' role in chat history — folds it into systemInstruction instead, and uses 'model' instead of 'assistant'. */
function toGeminiHistory(messages: AIMessage[]): GeminiHistory {
  const systemParts = messages.filter((m) => m.role === 'system').map((m) => m.content);
  const conversational = messages.filter((m) => m.role !== 'system');
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
    const genModel = this.getClient().getGenerativeModel({
      model: this.resolveModel(model),
      systemInstruction,
      generationConfig: { temperature },
    });
    const result = await genModel.startChat({ history }).sendMessage(lastMessage);
    return result.response.text().trim();
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

    const genModel = this.getClient().getGenerativeModel({
      model: this.resolveModel(model),
      systemInstruction,
      generationConfig: { temperature },
      tools: tools.length ? [{ functionDeclarations: tools as any }] : undefined,
    });

    const chatSession = genModel.startChat({ history });
    let result = await chatSession.sendMessage(lastMessage);

    let calls = result.response.functionCalls();
    let guard = 0;
    while (calls && calls.length > 0 && guard < 5) {
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

    return result.response.text().trim();
  }

  async generate(prompt: string, model?: string, temperature = 0.5): Promise<string> {
    const genModel = this.getClient().getGenerativeModel({
      model: this.resolveModel(model),
      generationConfig: { temperature },
    });
    const result = await genModel.generateContent(prompt);
    return result.response.text().trim();
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

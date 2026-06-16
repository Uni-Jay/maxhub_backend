import type {
  OllamaMessage,
  OllamaChatPayload,
  OllamaChatApiResponse,
  OllamaModel,
} from '../interfaces/AIInterfaces';

const SUPPORTED_MODELS: OllamaModel[] = ['llama3', 'deepseek-r1', 'mistral', 'gemma'];

export class OllamaProvider {
  private baseUrl: string;
  private defaultModel: OllamaModel;

  constructor() {
    this.baseUrl = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
    const envModel = process.env.AI_MODEL as OllamaModel;
    this.defaultModel = SUPPORTED_MODELS.includes(envModel) ? envModel : 'llama3';
  }

  private resolveModel(model?: OllamaModel): string {
    if (model && SUPPORTED_MODELS.includes(model)) return model;
    return this.defaultModel;
  }

  /** Call /api/chat — maintains message history, best for conversational use. */
  async chat(
    messages: OllamaMessage[],
    model?: OllamaModel,
    temperature = 0.7,
  ): Promise<string> {
    const targetModel = this.resolveModel(model);
    const payload: OllamaChatPayload = {
      model: targetModel,
      messages,
      stream: false,
      options: { temperature, top_p: 0.9, num_ctx: 4096 },
    };

    const res = await this.post<OllamaChatApiResponse>('/api/chat', payload, targetModel);
    return res.message.content.trim();
  }

  /** Call /api/generate — single-shot prompt, better for structured generation. */
  async generate(
    prompt: string,
    model?: OllamaModel,
    temperature = 0.5,
  ): Promise<string> {
    const targetModel = this.resolveModel(model);
    const res = await this.post<{ response: string }>('/api/generate', {
      model: targetModel,
      prompt,
      stream: false,
      options: { temperature, top_p: 0.9, num_ctx: 4096 },
    }, targetModel);
    return (res as any).response.trim();
  }

  async listModels(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return [];
      const data = await res.json() as { models?: { name: string }[] };
      return (data.models || []).map((m) => m.name);
    } catch {
      return [];
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  getDefaultModel(): string { return this.defaultModel; }
  getSupportedModels(): OllamaModel[] { return [...SUPPORTED_MODELS]; }

  private async post<T>(path: string, body: unknown, model: string): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120_000), // 2 min — large models are slow
      });
    } catch (err: any) {
      if (err.cause?.code === 'ECONNREFUSED' || err.name === 'TypeError') {
        throw new Error(
          `Ollama is not running at ${this.baseUrl}. ` +
          `Start it with: ollama serve`,
        );
      }
      throw new Error(`Ollama request failed: ${err.message}`);
    }

    if (res.status === 404) {
      throw new Error(
        `Model "${model}" not found in Ollama. Pull it with: ollama pull ${model}`,
      );
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Ollama returned ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  }
}

export default new OllamaProvider();

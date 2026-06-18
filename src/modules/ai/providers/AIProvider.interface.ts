import type { AIMessage } from '../interfaces/AIInterfaces';

/** JSON-schema-shaped declaration of a callable tool, passed to providers that support function calling. */
export interface ChatToolDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/**
 * Common interface every LLM provider (Gemini today, future OpenAI/DeepSeek
 * providers) must implement, so the orchestration layer (AIAssistantService) never
 * talks to a specific vendor SDK directly.
 */
export interface AIProvider {
  /** Plain conversational call, no tool use. */
  chat(messages: AIMessage[], model?: string, temperature?: number): Promise<string>;

  /**
   * Conversational call with function-calling tools available. Implementations that
   * support it (Gemini) execute the full tool round-trip internally via `executeTool`
   * and return the final natural-language reply. Implementations without tool support
   * should ignore `tools`/`executeTool` and fall back to plain `chat()`.
   */
  chatWithTools(
    messages: AIMessage[],
    tools: ChatToolDeclaration[],
    executeTool: (name: string, args: Record<string, unknown>) => Promise<string>,
    model?: string,
    temperature?: number,
  ): Promise<string>;

  /** Single-shot prompt, no conversation history — used for structured generation (reports, emails, etc). */
  generate(prompt: string, model?: string, temperature?: number): Promise<string>;

  listModels(): Promise<string[]>;
  isAvailable(): Promise<boolean>;
  getDefaultModel(): string;
  getSupportedModels(): string[];
}

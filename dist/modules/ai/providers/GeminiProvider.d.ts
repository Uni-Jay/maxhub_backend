import type { AIMessage } from '../interfaces/AIInterfaces';
import type { AIProvider, ChatToolDeclaration } from './AIProvider.interface';
export declare class GeminiProvider implements AIProvider {
    private client;
    private getClient;
    private resolveModel;
    chat(messages: AIMessage[], model?: string, temperature?: number): Promise<string>;
    chatWithTools(messages: AIMessage[], tools: ChatToolDeclaration[], executeTool: (name: string, args: Record<string, unknown>) => Promise<string>, model?: string, temperature?: number): Promise<string>;
    generate(prompt: string, model?: string, temperature?: number): Promise<string>;
    listModels(): Promise<string[]>;
    isAvailable(): Promise<boolean>;
    getDefaultModel(): string;
    getSupportedModels(): string[];
}
declare const _default: GeminiProvider;
export default _default;
//# sourceMappingURL=GeminiProvider.d.ts.map
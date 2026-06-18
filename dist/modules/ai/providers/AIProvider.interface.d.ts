import type { AIMessage } from '../interfaces/AIInterfaces';
export interface ChatToolDeclaration {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
}
export interface AIProvider {
    chat(messages: AIMessage[], model?: string, temperature?: number): Promise<string>;
    chatWithTools(messages: AIMessage[], tools: ChatToolDeclaration[], executeTool: (name: string, args: Record<string, unknown>) => Promise<string>, model?: string, temperature?: number): Promise<string>;
    generate(prompt: string, model?: string, temperature?: number): Promise<string>;
    listModels(): Promise<string[]>;
    isAvailable(): Promise<boolean>;
    getDefaultModel(): string;
    getSupportedModels(): string[];
}
//# sourceMappingURL=AIProvider.interface.d.ts.map
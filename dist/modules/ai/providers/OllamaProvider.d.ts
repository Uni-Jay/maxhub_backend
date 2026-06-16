import type { OllamaMessage, OllamaModel } from '../interfaces/AIInterfaces';
export declare class OllamaProvider {
    private baseUrl;
    private defaultModel;
    constructor();
    private resolveModel;
    chat(messages: OllamaMessage[], model?: OllamaModel, temperature?: number): Promise<string>;
    generate(prompt: string, model?: OllamaModel, temperature?: number): Promise<string>;
    listModels(): Promise<string[]>;
    isAvailable(): Promise<boolean>;
    getDefaultModel(): string;
    getSupportedModels(): OllamaModel[];
    private post;
}
declare const _default: OllamaProvider;
export default _default;
//# sourceMappingURL=OllamaProvider.d.ts.map
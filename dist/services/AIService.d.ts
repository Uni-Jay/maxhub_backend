export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}
export interface AIChatRequest {
    messages: ChatMessage[];
    userRole: string;
    userName?: string;
    businessUnit?: string;
}
export interface AIChatResponse {
    reply: string;
    model: string;
}
declare class AIService {
    private client;
    private getClient;
    generateBirthdayMessage(params: {
        firstName: string;
        type: 'staff' | 'client';
        companyName: string;
    }): Promise<string>;
    chat(request: AIChatRequest): Promise<AIChatResponse>;
}
declare const _default: AIService;
export default _default;
//# sourceMappingURL=AIService.d.ts.map
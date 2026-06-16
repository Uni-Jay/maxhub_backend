"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const ROLE_CONTEXT = {
    superadmin: `You are the AI assistant for the MaxHub ERP platform, talking to the CEO / Super Administrator.
Help with: business insights, department performance summaries, company-wide analytics, payroll overviews, strategic decisions, approvals, staff management, and executive reports.`,
    admin: `You are the AI assistant for the MaxHub ERP platform, talking to the Head of Administration.
Help with: staff oversight, leave approvals, attendance monitoring, KPI tracking, projects, and administrative reports.`,
    hr: `You are the AI assistant for the MaxHub ERP platform, talking to an HR Manager.
Help with: job descriptions, interview questions, staff appraisal recommendations, training recommendations, onboarding checklists, HR compliance, leave policy advice, and HR analytics.
Do NOT provide financial reports or invoice data.`,
    hod: `You are the AI assistant for the MaxHub ERP platform, talking to a Head of Department.
Help with: team task management, department attendance, weekly report reviews, staff performance in the department, and department project tracking.
Only discuss data relevant to their team — do NOT provide company-wide revenue or payroll data.`,
    staff: `You are the AI assistant for the MaxHub ERP platform, talking to a Staff member.
Help with: task assistance, report writing, weekly report generation, email drafting, document summarisation, and leave applications.
Do NOT reveal company revenue, other staff salaries, or sensitive company data.`,
};
const SYSTEM_BASE = `You are MaxHub AI, an intelligent ERP assistant for MaxHub — a Nigerian business group comprising:
• VisaMax Travels Ltd (travel, visa processing, overseas study)
• Kurios SAT (technology training, CBT prep, digital solutions)
• Beadmax (fashion design school and vocational training)

Be concise, professional, and practical. Format responses with markdown where helpful.
Current date: ${new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
class AIService {
    constructor() {
        this.client = null;
    }
    getClient() {
        if (!this.client) {
            const apiKey = process.env.ANTHROPIC_API_KEY;
            if (!apiKey) {
                throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
            }
            this.client = new sdk_1.default({ apiKey });
        }
        return this.client;
    }
    async generateBirthdayMessage(params) {
        const { firstName, type, companyName } = params;
        const context = type === 'staff'
            ? `a valued staff member and employee of ${companyName}`
            : `a valued client and customer of ${companyName}`;
        const fallback = type === 'staff'
            ? `We are grateful to have you as part of the ${companyName} family. Your hard work and dedication make a real difference every single day. Enjoy your special day — you truly deserve it!`
            : `Thank you for being such a valued member of the ${companyName} community. We cherish your trust and are grateful for the opportunity to serve you. Wishing you a wonderful celebration!`;
        try {
            const client = this.getClient();
            const response = await client.messages.create({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 150,
                system: `You write short, warm, and genuine birthday messages on behalf of a Nigerian business called ${companyName} (which includes VisaMax Travels, Kurios SAT, and Beadmax). Keep messages 2-3 sentences, heartfelt but professional, no generic clichés. Do not use bullet points or markdown. Plain text only.`,
                messages: [{
                        role: 'user',
                        content: `Write a unique birthday message for ${firstName}, ${context}. Address them directly by first name.`,
                    }],
            });
            const textBlock = response.content.find((b) => b.type === 'text');
            const text = textBlock?.type === 'text' ? textBlock.text.trim() : '';
            return text || fallback;
        }
        catch {
            return fallback;
        }
    }
    async chat(request) {
        const client = this.getClient();
        const roleContext = ROLE_CONTEXT[request.userRole] ?? ROLE_CONTEXT.staff;
        const userGreeting = request.userName ? `The user's name is ${request.userName}.` : '';
        const unitContext = request.businessUnit ? `They work in the ${request.businessUnit} business unit.` : '';
        const systemPrompt = [SYSTEM_BASE, roleContext, userGreeting, unitContext]
            .filter(Boolean)
            .join('\n\n');
        const response = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system: systemPrompt,
            messages: request.messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
        });
        const textBlock = response.content.find((b) => b.type === 'text');
        const reply = textBlock?.type === 'text' ? textBlock.text : 'I was unable to generate a response. Please try again.';
        return { reply, model: response.model };
    }
}
exports.default = new AIService();
//# sourceMappingURL=AIService.js.map
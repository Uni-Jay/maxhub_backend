import { Request, Response } from 'express';
export declare class AIController {
    static status(req: Request, res: Response): Promise<void>;
    static chat(req: Request, res: Response): Promise<void>;
    static generateReport(req: Request, res: Response): Promise<void>;
    static summarizeMeeting(req: Request, res: Response): Promise<void>;
    static draftEmail(req: Request, res: Response): Promise<void>;
    static taskSuggestions(req: Request, res: Response): Promise<void>;
    static generateReminder(req: Request, res: Response): Promise<void>;
    static listConversations(req: Request, res: Response): Promise<void>;
    static getConversation(req: Request, res: Response): Promise<void>;
    static listMeetingSummaries(req: Request, res: Response): Promise<void>;
    static listReminders(req: Request, res: Response): Promise<void>;
}
export default AIController;
//# sourceMappingURL=AIController.d.ts.map
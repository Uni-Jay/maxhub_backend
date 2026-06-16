import { Request, Response, NextFunction } from 'express';
export declare class StudentController {
    static register(req: Request, res: Response, next: NextFunction): Promise<void>;
    static list(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    static update(req: Request, res: Response, next: NextFunction): Promise<void>;
    static updateStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    static enroll(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getEnrollments(req: Request, res: Response, next: NextFunction): Promise<void>;
    static markAttendance(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getAttendance(req: Request, res: Response, next: NextFunction): Promise<void>;
    static recordResult(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getResults(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
    static updateMyProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getMyEnrollments(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getMyAttendance(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getMyResults(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getMyAnalytics(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getMySchedule(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export default StudentController;
//# sourceMappingURL=StudentController.d.ts.map
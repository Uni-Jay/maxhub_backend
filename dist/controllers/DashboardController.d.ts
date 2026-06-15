import { Request, Response, NextFunction } from 'express';
export declare class DashboardController {
    static getSuperAdminStats: (req: Request, res: Response, next: NextFunction) => void;
    static getSuperAdminAttendance: (req: Request, res: Response, next: NextFunction) => void;
    static getSuperAdminRevenue: (req: Request, res: Response, next: NextFunction) => void;
    static getSuperAdminPayroll: (req: Request, res: Response, next: NextFunction) => void;
    static getSuperAdminDepartments: (req: Request, res: Response, next: NextFunction) => void;
    static getSuperAdminStudents: (req: Request, res: Response, next: NextFunction) => void;
    static getSuperAdminProjects: (req: Request, res: Response, next: NextFunction) => void;
    static getSuperAdminCRM: (req: Request, res: Response, next: NextFunction) => void;
    static getSuperAdminNotifications: (req: Request, res: Response, next: NextFunction) => void;
    static getHeadOfAdminStats: (req: Request, res: Response, next: NextFunction) => void;
    static getHeadOfAdminLeaveApprovals: (req: Request, res: Response, next: NextFunction) => void;
    static approveLeave: (req: Request, res: Response, next: NextFunction) => void;
    static rejectLeave: (req: Request, res: Response, next: NextFunction) => void;
    static getHeadOfAdminAttendanceReports: (req: Request, res: Response, next: NextFunction) => void;
    static getHeadOfAdminDepartmentKPIs: (req: Request, res: Response, next: NextFunction) => void;
    static getHeadOfAdminProjects: (req: Request, res: Response, next: NextFunction) => void;
    static getHeadOfAdminCommunications: (req: Request, res: Response, next: NextFunction) => void;
    static getHeadOfAdminLeaveSummary: (req: Request, res: Response, next: NextFunction) => void;
}
export default DashboardController;
//# sourceMappingURL=DashboardController.d.ts.map
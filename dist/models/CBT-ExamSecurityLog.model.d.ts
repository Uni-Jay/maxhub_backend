import { Model } from 'sequelize';
export interface IExamSecurityLog {
    id: bigint;
    organizationId: bigint;
    examAttemptId: bigint;
    eventType: 'TabSwitch' | 'IPChange' | 'CopyPaste' | 'ScreenShare' | 'DevTools' | 'Refresh';
    description?: string;
    flaggedAs: 'Normal' | 'Suspicious' | 'Flagged';
    detectedAt: Date;
    detectedBy: string;
    severity: 'Info' | 'Warning' | 'Critical';
    createdAt: Date;
    updatedAt: Date;
}
export declare class ExamSecurityLog extends Model<IExamSecurityLog> implements IExamSecurityLog {
    id: bigint;
    organizationId: bigint;
    examAttemptId: bigint;
    eventType: 'TabSwitch' | 'IPChange' | 'CopyPaste' | 'ScreenShare' | 'DevTools' | 'Refresh';
    description?: string;
    flaggedAs: 'Normal' | 'Suspicious' | 'Flagged';
    detectedAt: Date;
    detectedBy: string;
    severity: 'Info' | 'Warning' | 'Critical';
    createdAt: Date;
    updatedAt: Date;
}
export default ExamSecurityLog;
//# sourceMappingURL=CBT-ExamSecurityLog.model.d.ts.map
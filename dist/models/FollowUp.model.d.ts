import { Model } from 'sequelize';
export interface IFollowUp {
    id: bigint;
    organizationId: bigint;
    visaApplicantId: bigint;
    followUpDate: Date;
    followUpType: 'Status Check' | 'Document Request' | 'Payment Reminder' | 'Interview Prep' | 'Consultation' | 'Other';
    followUpBy?: bigint;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    status: 'Pending' | 'Completed' | 'Cancelled';
    completedDate?: Date;
    outcome?: string;
    nextFollowUpDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class FollowUp extends Model<IFollowUp> implements IFollowUp {
    id: bigint;
    organizationId: bigint;
    visaApplicantId: bigint;
    followUpDate: Date;
    followUpType: 'Status Check' | 'Document Request' | 'Payment Reminder' | 'Interview Prep' | 'Consultation' | 'Other';
    followUpBy?: bigint;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    status: 'Pending' | 'Completed' | 'Cancelled';
    completedDate?: Date;
    outcome?: string;
    nextFollowUpDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default FollowUp;
//# sourceMappingURL=FollowUp.model.d.ts.map
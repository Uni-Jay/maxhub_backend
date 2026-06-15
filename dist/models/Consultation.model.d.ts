import { Model } from 'sequelize';
export interface IConsultation {
    id: bigint;
    organizationId: bigint;
    visaApplicantId: bigint;
    consultationDate: Date;
    consultantId?: bigint;
    consultationType: 'Initial' | 'Follow-up' | 'Document Review' | 'Interview Prep' | 'Other';
    duration: number;
    topic: string;
    discussionPoints?: string;
    recommendations?: string;
    nextSteps?: string;
    status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class Consultation extends Model<IConsultation> implements IConsultation {
    id: bigint;
    organizationId: bigint;
    visaApplicantId: bigint;
    consultationDate: Date;
    consultantId?: bigint;
    consultationType: 'Initial' | 'Follow-up' | 'Document Review' | 'Interview Prep' | 'Other';
    duration: number;
    topic: string;
    discussionPoints?: string;
    recommendations?: string;
    nextSteps?: string;
    status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default Consultation;
//# sourceMappingURL=Consultation.model.d.ts.map
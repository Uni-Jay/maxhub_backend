import { Model } from 'sequelize';
export interface IVisaApplicant {
    id: bigint;
    organizationId: bigint;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    passportNumber: string;
    visaType: 'Tourist' | 'Business' | 'Student' | 'Work' | 'Residence';
    destinationCountry: string;
    applicationDate: Date;
    status: 'New' | 'In Progress' | 'Document Review' | 'Interview' | 'Approved' | 'Rejected' | 'Cancelled';
    assignedTo?: bigint;
    priorityLevel: 'Low' | 'Medium' | 'High' | 'Urgent';
    documentStatus: 'Pending' | 'Submitted' | 'Approved' | 'Rejected';
    interviewScheduled?: Date;
    expectedDecisionDate?: Date;
    rejectionReason?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class VisaApplicant extends Model<IVisaApplicant> implements IVisaApplicant {
    id: bigint;
    organizationId: bigint;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    passportNumber: string;
    visaType: 'Tourist' | 'Business' | 'Student' | 'Work' | 'Residence';
    destinationCountry: string;
    applicationDate: Date;
    status: 'New' | 'In Progress' | 'Document Review' | 'Interview' | 'Approved' | 'Rejected' | 'Cancelled';
    assignedTo?: bigint;
    priorityLevel: 'Low' | 'Medium' | 'High' | 'Urgent';
    documentStatus: 'Pending' | 'Submitted' | 'Approved' | 'Rejected';
    interviewScheduled?: Date;
    expectedDecisionDate?: Date;
    rejectionReason?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default VisaApplicant;
//# sourceMappingURL=VisaApplicant.model.d.ts.map
import { Model } from 'sequelize';
export interface IPassportProcessing {
    id: bigint;
    organizationId: bigint;
    visaApplicantId: bigint;
    passportNumber: string;
    passportExpiryDate: Date;
    applicationDate: Date;
    processingStage: 'Submitted' | 'Under Review' | 'Approved' | 'Ready for Pickup' | 'Collected' | 'Rejected';
    processingFee: number;
    feePaid: boolean;
    feePaymentDate?: Date;
    estimatedCompletionDate?: Date;
    actualCompletionDate?: Date;
    pickupLocation?: string;
    status: 'Active' | 'Completed' | 'Delayed' | 'On Hold' | 'Cancelled';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class PassportProcessing extends Model<IPassportProcessing> implements IPassportProcessing {
    id: bigint;
    organizationId: bigint;
    visaApplicantId: bigint;
    passportNumber: string;
    passportExpiryDate: Date;
    applicationDate: Date;
    processingStage: 'Submitted' | 'Under Review' | 'Approved' | 'Ready for Pickup' | 'Collected' | 'Rejected';
    processingFee: number;
    feePaid: boolean;
    feePaymentDate?: Date;
    estimatedCompletionDate?: Date;
    actualCompletionDate?: Date;
    pickupLocation?: string;
    status: 'Active' | 'Completed' | 'Delayed' | 'On Hold' | 'Cancelled';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default PassportProcessing;
//# sourceMappingURL=PassportProcessing.model.d.ts.map
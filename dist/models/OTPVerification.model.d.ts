import { Model, Optional, Sequelize } from 'sequelize';
interface OTPVerificationAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    email: string;
    phone?: string;
    otpCode: string;
    otpHash: string;
    type: '2FA' | 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'PHONE_VERIFICATION';
    isUsed: boolean;
    usedAt?: Date;
    expiresAt: Date;
    attempts: number;
    deletedAt?: Date;
}
interface OTPVerificationCreationAttributes extends Optional<OTPVerificationAttributes, 'id' | 'uuid' | 'attempts'> {
}
export declare class OTPVerification extends Model<OTPVerificationAttributes, OTPVerificationCreationAttributes> implements OTPVerificationAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    email: string;
    phone?: string;
    otpCode: string;
    otpHash: string;
    type: '2FA' | 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'PHONE_VERIFICATION';
    isUsed: boolean;
    usedAt?: Date;
    expiresAt: Date;
    attempts: number;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof OTPVerification;
    isExpired(): boolean;
    canVerify(): boolean;
}
export {};
//# sourceMappingURL=OTPVerification.model.d.ts.map
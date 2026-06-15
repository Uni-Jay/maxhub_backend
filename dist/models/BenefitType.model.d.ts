import { Model, Optional, Sequelize } from 'sequelize';
interface BenefitTypeAttributes {
    id: bigint;
    uuid: string;
    benefitCode: string;
    benefitName: string;
    description?: string;
    benefitType: 'Health' | 'Insurance' | 'Retirement' | 'Leave' | 'Financial' | 'Wellness' | 'Other';
    isActive: boolean;
    deletedAt?: Date;
}
interface BenefitTypeCreationAttributes extends Optional<BenefitTypeAttributes, 'id' | 'uuid'> {
}
export declare class BenefitType extends Model<BenefitTypeAttributes, BenefitTypeCreationAttributes> implements BenefitTypeAttributes {
    id: bigint;
    uuid: string;
    benefitCode: string;
    benefitName: string;
    description?: string;
    benefitType: 'Health' | 'Insurance' | 'Retirement' | 'Leave' | 'Financial' | 'Wellness' | 'Other';
    isActive: boolean;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof BenefitType;
}
export {};
//# sourceMappingURL=BenefitType.model.d.ts.map
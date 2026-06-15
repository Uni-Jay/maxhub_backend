import { Model, Optional } from 'sequelize';
interface PHASE25_FeatureFlagAttributes {
    id: number;
    organizationId: number;
    flagKey: string;
    flagName: string;
    description: string;
    isEnabled: boolean;
    flagType: 'BOOLEAN' | 'PERCENTAGE' | 'USER_LIST' | 'CUSTOM';
    rolloutPercentage: number;
    targetUsers: any;
    targetRoles: any;
    targetDepartments: any;
    conditions: any;
    metadata: any;
    createdBy: number;
    updatedBy: number;
    enabledAt: Date;
    disabledAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
interface PHASE25_FeatureFlagCreationAttributes extends Optional<PHASE25_FeatureFlagAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
declare class PHASE25_FeatureFlag extends Model<PHASE25_FeatureFlagAttributes, PHASE25_FeatureFlagCreationAttributes> implements PHASE25_FeatureFlagAttributes {
    id: number;
    organizationId: number;
    flagKey: string;
    flagName: string;
    description: string;
    isEnabled: boolean;
    flagType: 'BOOLEAN' | 'PERCENTAGE' | 'USER_LIST' | 'CUSTOM';
    rolloutPercentage: number;
    targetUsers: any;
    targetRoles: any;
    targetDepartments: any;
    conditions: any;
    metadata: any;
    createdBy: number;
    updatedBy: number;
    enabledAt: Date;
    disabledAt: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default PHASE25_FeatureFlag;
//# sourceMappingURL=PHASE-25-FeatureFlag.model.d.ts.map
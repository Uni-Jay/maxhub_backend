import { Model, Optional, Sequelize } from 'sequelize';
interface UserModulePermissionAttributes {
    id: bigint;
    userId: bigint;
    moduleCode: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
}
interface UserModulePermissionCreationAttributes extends Optional<UserModulePermissionAttributes, 'id' | 'canView' | 'canCreate' | 'canEdit' | 'canDelete'> {
}
export declare class UserModulePermission extends Model<UserModulePermissionAttributes, UserModulePermissionCreationAttributes> implements UserModulePermissionAttributes {
    id: bigint;
    userId: bigint;
    moduleCode: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof UserModulePermission;
}
export {};
//# sourceMappingURL=UserModulePermission.model.d.ts.map
import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

interface UserModulePermissionAttributes {
  id: bigint;
  userId: bigint;
  moduleCode: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface UserModulePermissionCreationAttributes
  extends Optional<UserModulePermissionAttributes, 'id' | 'canView' | 'canCreate' | 'canEdit' | 'canDelete'> {}

export class UserModulePermission
  extends Model<UserModulePermissionAttributes, UserModulePermissionCreationAttributes>
  implements UserModulePermissionAttributes
{
  public id!: bigint;
  public userId!: bigint;
  public moduleCode!: string;
  public canView!: boolean;
  public canCreate!: boolean;
  public canEdit!: boolean;
  public canDelete!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof UserModulePermission {
    UserModulePermission.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        userId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        moduleCode: { type: DataTypes.STRING(50), allowNull: false },
        canView: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
        canCreate: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
        canEdit: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
        canDelete: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
      },
      {
        sequelize,
        tableName: 'user_module_permissions',
        timestamps: true,
        underscored: false,
        paranoid: false,
        indexes: [{ fields: ['userId', 'moduleCode'], unique: true }],
      }
    );
    return UserModulePermission;
  }
}

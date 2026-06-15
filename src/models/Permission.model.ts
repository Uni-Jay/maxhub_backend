import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface PermissionAttributes {
  id: bigint;
  uuid: string;
  code: string;
  name: string;
  description?: string;
  module: string;
  resource: string;
  action: string;
  scope: 'all' | 'own' | 'own_department' | 'own_warehouse';
  isActive: boolean;
  deletedAt?: Date;
}

interface PermissionCreationAttributes extends Optional<PermissionAttributes, 'id' | 'uuid'> {}

export class Permission extends Model<PermissionAttributes, PermissionCreationAttributes>
  implements PermissionAttributes {
  public id!: bigint;
  public uuid!: string;
  public code!: string;
  public name!: string;
  public description?: string;
  public module!: string;
  public resource!: string;
  public action!: string;
  public scope!: 'all' | 'own' | 'own_department';
  public isActive!: boolean;
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Permission {
    Permission.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        uuid: {
          type: DataTypes.UUID,
          defaultValue: () => uuidv4(),
          unique: true,
          allowNull: false,
          comment: 'External API reference UUID',
        },
        code: {
          type: DataTypes.STRING(150),
          unique: true,
          allowNull: false,
          comment: 'Unique permission code (e.g., auth.login, staff.create.all)',
        },
        name: {
          type: DataTypes.STRING(200),
          allowNull: false,
          comment: 'Human-readable permission name',
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Detailed permission description',
        },
        module: {
          type: DataTypes.STRING(100),
          allowNull: false,
          comment: 'Permission module (auth, user, staff, project, etc.)',
        },
        resource: {
          type: DataTypes.STRING(100),
          allowNull: false,
          comment: 'Resource being acted upon (user, staff, task, etc.)',
        },
        action: {
          type: DataTypes.STRING(100),
          allowNull: false,
          comment: 'Action type (create, read, update, delete, approve, etc.)',
        },
        scope: {
          type: DataTypes.ENUM('all', 'own', 'own_department', 'own_warehouse'),
          defaultValue: 'all',
          allowNull: false,
          comment: 'Permission scope: all records, own records, or own department only',
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          allowNull: false,
          comment: 'Permission active status',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'permissions',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['code'],
            name: 'idx_permissions_code',
          },
          {
            fields: ['module'],
            name: 'idx_permissions_module',
          },
          {
            fields: ['action'],
            name: 'idx_permissions_action',
          },
          {
            fields: ['isActive'],
            name: 'idx_permissions_isActive',
          },
          {
            fields: ['module', 'resource', 'action'],
            name: 'idx_permissions_module_resource_action',
          },
          {
            fields: ['uuid'],
            name: 'idx_permissions_uuid',
          },
        ],
        comment: 'Permission codes for fine-grained RBAC',
      }
    );

    return Permission;
  }
}
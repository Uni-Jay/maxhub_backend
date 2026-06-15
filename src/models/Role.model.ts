import {
  DataTypes,
  Model,
  Optional,
  Sequelize,
  BelongsToManyAddAssociationMixin,
  BelongsToManyRemoveAssociationMixin,
  BelongsToManyHasAssociationMixin,
  BelongsToManyCountAssociationsMixin,
  BelongsToManyGetAssociationsMixin,
} from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface RoleAttributes {
  id: bigint;
  uuid: string;
  code: string;
  name: string;
  description?: string;
  isSystemRole: boolean;
  isActive: boolean;
  deletedAt?: Date;
}

interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'uuid'> {}

export class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  public id!: bigint;
  public uuid!: string;
  public code!: string;
  public name!: string;
  public description?: string;
  public isSystemRole!: boolean;
  public isActive!: boolean;
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public addPermission!: BelongsToManyAddAssociationMixin<Permission, bigint>;
  public removePermission!: BelongsToManyRemoveAssociationMixin<Permission, bigint>;
  public hasPermission!: BelongsToManyHasAssociationMixin<Permission, bigint>;
  public countPermissions!: BelongsToManyCountAssociationsMixin;
  public getPermissions!: BelongsToManyGetAssociationsMixin<Permission>;

  public static initModel(sequelize: Sequelize): typeof Role {
    Role.init(
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
          type: DataTypes.STRING(100),
          unique: true,
          allowNull: false,
          comment: 'Unique role identifier (e.g., SUPER_ADMIN)',
        },
        name: {
          type: DataTypes.STRING(150),
          allowNull: false,
          comment: 'Role display name',
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Role purpose and responsibilities',
        },
        isSystemRole: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: 'Whether role is built-in system role',
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          allowNull: false,
          comment: 'Role active status',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'roles',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['code'],
            name: 'idx_roles_code',
          },
          {
            fields: ['isActive'],
            name: 'idx_roles_isActive',
          },
          {
            fields: ['uuid'],
            name: 'idx_roles_uuid',
          },
        ],
        comment: 'System roles for RBAC',
      }
    );

    return Role;
  }
}

import type { Permission } from './Permission.model';
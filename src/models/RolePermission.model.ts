import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface RolePermissionAttributes {
  id: bigint;
  uuid: string;
  roleId: bigint;
  permissionId: bigint;
  deletedAt?: Date;
}

interface RolePermissionCreationAttributes extends Optional<RolePermissionAttributes, 'id' | 'uuid'> {}

export class RolePermission extends Model<RolePermissionAttributes, RolePermissionCreationAttributes>
  implements RolePermissionAttributes {
  public id!: bigint;
  public uuid!: string;
  public roleId!: bigint;
  public permissionId!: bigint;
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof RolePermission {
    RolePermission.init(
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
        },
        roleId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Reference to roles table',
        },
        permissionId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Reference to permissions table',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'role_permissions',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['roleId'],
            name: 'idx_role_permissions_roleId',
          },
          {
            fields: ['permissionId'],
            name: 'idx_role_permissions_permissionId',
          },
          {
            fields: ['roleId', 'permissionId'],
            unique: true,
            name: 'idx_role_permissions_roleId_permissionId_unique',
          },
        ],
        comment: 'Junction table for many-to-many role-permission relationships',
      }
    );

    return RolePermission;
  }
}
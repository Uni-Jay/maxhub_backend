import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface UserPermissionAttributes {
  id: bigint;
  uuid: string;
  userId: bigint;
  permissionId: bigint;
  grantedAt: Date;
  expiresAt?: Date;
  reason?: string;
  deletedAt?: Date;
}

interface UserPermissionCreationAttributes
  extends Optional<UserPermissionAttributes, 'id' | 'uuid' | 'grantedAt'> {}

export class UserPermission extends Model<UserPermissionAttributes, UserPermissionCreationAttributes>
  implements UserPermissionAttributes {
  public id!: bigint;
  public uuid!: string;
  public userId!: bigint;
  public permissionId!: bigint;
  public grantedAt!: Date;
  public expiresAt?: Date;
  public reason?: string;
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof UserPermission {
    UserPermission.init(
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
        userId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Reference to users table',
        },
        permissionId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Reference to permissions table',
        },
        grantedAt: {
          type: DataTypes.DATE,
          defaultValue: () => new Date(),
          allowNull: false,
          comment: 'When permission was granted to user',
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Optional permission expiry date for temporary access',
        },
        reason: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Reason for granting direct permission',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'user_permissions',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['userId'],
            name: 'idx_user_permissions_userId',
          },
          {
            fields: ['permissionId'],
            name: 'idx_user_permissions_permissionId',
          },
          {
            fields: ['userId', 'permissionId'],
            unique: true,
            name: 'idx_user_permissions_userId_permissionId_unique',
          },
          {
            fields: ['expiresAt'],
            name: 'idx_user_permissions_expiresAt',
          },
        ],
        comment: 'Direct permission assignment to users, bypassing roles (for temporary access)',
      }
    );

    return UserPermission;
  }

  // Helper to check if permission has expired
  public isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }
}
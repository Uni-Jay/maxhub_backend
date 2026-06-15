import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface UserRoleAttributes {
  id: bigint;
  uuid: string;
  userId: bigint;
  roleId: bigint;
  assignedAt: Date;
  expiresAt?: Date;
  deletedAt?: Date;
}

interface UserRoleCreationAttributes extends Optional<UserRoleAttributes, 'id' | 'uuid' | 'assignedAt'> {}

export class UserRole extends Model<UserRoleAttributes, UserRoleCreationAttributes>
  implements UserRoleAttributes {
  public id!: bigint;
  public uuid!: string;
  public userId!: bigint;
  public roleId!: bigint;
  public assignedAt!: Date;
  public expiresAt?: Date;
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof UserRole {
    UserRole.init(
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
        roleId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Reference to roles table',
        },
        assignedAt: {
          type: DataTypes.DATE,
          defaultValue: () => new Date(),
          allowNull: false,
          comment: 'When role was assigned to user',
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Optional role expiry date for temporary assignments',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'user_roles',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['userId'],
            name: 'idx_user_roles_userId',
          },
          {
            fields: ['roleId'],
            name: 'idx_user_roles_roleId',
          },
          {
            fields: ['userId', 'roleId'],
            unique: true,
            name: 'idx_user_roles_userId_roleId_unique',
          },
          {
            fields: ['expiresAt'],
            name: 'idx_user_roles_expiresAt',
          },
        ],
        comment: 'Junction table for many-to-many user-role relationships',
      }
    );

    return UserRole;
  }

  // Helper to check if role assignment is expired
  public isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }
}
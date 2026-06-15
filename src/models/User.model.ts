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

interface UserAttributes {
  id: bigint;
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  passwordHash: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  lastLoginAt?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  deletedAt?: Date;
}

interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'uuid' | 'emailVerified' | 'loginAttempts'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: bigint;
  public uuid!: string;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public phone?: string;
  public avatar?: string;
  public passwordHash!: string;
  public status!: 'Active' | 'Inactive' | 'Suspended';
  public emailVerified!: boolean;
  public emailVerifiedAt?: Date;
  public lastLoginAt?: Date;
  public loginAttempts!: number;
  public lockedUntil?: Date;
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public addRole!: BelongsToManyAddAssociationMixin<Role, bigint>;
  public removeRole!: BelongsToManyRemoveAssociationMixin<Role, bigint>;
  public hasRole!: BelongsToManyHasAssociationMixin<Role, bigint>;
  public countRoles!: BelongsToManyCountAssociationsMixin;
  public getRoles!: BelongsToManyGetAssociationsMixin<Role>;

  public addPermission!: BelongsToManyAddAssociationMixin<Permission, bigint>;
  public removePermission!: BelongsToManyRemoveAssociationMixin<Permission, bigint>;
  public hasPermission!: BelongsToManyHasAssociationMixin<Permission, bigint>;
  public countPermissions!: BelongsToManyCountAssociationsMixin;
  public getPermissions!: BelongsToManyGetAssociationsMixin<Permission>;

  public static initModel(sequelize: Sequelize): typeof User {
    User.init(
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
        firstName: {
          type: DataTypes.STRING(100),
          allowNull: false,
          comment: 'User first name',
        },
        lastName: {
          type: DataTypes.STRING(100),
          allowNull: false,
          comment: 'User last name',
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
          validate: { isEmail: true },
          comment: 'Unique email address',
        },
        phone: {
          type: DataTypes.STRING(20),
          allowNull: true,
          comment: 'Contact phone number',
        },
        avatar: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Profile image URL/path',
        },
        passwordHash: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: 'Bcrypt hashed password',
        },
        status: {
          type: DataTypes.ENUM('Active', 'Inactive', 'Suspended'),
          defaultValue: 'Active',
          allowNull: false,
          comment: 'User account status',
        },
        emailVerified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: 'Email verification status',
        },
        emailVerifiedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Email verification timestamp',
        },
        lastLoginAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Last login timestamp',
        },
        loginAttempts: {
          type: DataTypes.INTEGER.UNSIGNED,
          defaultValue: 0,
          allowNull: false,
          comment: 'Failed login attempt counter',
        },
        lockedUntil: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Account lockout expiry time',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'users',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['email'],
            name: 'idx_users_email',
          },
          {
            fields: ['status'],
            name: 'idx_users_status',
          },
          {
            fields: ['createdAt'],
            name: 'idx_users_createdAt',
          },
          {
            fields: ['uuid'],
            name: 'idx_users_uuid',
          },
        ],
        comment: 'System users table with authentication',
      }
    );

    return User;
  }

  // Helper method to get full name
  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Helper to check if account is locked
  public isLocked(): boolean {
    return this.lockedUntil ? new Date() < this.lockedUntil : false;
  }
}

// Import Role and Permission types at bottom to avoid circular dependency
import type { Role } from './Role.model';
import type { Permission } from './Permission.model';
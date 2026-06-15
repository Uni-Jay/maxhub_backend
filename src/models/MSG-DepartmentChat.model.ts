import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 21: Messaging - Department Chat Model
 * Group chats per department
 */
export interface IDepartmentChat {
  id: bigint;
  organizationId: bigint;
  departmentId: bigint;
  chatName: string;
  description?: string;
  chatImageUrl?: string;
  isActive: boolean;
  createdBy: bigint;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class DepartmentChat extends Model<IDepartmentChat> implements IDepartmentChat {
  declare id: bigint;
  declare organizationId: bigint;
  declare departmentId: bigint;
  declare chatName: string;
  declare description?: string;
  declare chatImageUrl?: string;
  declare isActive: boolean;
  declare createdBy: bigint;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

DepartmentChat.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    organizationId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    departmentId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Department',
    },
    chatName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    chatImageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Staff',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'department_chat',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'departmentId'] },
      { fields: ['isActive'] },
      {
        fields: ['organizationId', 'departmentId'],
        unique: true,
        where: { deletedAt: null },
        name: 'uq_org_dept_chat',
      },
    ],
  }
);

export default DepartmentChat;

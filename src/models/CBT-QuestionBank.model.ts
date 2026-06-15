import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 20: CBT Examination - Question Bank Model [CRITICAL - MISSING]
 * Organize questions into banks for exam construction
 */
export interface IQuestionBank {
  id: bigint;
  organizationId: bigint;
  departmentId?: bigint; // NEW: RBAC filtering
  bankCode: string;
  bankName: string;
  description?: string;
  category: string;
  totalQuestions: number;
  difficulty: 'Mixed' | 'Easy' | 'Intermediate' | 'Advanced';
  createdBy: bigint;
  updatedBy?: bigint;
  isPublic: boolean;
  status: 'Active' | 'Inactive' | 'Archived';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class QuestionBank extends Model<IQuestionBank> implements IQuestionBank {
  declare id: bigint;
  declare organizationId: bigint;
  declare departmentId?: bigint;
  declare bankCode: string;
  declare bankName: string;
  declare description?: string;
  declare category: string;
  declare totalQuestions: number;
  declare difficulty: 'Mixed' | 'Easy' | 'Intermediate' | 'Advanced';
  declare createdBy: bigint;
  declare updatedBy?: bigint;
  declare isPublic: boolean;
  declare status: 'Active' | 'Inactive' | 'Archived';
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

QuestionBank.init(
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
      allowNull: true,
      comment: 'NEW: FK to Department for RBAC filtering',
    },
    bankCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    bankName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Denormalized count, updated via trigger',
    },
    difficulty: {
      type: DataTypes.ENUM('Mixed', 'Easy', 'Intermediate', 'Advanced'),
      defaultValue: 'Mixed',
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    updatedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Archived'),
      defaultValue: 'Active',
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
    tableName: 'question_bank',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'departmentId', 'status'] },
      { fields: ['bankCode'] },
      { fields: ['category'] },
      { fields: ['difficulty'] },
    ],
  }
);

export default QuestionBank;

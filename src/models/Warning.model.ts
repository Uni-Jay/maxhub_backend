import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface WarningAttributes {
  id: bigint;
  uuid: string;
  staffId: bigint;
  issuedBy: bigint;
  warningType: 'Verbal' | 'Written' | 'Final';
  reason: string;
  description?: string;
  issuedDate: Date;
  followUpDate?: Date;
  escalationLevel: 1 | 2 | 3;
  status: 'Active' | 'Resolved' | 'Escalated' | 'Withdrawn';
  resolutionDate?: Date;
  resolutionNotes?: string;
  acknowledgedBy?: bigint;
  acknowledgedDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface WarningCreationAttributes extends Optional<WarningAttributes, 'id' | 'uuid'> {}

export class Warning extends Model<WarningAttributes, WarningCreationAttributes> implements WarningAttributes {
  public id!: bigint;
  public uuid!: string;
  public staffId!: bigint;
  public issuedBy!: bigint;
  public warningType!: 'Verbal' | 'Written' | 'Final';
  public reason!: string;
  public description?: string;
  public issuedDate!: Date;
  public followUpDate?: Date;
  public escalationLevel!: 1 | 2 | 3;
  public status!: 'Active' | 'Resolved' | 'Escalated' | 'Withdrawn';
  public resolutionDate?: Date;
  public resolutionNotes?: string;
  public acknowledgedBy?: bigint;
  public acknowledgedDate?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;

  static initModel(sequelize: Sequelize): typeof Warning {
    Warning.init(
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },
        uuid: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          defaultValue: uuidv4,
        },
        staffId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: 'staff',
            key: 'id',
          },
        },
        issuedBy: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: 'staff',
            key: 'id',
          },
        },
        warningType: {
          type: DataTypes.ENUM('Verbal', 'Written', 'Final'),
          allowNull: false,
        },
        reason: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        issuedDate: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        followUpDate: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        escalationLevel: {
          type: DataTypes.ENUM('1', '2', '3'),
          allowNull: false,
          defaultValue: '1',
        },
        status: {
          type: DataTypes.ENUM('Active', 'Resolved', 'Escalated', 'Withdrawn'),
          allowNull: false,
          defaultValue: 'Active',
        },
        resolutionDate: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        resolutionNotes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        acknowledgedBy: {
          type: DataTypes.BIGINT,
          allowNull: true,
          references: {
            model: 'staff',
            key: 'id',
          },
        },
        acknowledgedDate: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'warning',
        tableName: 'warning',
        timestamps: true,
        paranoid: true,
        indexes: [
          {
            fields: ['staffId'],
          },
          {
            fields: ['issuedBy'],
          },
          {
            fields: ['status'],
          },
          {
            fields: ['issuedDate'],
          },
        ],
      }
    );
    return Warning;
  }
}

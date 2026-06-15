import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface BenefitTypeAttributes {
  id: bigint;
  uuid: string;
  benefitCode: string;
  benefitName: string;
  description?: string;
  benefitType: 'Health' | 'Insurance' | 'Retirement' | 'Leave' | 'Financial' | 'Wellness' | 'Other';
  isActive: boolean;
  deletedAt?: Date;
}

interface BenefitTypeCreationAttributes extends Optional<BenefitTypeAttributes, 'id' | 'uuid'> {}

export class BenefitType extends Model<BenefitTypeAttributes, BenefitTypeCreationAttributes>
  implements BenefitTypeAttributes {
  public id!: bigint;
  public uuid!: string;
  public benefitCode!: string;
  public benefitName!: string;
  public description?: string;
  public benefitType!: 'Health' | 'Insurance' | 'Retirement' | 'Leave' | 'Financial' | 'Wellness' | 'Other';
  public isActive!: boolean;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof BenefitType {
    BenefitType.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        benefitCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Benefit code' },
        benefitName: { type: DataTypes.STRING(200), allowNull: false, comment: 'Benefit name' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        benefitType: { type: DataTypes.ENUM('Health', 'Insurance', 'Retirement', 'Leave', 'Financial', 'Wellness', 'Other'), allowNull: false },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false, comment: 'Is active' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'benefit_types', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['benefitCode'], name: 'idx_benefit_types_benefitCode' },
          { fields: ['benefitType'], name: 'idx_benefit_types_benefitType' },
          { fields: ['isActive'], name: 'idx_benefit_types_isActive' },
          { fields: ['uuid'], name: 'idx_benefit_types_uuid' },
        ],
        comment: 'Employee benefit types'
      }
    );
    return BenefitType;
  }
}

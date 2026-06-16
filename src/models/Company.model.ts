import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface CompanyAttributes {
  id: bigint;
  uuid: string;
  name: string;
  code: 'KURIOS_SAT' | 'VISA_MAX' | 'BEAD_MAX' | 'BEADMAX_SCHOOL';
  type: 'Tech & Training' | 'Travel & Visa Services' | 'Jewelry & Sales' | 'Vocational School';
  logo?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  status: 'Active' | 'Inactive';
  settings?: object;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CompanyCreationAttributes
  extends Optional<CompanyAttributes, 'id' | 'uuid' | 'status'> {}

export class Company
  extends Model<CompanyAttributes, CompanyCreationAttributes>
  implements CompanyAttributes
{
  public id!: bigint;
  public uuid!: string;
  public name!: string;
  public code!: 'KURIOS_SAT' | 'VISA_MAX' | 'BEAD_MAX' | 'BEADMAX_SCHOOL';
  public type!: 'Tech & Training' | 'Travel & Visa Services' | 'Jewelry & Sales' | 'Vocational School';
  public logo?: string;
  public address?: string;
  public city?: string;
  public country?: string;
  public phone?: string;
  public email?: string;
  public website?: string;
  public description?: string;
  public status!: 'Active' | 'Inactive';
  public settings?: object;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Company {
    Company.init(
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
          allowNull: false,
          unique: true,
        },
        name: { type: DataTypes.STRING(150), allowNull: false },
        code: {
          type: DataTypes.ENUM('KURIOS_SAT', 'VISA_MAX', 'BEAD_MAX', 'BEADMAX_SCHOOL'),
          allowNull: false,
          unique: true,
        },
        type: {
          type: DataTypes.ENUM(
            'Tech & Training',
            'Travel & Visa Services',
            'Jewelry & Sales',
            'Vocational School'
          ),
          allowNull: false,
        },
        logo: { type: DataTypes.STRING(500), allowNull: true },
        address: { type: DataTypes.TEXT, allowNull: true },
        city: { type: DataTypes.STRING(100), allowNull: true },
        country: { type: DataTypes.STRING(100), allowNull: true },
        phone: { type: DataTypes.STRING(30), allowNull: true },
        email: { type: DataTypes.STRING(200), allowNull: true },
        website: { type: DataTypes.STRING(300), allowNull: true },
        description: { type: DataTypes.TEXT, allowNull: true },
        status: {
          type: DataTypes.ENUM('Active', 'Inactive'),
          allowNull: false,
          defaultValue: 'Active',
        },
        settings: { type: DataTypes.JSON, allowNull: true },
      },
      {
        sequelize,
        modelName: 'Company',
        tableName: 'companies',
        timestamps: true,
      }
    );
    return Company;
  }
}

export default Company;

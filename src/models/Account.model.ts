import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface AccountAttributes {
  id: bigint;
  uuid: string;
  accountCode: string;
  accountName: string;
  accountType: 'Business' | 'Individual' | 'Government' | 'NGO' | 'Other';
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  ownerUserId?: bigint;
  status: 'Active' | 'Inactive' | 'Prospect' | 'Paused';
  annualRevenue?: number;
  numberOfEmployees?: number;
  deletedAt?: Date;
}

interface AccountCreationAttributes extends Optional<AccountAttributes, 'id' | 'uuid'> {}

export class Account extends Model<AccountAttributes, AccountCreationAttributes>
  implements AccountAttributes {
  public id!: bigint;
  public uuid!: string;
  public accountCode!: string;
  public accountName!: string;
  public accountType!: 'Business' | 'Individual' | 'Government' | 'NGO' | 'Other';
  public industry?: string;
  public website?: string;
  public phone?: string;
  public email?: string;
  public address?: string;
  public city?: string;
  public state?: string;
  public country?: string;
  public postalCode?: string;
  public ownerUserId?: bigint;
  public status!: 'Active' | 'Inactive' | 'Prospect' | 'Paused';
  public annualRevenue?: number;
  public numberOfEmployees?: number;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Account {
    Account.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        accountCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Account code' },
        accountName: { type: DataTypes.STRING(200), allowNull: false, comment: 'Account name' },
        accountType: { type: DataTypes.ENUM('Business', 'Individual', 'Government', 'NGO', 'Other'), allowNull: false },
        industry: { type: DataTypes.STRING(100), allowNull: true, comment: 'Industry' },
        website: { type: DataTypes.STRING(200), allowNull: true, comment: 'Website URL' },
        phone: { type: DataTypes.STRING(20), allowNull: true, comment: 'Phone' },
        email: { type: DataTypes.STRING(100), allowNull: true, comment: 'Email' },
        address: { type: DataTypes.TEXT, allowNull: true, comment: 'Address' },
        city: { type: DataTypes.STRING(100), allowNull: true, comment: 'City' },
        state: { type: DataTypes.STRING(100), allowNull: true, comment: 'State' },
        country: { type: DataTypes.STRING(100), allowNull: true, comment: 'Country' },
        postalCode: { type: DataTypes.STRING(20), allowNull: true, comment: 'Postal code' },
        ownerUserId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Account owner user ID' },
        status: { type: DataTypes.ENUM('Active', 'Inactive', 'Prospect', 'Paused'), defaultValue: 'Active' },
        annualRevenue: { type: DataTypes.DECIMAL(15, 2), allowNull: true, comment: 'Annual revenue' },
        numberOfEmployees: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, comment: 'Number of employees' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'accounts', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['accountCode'], name: 'idx_accounts_accountCode' },
          { fields: ['accountType'], name: 'idx_accounts_accountType' },
          { fields: ['ownerUserId'], name: 'idx_accounts_ownerUserId' },
          { fields: ['status'], name: 'idx_accounts_status' },
          { fields: ['city'], name: 'idx_accounts_city' },
          { fields: ['country'], name: 'idx_accounts_country' },
          { fields: ['uuid'], name: 'idx_accounts_uuid' },
        ],
        comment: 'CRM Accounts'
      }
    );
    return Account;
  }
}

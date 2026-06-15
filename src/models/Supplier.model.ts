import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface SupplierAttributes {
  id: bigint;
  uuid: string;
  supplierCode: string;
  supplierName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  taxId?: string;
  paymentTerms?: string;
  status: 'Active' | 'Inactive' | 'Blocked';
  rating?: number;
  notes?: string;
  deletedAt?: Date;
}

interface SupplierCreationAttributes extends Optional<SupplierAttributes, 'id' | 'uuid'> {}

export class Supplier extends Model<SupplierAttributes, SupplierCreationAttributes>
  implements SupplierAttributes {
  public id!: bigint;
  public uuid!: string;
  public supplierCode!: string;
  public supplierName!: string;
  public contactPerson?: string;
  public phone?: string;
  public email?: string;
  public address?: string;
  public city?: string;
  public state?: string;
  public country?: string;
  public taxId?: string;
  public paymentTerms?: string;
  public status!: 'Active' | 'Inactive' | 'Blocked';
  public rating?: number;
  public notes?: string;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Supplier {
    Supplier.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        supplierCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Supplier code' },
        supplierName: { type: DataTypes.STRING(200), allowNull: false, comment: 'Supplier name' },
        contactPerson: { type: DataTypes.STRING(150), allowNull: true, comment: 'Contact person' },
        phone: { type: DataTypes.STRING(20), allowNull: true, comment: 'Phone' },
        email: { type: DataTypes.STRING(100), allowNull: true, comment: 'Email' },
        address: { type: DataTypes.TEXT, allowNull: true, comment: 'Address' },
        city: { type: DataTypes.STRING(100), allowNull: true, comment: 'City' },
        state: { type: DataTypes.STRING(100), allowNull: true, comment: 'State' },
        country: { type: DataTypes.STRING(100), allowNull: true, comment: 'Country' },
        taxId: { type: DataTypes.STRING(50), allowNull: true, comment: 'Tax ID' },
        paymentTerms: { type: DataTypes.STRING(100), allowNull: true, comment: 'Payment terms' },
        status: { type: DataTypes.ENUM('Active', 'Inactive', 'Blocked'), defaultValue: 'Active' },
        rating: { type: DataTypes.DECIMAL(3, 2), allowNull: true, comment: 'Rating 1-5' },
        notes: { type: DataTypes.TEXT, allowNull: true, comment: 'Notes' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'suppliers', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['supplierCode'], name: 'idx_suppliers_supplierCode' },
          { fields: ['status'], name: 'idx_suppliers_status' },
          { fields: ['city'], name: 'idx_suppliers_city' },
          { fields: ['country'], name: 'idx_suppliers_country' },
          { fields: ['uuid'], name: 'idx_suppliers_uuid' },
        ],
        comment: 'Suppliers'
      }
    );
    return Supplier;
  }
}

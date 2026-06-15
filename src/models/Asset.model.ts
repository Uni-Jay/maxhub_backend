import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface AssetAttributes {
  id: bigint;
  uuid: string;
  assetCode: string;
  assetTypeId: bigint;
  assetName: string;
  description?: string;
  serialNumber?: string;
  purchaseDate: Date;
  purchasePrice: number;
  currentValue: number;
  locationId?: bigint;
  assignedTo?: bigint;
  status: 'New' | 'InUse' | 'Maintenance' | 'Retired' | 'Scrapped';
  warrantExpiryDate?: Date;
  notes?: string;
  deletedAt?: Date;
}

interface AssetCreationAttributes extends Optional<AssetAttributes, 'id' | 'uuid'> {}

export class Asset extends Model<AssetAttributes, AssetCreationAttributes>
  implements AssetAttributes {
  public id!: bigint;
  public uuid!: string;
  public assetCode!: string;
  public assetTypeId!: bigint;
  public assetName!: string;
  public description?: string;
  public serialNumber?: string;
  public purchaseDate!: Date;
  public purchasePrice!: number;
  public currentValue!: number;
  public locationId?: bigint;
  public assignedTo?: bigint;
  public status!: 'New' | 'InUse' | 'Maintenance' | 'Retired' | 'Scrapped';
  public warrantExpiryDate?: Date;
  public notes?: string;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Asset {
    Asset.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        assetCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Asset code' },
        assetTypeId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Asset type ID' },
        assetName: { type: DataTypes.STRING(200), allowNull: false, comment: 'Asset name' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        serialNumber: { type: DataTypes.STRING(100), allowNull: true, unique: true, comment: 'Serial number' },
        purchaseDate: { type: DataTypes.DATE, allowNull: false, comment: 'Purchase date' },
        purchasePrice: { type: DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Purchase price' },
        currentValue: { type: DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Current value' },
        locationId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Location ID' },
        assignedTo: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Assigned to user ID' },
        status: { type: DataTypes.ENUM('New', 'InUse', 'Maintenance', 'Retired', 'Scrapped'), defaultValue: 'New' },
        warrantExpiryDate: { type: DataTypes.DATE, allowNull: true, comment: 'Warranty expiry date' },
        notes: { type: DataTypes.TEXT, allowNull: true, comment: 'Notes' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'assets', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['assetCode'], name: 'idx_assets_assetCode' },
          { fields: ['assetTypeId'], name: 'idx_assets_assetTypeId' },
          { fields: ['serialNumber'], name: 'idx_assets_serialNumber' },
          { fields: ['status'], name: 'idx_assets_status' },
          { fields: ['assignedTo'], name: 'idx_assets_assignedTo' },
          { fields: ['uuid'], name: 'idx_assets_uuid' },
        ],
        comment: 'Fixed assets'
      }
    );
    return Asset;
  }
}

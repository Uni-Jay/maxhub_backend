import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface AssetTypeAttributes {
  id: bigint;
  uuid: string;
  assetTypeCode: string;
  assetTypeName: string;
  depreciation_method: 'Straight' | 'Accelerated' | 'None';
  depreciation_years?: number;
  description?: string;
  isActive: boolean;
  deletedAt?: Date;
}

interface AssetTypeCreationAttributes extends Optional<AssetTypeAttributes, 'id' | 'uuid'> {}

export class AssetType extends Model<AssetTypeAttributes, AssetTypeCreationAttributes>
  implements AssetTypeAttributes {
  public id!: bigint;
  public uuid!: string;
  public assetTypeCode!: string;
  public assetTypeName!: string;
  public depreciation_method!: 'Straight' | 'Accelerated' | 'None';
  public depreciation_years?: number;
  public description?: string;
  public isActive!: boolean;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof AssetType {
    AssetType.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        assetTypeCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Asset type code' },
        assetTypeName: { type: DataTypes.STRING(200), allowNull: false, comment: 'Asset type name' },
        depreciation_method: { type: DataTypes.ENUM('Straight', 'Accelerated', 'None'), defaultValue: 'Straight' },
        depreciation_years: { type: DataTypes.INTEGER, allowNull: true, comment: 'Depreciation years' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false, comment: 'Is active' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'asset_types', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['assetTypeCode'], name: 'idx_asset_types_assetTypeCode' },
          { fields: ['isActive'], name: 'idx_asset_types_isActive' },
          { fields: ['uuid'], name: 'idx_asset_types_uuid' },
        ],
        comment: 'Asset types'
      }
    );
    return AssetType;
  }
}

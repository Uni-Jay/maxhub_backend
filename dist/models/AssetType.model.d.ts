import { Model, Optional, Sequelize } from 'sequelize';
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
interface AssetTypeCreationAttributes extends Optional<AssetTypeAttributes, 'id' | 'uuid'> {
}
export declare class AssetType extends Model<AssetTypeAttributes, AssetTypeCreationAttributes> implements AssetTypeAttributes {
    id: bigint;
    uuid: string;
    assetTypeCode: string;
    assetTypeName: string;
    depreciation_method: 'Straight' | 'Accelerated' | 'None';
    depreciation_years?: number;
    description?: string;
    isActive: boolean;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof AssetType;
}
export {};
//# sourceMappingURL=AssetType.model.d.ts.map
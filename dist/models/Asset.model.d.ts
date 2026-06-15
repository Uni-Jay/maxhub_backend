import { Model, Optional, Sequelize } from 'sequelize';
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
interface AssetCreationAttributes extends Optional<AssetAttributes, 'id' | 'uuid'> {
}
export declare class Asset extends Model<AssetAttributes, AssetCreationAttributes> implements AssetAttributes {
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
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Asset;
}
export {};
//# sourceMappingURL=Asset.model.d.ts.map
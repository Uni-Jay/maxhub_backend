import { Model, Optional, Sequelize } from 'sequelize';
interface LocationAttributes {
    id: bigint;
    uuid: string;
    code: string;
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    isHeadOffice: boolean;
    capacity?: number;
    status: 'Active' | 'Inactive';
    deletedAt?: Date;
}
interface LocationCreationAttributes extends Optional<LocationAttributes, 'id' | 'uuid'> {
}
export declare class Location extends Model<LocationAttributes, LocationCreationAttributes> implements LocationAttributes {
    id: bigint;
    uuid: string;
    code: string;
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    isHeadOffice: boolean;
    capacity?: number;
    status: 'Active' | 'Inactive';
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Location;
}
export {};
//# sourceMappingURL=Location.model.d.ts.map
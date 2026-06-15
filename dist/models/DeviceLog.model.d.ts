import { Model, Optional, Sequelize, BelongsToGetAssociationMixin } from 'sequelize';
interface DeviceLogAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    deviceId: string;
    deviceName?: string;
    deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
    osName?: string;
    osVersion?: string;
    browserName?: string;
    browserVersion?: string;
    ipAddress: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    userAgent: string;
    isVerified: boolean;
    verifiedAt?: Date;
    lastActivityAt: Date;
    isTrusted: boolean;
    deletedAt?: Date;
}
interface DeviceLogCreationAttributes extends Optional<DeviceLogAttributes, 'id' | 'uuid' | 'isVerified' | 'lastActivityAt' | 'isTrusted'> {
}
export declare class DeviceLog extends Model<DeviceLogAttributes, DeviceLogCreationAttributes> implements DeviceLogAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    deviceId: string;
    deviceName?: string;
    deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
    osName?: string;
    osVersion?: string;
    browserName?: string;
    browserVersion?: string;
    ipAddress: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    userAgent: string;
    isVerified: boolean;
    verifiedAt?: Date;
    lastActivityAt: Date;
    isTrusted: boolean;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    getUser: BelongsToGetAssociationMixin<any>;
    static initModel(sequelize: Sequelize): typeof DeviceLog;
}
export {};
//# sourceMappingURL=DeviceLog.model.d.ts.map
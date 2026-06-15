import { Model, Optional, Sequelize } from 'sequelize';
interface GPSTrackingAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    attendanceId?: bigint;
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    speed?: number;
    heading?: number;
    timestamp: Date;
    address?: string;
    isValidLocation: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
interface GPSTrackingCreationAttributes extends Optional<GPSTrackingAttributes, 'id' | 'uuid'> {
}
export declare class GPSTracking extends Model<GPSTrackingAttributes, GPSTrackingCreationAttributes> implements GPSTrackingAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    attendanceId?: bigint;
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    speed?: number;
    heading?: number;
    timestamp: Date;
    address?: string;
    isValidLocation: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
    static initModel(sequelize: Sequelize): typeof GPSTracking;
}
export {};
//# sourceMappingURL=GPSTracking.model.d.ts.map
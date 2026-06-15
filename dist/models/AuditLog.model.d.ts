import { Model, Optional, Sequelize } from 'sequelize';
interface AuditLogAttributes {
    id: bigint;
    uuid: string;
    module: string;
    action: string;
    entity: string;
    entityId: bigint;
    description?: string;
    changes?: string;
    oldValue?: string;
    newValue?: string;
    userId: bigint;
    ipAddress?: string;
    userAgent?: string;
    status: 'Success' | 'Failed' | 'Partial';
    createdAt: Date;
}
interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'uuid' | 'createdAt'> {
}
export declare class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
    id: bigint;
    uuid: string;
    module: string;
    action: string;
    entity: string;
    entityId: bigint;
    description?: string;
    changes?: string;
    oldValue?: string;
    newValue?: string;
    userId: bigint;
    ipAddress?: string;
    userAgent?: string;
    status: 'Success' | 'Failed' | 'Partial';
    createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof AuditLog;
}
export {};
//# sourceMappingURL=AuditLog.model.d.ts.map
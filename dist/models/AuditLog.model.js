"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class AuditLog extends sequelize_1.Model {
    static initModel(sequelize) {
        AuditLog.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            module: { type: sequelize_1.DataTypes.STRING(100), allowNull: false, comment: 'Module name' },
            action: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, comment: 'Action' },
            entity: { type: sequelize_1.DataTypes.STRING(100), allowNull: false, comment: 'Entity type' },
            entityId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Entity ID' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Description' },
            changes: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Changes JSON' },
            oldValue: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Old value' },
            newValue: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'New value' },
            userId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'User ID' },
            ipAddress: { type: sequelize_1.DataTypes.STRING(45), allowNull: true, comment: 'IP address' },
            userAgent: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'User agent' },
            status: { type: sequelize_1.DataTypes.ENUM('Success', 'Failed', 'Partial'), defaultValue: 'Success' },
            createdAt: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW, allowNull: false },
        }, {
            sequelize, tableName: 'audit_logs', timestamps: false, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['module'], name: 'idx_audit_logs_module' },
                { fields: ['action'], name: 'idx_audit_logs_action' },
                { fields: ['entity'], name: 'idx_audit_logs_entity' },
                { fields: ['entityId'], name: 'idx_audit_logs_entityId' },
                { fields: ['userId'], name: 'idx_audit_logs_userId' },
                { fields: ['createdAt'], name: 'idx_audit_logs_createdAt' },
                { fields: ['status'], name: 'idx_audit_logs_status' },
                { fields: ['uuid'], name: 'idx_audit_logs_uuid' },
            ],
            comment: 'Audit trail for all system actions'
        });
        return AuditLog;
    }
}
exports.AuditLog = AuditLog;
//# sourceMappingURL=AuditLog.model.js.map
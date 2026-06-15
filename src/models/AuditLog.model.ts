import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

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

interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'uuid' | 'createdAt'> {}

export class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes>
  implements AuditLogAttributes {
  public id!: bigint;
  public uuid!: string;
  public module!: string;
  public action!: string;
  public entity!: string;
  public entityId!: bigint;
  public description?: string;
  public changes?: string;
  public oldValue?: string;
  public newValue?: string;
  public userId!: bigint;
  public ipAddress?: string;
  public userAgent?: string;
  public status!: 'Success' | 'Failed' | 'Partial';
  public createdAt!: Date;

  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof AuditLog {
    AuditLog.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        module: { type: DataTypes.STRING(100), allowNull: false, comment: 'Module name' },
        action: { type: DataTypes.STRING(50), allowNull: false, comment: 'Action' },
        entity: { type: DataTypes.STRING(100), allowNull: false, comment: 'Entity type' },
        entityId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Entity ID' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        changes: { type: DataTypes.TEXT, allowNull: true, comment: 'Changes JSON' },
        oldValue: { type: DataTypes.TEXT, allowNull: true, comment: 'Old value' },
        newValue: { type: DataTypes.TEXT, allowNull: true, comment: 'New value' },
        userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'User ID' },
        ipAddress: { type: DataTypes.STRING(45), allowNull: true, comment: 'IP address' },
        userAgent: { type: DataTypes.TEXT, allowNull: true, comment: 'User agent' },
        status: { type: DataTypes.ENUM('Success', 'Failed', 'Partial'), defaultValue: 'Success' },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
      },
      {
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
      }
    );
    return AuditLog;
  }
}

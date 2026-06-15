import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface ActivityAttributes {
  id: bigint;
  uuid: string;
  relatedEntityType: string;
  relatedEntityId: bigint;
  activityType: 'Call' | 'Email' | 'Meeting' | 'Task' | 'Note' | 'WhatsApp' | 'SMS' | 'Other';
  subject: string;
  description?: string;
  activityDate: Date;
  dueDate?: Date;
  ownerUserId: bigint;
  participantIds?: string;
  status: 'Open' | 'Completed' | 'Cancelled';
  outcome?: string;
  notes?: string;
  deletedAt?: Date;
}

interface ActivityCreationAttributes extends Optional<ActivityAttributes, 'id' | 'uuid'> {}

export class Activity extends Model<ActivityAttributes, ActivityCreationAttributes>
  implements ActivityAttributes {
  public id!: bigint;
  public uuid!: string;
  public relatedEntityType!: string;
  public relatedEntityId!: bigint;
  public activityType!: 'Call' | 'Email' | 'Meeting' | 'Task' | 'Note' | 'WhatsApp' | 'SMS' | 'Other';
  public subject!: string;
  public description?: string;
  public activityDate!: Date;
  public dueDate?: Date;
  public ownerUserId!: bigint;
  public participantIds?: string;
  public status!: 'Open' | 'Completed' | 'Cancelled';
  public outcome?: string;
  public notes?: string;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Activity {
    Activity.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        relatedEntityType: { type: DataTypes.STRING(50), allowNull: false, comment: 'Entity type (Contact, Account, etc)' },
        relatedEntityId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Entity ID' },
        activityType: { type: DataTypes.ENUM('Call', 'Email', 'Meeting', 'Task', 'Note', 'WhatsApp', 'SMS', 'Other'), allowNull: false },
        subject: { type: DataTypes.STRING(300), allowNull: false, comment: 'Activity subject' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        activityDate: { type: DataTypes.DATE, allowNull: false, comment: 'Activity date' },
        dueDate: { type: DataTypes.DATE, allowNull: true, comment: 'Due date' },
        ownerUserId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Owner user ID' },
        participantIds: { type: DataTypes.JSON, allowNull: true, comment: 'Participant IDs (JSON)' },
        status: { type: DataTypes.ENUM('Open', 'Completed', 'Cancelled'), defaultValue: 'Open' },
        outcome: { type: DataTypes.TEXT, allowNull: true, comment: 'Activity outcome' },
        notes: { type: DataTypes.TEXT, allowNull: true, comment: 'Notes' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'activities', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['relatedEntityType'], name: 'idx_activities_relatedEntityType' },
          { fields: ['relatedEntityId'], name: 'idx_activities_relatedEntityId' },
          { fields: ['activityType'], name: 'idx_activities_activityType' },
          { fields: ['ownerUserId'], name: 'idx_activities_ownerUserId' },
          { fields: ['status'], name: 'idx_activities_status' },
          { fields: ['activityDate'], name: 'idx_activities_activityDate' },
          { fields: ['uuid'], name: 'idx_activities_uuid' },
        ],
        comment: 'CRM Activities'
      }
    );
    return Activity;
  }
}

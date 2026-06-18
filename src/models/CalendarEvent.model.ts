import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface CalendarEventAttributes {
  id: bigint;
  uuid: string;
  title: string;
  date: Date;
  endDate?: Date;
  type: 'Meeting' | 'Task' | 'Reminder' | 'Holiday' | 'Other';
  description?: string;
  attendees?: string;
  createdById?: bigint;
  deletedAt?: Date;
}

interface CalendarEventCreationAttributes extends Optional<CalendarEventAttributes, 'id' | 'uuid'> {}

export class CalendarEvent
  extends Model<CalendarEventAttributes, CalendarEventCreationAttributes>
  implements CalendarEventAttributes {
  declare id: bigint;
  declare uuid: string;
  declare title: string;
  declare date: Date;
  declare endDate?: Date;
  declare type: 'Meeting' | 'Task' | 'Reminder' | 'Holiday' | 'Other';
  declare description?: string;
  declare attendees?: string;
  declare createdById?: bigint;
  declare deletedAt?: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public static initModel(sequelize: Sequelize): typeof CalendarEvent {
    CalendarEvent.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true },
        title: { type: DataTypes.STRING(255), allowNull: false },
        date: { type: DataTypes.DATE, allowNull: false },
        endDate: { type: DataTypes.DATE, allowNull: true },
        type: {
          type: DataTypes.ENUM('Meeting', 'Task', 'Reminder', 'Holiday', 'Other'),
          defaultValue: 'Meeting',
        },
        description: { type: DataTypes.TEXT, allowNull: true },
        attendees: { type: DataTypes.TEXT, allowNull: true },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        deletedAt: { type: DataTypes.DATE, allowNull: true },
      },
      {
        sequelize,
        tableName: 'calendar_events',
        paranoid: true,
        timestamps: true,
        underscored: false,
        freezeTableName: true,
      }
    );
    return CalendarEvent;
  }
}

export default CalendarEvent;

import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface HolidayCalendarAttributes {
  id: bigint;
  uuid: string;
  holidayCode: string;
  holidayName: string;
  holidayDate: Date;
  year: number;
  type: 'National' | 'Regional' | 'Festival' | 'Company';
  isOptional: boolean;
  description?: string;
  createdById: bigint;
  deletedAt?: Date;
}

interface HolidayCalendarCreationAttributes extends Optional<HolidayCalendarAttributes, 'id' | 'uuid'> {}

export class HolidayCalendar extends Model<HolidayCalendarAttributes, HolidayCalendarCreationAttributes>
  implements HolidayCalendarAttributes {
  public id!: bigint;
  public uuid!: string;
  public holidayCode!: string;
  public holidayName!: string;
  public holidayDate!: Date;
  public year!: number;
  public type!: 'National' | 'Regional' | 'Festival' | 'Company';
  public isOptional!: boolean;
  public description?: string;
  public createdById!: bigint;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof HolidayCalendar {
    HolidayCalendar.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        holidayCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Holiday code' },
        holidayName: { type: DataTypes.STRING(200), allowNull: false, comment: 'Holiday name' },
        holidayDate: { type: DataTypes.DATE, allowNull: false, comment: 'Holiday date' },
        year: { type: DataTypes.INTEGER, allowNull: false, comment: 'Year' },
        type: { type: DataTypes.ENUM('National', 'Regional', 'Festival', 'Company'), allowNull: false },
        isOptional: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Optional holiday' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'holiday_calendars', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['holidayCode'], name: 'idx_holiday_calendars_holidayCode' },
          { fields: ['holidayDate'], name: 'idx_holiday_calendars_holidayDate' },
          { fields: ['year'], name: 'idx_holiday_calendars_year' },
          { fields: ['type'], name: 'idx_holiday_calendars_type' },
          { fields: ['uuid'], name: 'idx_holiday_calendars_uuid' },
        ],
        comment: 'Holiday calendar'
      }
    );
    return HolidayCalendar;
  }
}

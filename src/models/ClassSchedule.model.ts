import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

interface ClassScheduleAttributes {
  id: bigint;
  uuid: string;
  courseId: bigint;
  programId?: bigint;
  instructorId?: bigint;
  title: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  venue?: string;
  isOnline: boolean;
  meetingLink?: string;
  meetingPassword?: string;
  effectiveFrom: Date;
  effectiveUntil?: Date;
  isActive: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ClassScheduleCreationAttributes
  extends Optional<ClassScheduleAttributes, 'id' | 'uuid' | 'isOnline' | 'isActive'> {}

export class ClassSchedule
  extends Model<ClassScheduleAttributes, ClassScheduleCreationAttributes>
  implements ClassScheduleAttributes
{
  public id!: bigint;
  public uuid!: string;
  public courseId!: bigint;
  public programId?: bigint;
  public instructorId?: bigint;
  public title!: string;
  public dayOfWeek!: DayOfWeek;
  public startTime!: string;
  public endTime!: string;
  public venue?: string;
  public isOnline!: boolean;
  public meetingLink?: string;
  public meetingPassword?: string;
  public effectiveFrom!: Date;
  public effectiveUntil?: Date;
  public isActive!: boolean;
  public notes?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof ClassSchedule {
    ClassSchedule.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        uuid: {
          type: DataTypes.UUID,
          defaultValue: () => uuidv4(),
          allowNull: false,
          unique: true,
        },
        courseId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        programId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        instructorId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        title: { type: DataTypes.STRING(300), allowNull: false },
        dayOfWeek: {
          type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
          allowNull: false,
        },
        startTime: { type: DataTypes.TIME, allowNull: false },
        endTime: { type: DataTypes.TIME, allowNull: false },
        venue: { type: DataTypes.STRING(300), allowNull: true },
        isOnline: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        meetingLink: { type: DataTypes.STRING(500), allowNull: true },
        meetingPassword: { type: DataTypes.STRING(100), allowNull: true },
        effectiveFrom: { type: DataTypes.DATEONLY, allowNull: false },
        effectiveUntil: { type: DataTypes.DATEONLY, allowNull: true },
        isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
      },
      {
        sequelize,
        modelName: 'ClassSchedule',
        tableName: 'class_schedules',
        timestamps: true,
        underscored: false,
        paranoid: false,
        indexes: [
          { fields: ['courseId'] },
          { fields: ['instructorId'] },
          { fields: ['dayOfWeek'] },
          { fields: ['isActive'] },
        ],
      }
    );
    return ClassSchedule;
  }
}

export default ClassSchedule;

import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

interface StaffDepartmentAttributes {
  id: bigint;
  staffId: bigint;
  departmentId: bigint;
  isPrimary: boolean;
  assignedAt: Date;
}

interface StaffDepartmentCreationAttributes extends Optional<StaffDepartmentAttributes, 'id' | 'assignedAt'> {}

export class StaffDepartment extends Model<StaffDepartmentAttributes, StaffDepartmentCreationAttributes>
  implements StaffDepartmentAttributes {
  public id!: bigint;
  public staffId!: bigint;
  public departmentId!: bigint;
  public isPrimary!: boolean;
  public assignedAt!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof StaffDepartment {
    StaffDepartment.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        staffId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Reference to staff table',
        },
        departmentId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Reference to departments table',
        },
        isPrimary: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: 'Whether this is the primary department for the staff member',
        },
        assignedAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
          allowNull: false,
          comment: 'Date when staff was assigned to this department',
        },
      },
      {
        sequelize,
        tableName: 'staff_departments',
        timestamps: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            unique: true,
            fields: ['staffId', 'departmentId'],
            name: 'idx_staff_departments_unique',
          },
          {
            fields: ['staffId'],
            name: 'idx_staff_departments_staffId',
          },
          {
            fields: ['departmentId'],
            name: 'idx_staff_departments_departmentId',
          },
          {
            fields: ['isPrimary'],
            name: 'idx_staff_departments_isPrimary',
          },
        ],
        comment: 'Many-to-many junction: staff can belong to multiple departments',
      }
    );

    return StaffDepartment;
  }
}

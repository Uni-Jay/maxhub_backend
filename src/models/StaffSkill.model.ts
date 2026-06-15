import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface StaffSkillAttributes {
  id: bigint;
  uuid: string;
  staffId: bigint;
  skillName: string;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  yearsOfExperience?: number;
  endorsementCount: number;
  status: 'Active' | 'Inactive';
  deletedAt?: Date;
}

interface StaffSkillCreationAttributes extends Optional<StaffSkillAttributes, 'id' | 'uuid' | 'endorsementCount'> {}

export class StaffSkill extends Model<StaffSkillAttributes, StaffSkillCreationAttributes>
  implements StaffSkillAttributes {
  public id!: bigint;
  public uuid!: string;
  public staffId!: bigint;
  public skillName!: string;
  public proficiencyLevel!: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  public yearsOfExperience?: number;
  public endorsementCount!: number;
  public status!: 'Active' | 'Inactive';
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof StaffSkill {
    StaffSkill.init(
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
          unique: true,
          allowNull: false,
        },
        staffId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Reference to staff table',
        },
        skillName: {
          type: DataTypes.STRING(200),
          allowNull: false,
          comment: 'Skill name (JavaScript, Project Management, etc.)',
        },
        proficiencyLevel: {
          type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert'),
          defaultValue: 'Intermediate',
          allowNull: false,
          comment: 'Proficiency level in the skill',
        },
        yearsOfExperience: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          comment: 'Years of experience with this skill',
        },
        endorsementCount: {
          type: DataTypes.INTEGER.UNSIGNED,
          defaultValue: 0,
          allowNull: false,
          comment: 'Number of colleague endorsements',
        },
        status: {
          type: DataTypes.ENUM('Active', 'Inactive'),
          defaultValue: 'Active',
          allowNull: false,
          comment: 'Skill status',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
        sequelize,
        tableName: 'staff_skills',
        timestamps: true,
        paranoid: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          {
            fields: ['staffId'],
            name: 'idx_staff_skills_staffId',
          },
          {
            fields: ['skillName'],
            name: 'idx_staff_skills_skillName',
          },
          {
            fields: ['proficiencyLevel'],
            name: 'idx_staff_skills_proficiencyLevel',
          },
          {
            fields: ['status'],
            name: 'idx_staff_skills_status',
          },
          {
            fields: ['uuid'],
            name: 'idx_staff_skills_uuid',
          },
        ],
        comment: 'Employee skills with proficiency levels',
      }
    );

    return StaffSkill;
  }
}
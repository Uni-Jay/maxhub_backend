"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffSkill = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class StaffSkill extends sequelize_1.Model {
    static initModel(sequelize) {
        StaffSkill.init({
            id: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            uuid: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: () => (0, uuid_1.v4)(),
                unique: true,
                allowNull: false,
            },
            staffId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Reference to staff table',
            },
            skillName: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: false,
                comment: 'Skill name (JavaScript, Project Management, etc.)',
            },
            proficiencyLevel: {
                type: sequelize_1.DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert'),
                defaultValue: 'Intermediate',
                allowNull: false,
                comment: 'Proficiency level in the skill',
            },
            yearsOfExperience: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                comment: 'Years of experience with this skill',
            },
            endorsementCount: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                allowNull: false,
                comment: 'Number of colleague endorsements',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Active', 'Inactive'),
                defaultValue: 'Active',
                allowNull: false,
                comment: 'Skill status',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
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
        });
        return StaffSkill;
    }
}
exports.StaffSkill = StaffSkill;
//# sourceMappingURL=StaffSkill.model.js.map
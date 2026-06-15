"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Course = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Course extends sequelize_1.Model {
    static initModel(sequelize) {
        Course.init({
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
            courseCode: {
                type: sequelize_1.DataTypes.STRING(50),
                unique: true,
                allowNull: false,
                comment: 'Unique course code',
            },
            title: {
                type: sequelize_1.DataTypes.STRING(300),
                allowNull: false,
                comment: 'Course title',
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Course overview',
            },
            departmentId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Reference to departments table',
            },
            instructorId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Reference to staff table',
            },
            categoryId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Course category',
            },
            duration: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                comment: 'Duration in hours',
            },
            maxParticipants: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                comment: 'Maximum participants',
            },
            minParticipants: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                comment: 'Minimum participants to start',
            },
            fee: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                comment: 'Course fee',
            },
            startDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: false,
                comment: 'Course start date',
            },
            endDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: true,
                comment: 'Course end date',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Draft', 'Published', 'Ongoing', 'Completed', 'Cancelled', 'Archived'),
                defaultValue: 'Draft',
                allowNull: false,
                comment: 'Course status',
            },
            certificateRequired: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false,
                comment: 'Certificate required for completion',
            },
            passingScore: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                validate: { min: 0, max: 100 },
                comment: 'Passing score percentage',
            },
            createdById: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'User who created course',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'courses',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                { fields: ['courseCode'], name: 'idx_courses_courseCode' },
                { fields: ['instructorId'], name: 'idx_courses_instructorId' },
                { fields: ['departmentId'], name: 'idx_courses_departmentId' },
                { fields: ['status'], name: 'idx_courses_status' },
                { fields: ['startDate'], name: 'idx_courses_startDate' },
                { fields: ['uuid'], name: 'idx_courses_uuid' },
            ],
            comment: 'Learning management courses',
        });
        return Course;
    }
    isEnrollmentOpen() {
        const now = new Date();
        return this.status !== 'Cancelled' && now < this.startDate;
    }
    isOngoing() {
        const now = new Date();
        return this.status === 'Ongoing' && now >= this.startDate && (!this.endDate || now <= this.endDate);
    }
}
exports.Course = Course;
//# sourceMappingURL=Course.model.js.map
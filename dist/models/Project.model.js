"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Project extends sequelize_1.Model {
    static initModel(sequelize) {
        Project.init({
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
            projectCode: {
                type: sequelize_1.DataTypes.STRING(50),
                unique: true,
                allowNull: false,
                comment: 'Unique project code',
            },
            name: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: false,
                comment: 'Project name',
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Project overview',
            },
            departmentId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Reference to departments table',
            },
            clientId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Reference to contacts/accounts table (if client project)',
            },
            projectManagerId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Reference to staff table',
            },
            startDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: false,
                comment: 'Project start date',
            },
            endDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: true,
                comment: 'Project end date',
            },
            expectedEndDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: true,
                comment: 'Originally planned end date',
            },
            actualEndDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: true,
                comment: 'Actual completion date',
            },
            budget: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                comment: 'Project budget',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Planning', 'Active', 'OnHold', 'Completed', 'Cancelled', 'Archived'),
                defaultValue: 'Planning',
                allowNull: false,
                comment: 'Project status',
            },
            priority: {
                type: sequelize_1.DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
                defaultValue: 'Medium',
                allowNull: false,
                comment: 'Project priority',
            },
            progress: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                validate: {
                    min: 0,
                    max: 100,
                },
                comment: 'Project progress percentage (0-100)',
            },
            documentationUrl: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'URL to project documentation',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'projects',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['projectCode'],
                    name: 'idx_projects_projectCode',
                },
                {
                    fields: ['departmentId'],
                    name: 'idx_projects_departmentId',
                },
                {
                    fields: ['projectManagerId'],
                    name: 'idx_projects_projectManagerId',
                },
                {
                    fields: ['status'],
                    name: 'idx_projects_status',
                },
                {
                    fields: ['priority'],
                    name: 'idx_projects_priority',
                },
                {
                    fields: ['startDate'],
                    name: 'idx_projects_startDate',
                },
                {
                    fields: ['uuid'],
                    name: 'idx_projects_uuid',
                },
            ],
            comment: 'Project management and tracking',
        });
        return Project;
    }
    isDelayed() {
        if (!this.expectedEndDate)
            return false;
        if (this.status === 'Completed' && this.actualEndDate) {
            return this.actualEndDate > this.expectedEndDate;
        }
        return new Date() > this.expectedEndDate && this.status !== 'Completed';
    }
    getDaysRemaining() {
        if (!this.expectedEndDate)
            return null;
        const now = new Date();
        if (this.status === 'Completed' || this.status === 'Cancelled')
            return 0;
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        return Math.ceil((this.expectedEndDate.getTime() - now.getTime()) / millisecondsPerDay);
    }
}
exports.Project = Project;
//# sourceMappingURL=Project.model.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectComment = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class ProjectComment extends sequelize_1.Model {
    static initModel(sequelize) {
        ProjectComment.init({
            id: {
                type: sequelize_1.DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
            },
            uuid: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                unique: true,
                defaultValue: uuid_1.v4,
            },
            taskId: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                references: {
                    model: 'task',
                    key: 'id',
                },
            },
            projectId: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                references: {
                    model: 'project',
                    key: 'id',
                },
            },
            staffId: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                references: {
                    model: 'staff',
                    key: 'id',
                },
            },
            content: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false,
            },
            mentionedStaffIds: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
            },
            parentCommentId: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: true,
                references: {
                    model: 'project_comment',
                    key: 'id',
                },
            },
            isResolved: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            resolvedBy: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: true,
                references: {
                    model: 'staff',
                    key: 'id',
                },
            },
            resolvedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
        }, {
            sequelize,
            modelName: 'project_comment',
            tableName: 'project_comment',
            timestamps: true,
            paranoid: true,
            indexes: [
                {
                    fields: ['taskId'],
                },
                {
                    fields: ['projectId'],
                },
                {
                    fields: ['staffId'],
                },
                {
                    fields: ['isResolved'],
                },
            ],
        });
        return ProjectComment;
    }
}
exports.ProjectComment = ProjectComment;
//# sourceMappingURL=ProjectComment.model.js.map
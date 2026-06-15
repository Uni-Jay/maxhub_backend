"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectCommentMention = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class ProjectCommentMention extends sequelize_1.Model {
    static initModel(sequelize) {
        ProjectCommentMention.init({
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
            commentId: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                references: {
                    model: 'project_comment',
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
            mentionedStaffId: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                references: {
                    model: 'staff',
                    key: 'id',
                },
            },
            mentionedBy: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                references: {
                    model: 'staff',
                    key: 'id',
                },
            },
            mentionedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize_1.DataTypes.NOW,
            },
            notified: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            notificationDeliveredAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            notificationRead: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            acknowledgedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
        }, {
            sequelize,
            modelName: 'project_comment_mention',
            tableName: 'project_comment_mention',
            timestamps: true,
            paranoid: true,
            indexes: [
                {
                    fields: ['commentId', 'mentionedStaffId'],
                    unique: true,
                },
                {
                    fields: ['mentionedStaffId', 'notified'],
                },
                {
                    fields: ['projectId', 'mentionedStaffId'],
                },
            ],
        });
        return ProjectCommentMention;
    }
}
exports.ProjectCommentMention = ProjectCommentMention;
//# sourceMappingURL=ProjectCommentMention.model.js.map
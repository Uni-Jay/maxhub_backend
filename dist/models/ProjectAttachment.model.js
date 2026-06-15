"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectAttachment = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class ProjectAttachment extends sequelize_1.Model {
    static initModel(sequelize) {
        ProjectAttachment.init({
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
            projectId: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: true,
                references: {
                    model: 'project',
                    key: 'id',
                },
            },
            taskId: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: true,
                references: {
                    model: 'task',
                    key: 'id',
                },
            },
            commentId: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: true,
                references: {
                    model: 'project_comment',
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
            fileName: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
            },
            fileSize: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
            },
            fileType: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
            },
            fileUrl: {
                type: sequelize_1.DataTypes.STRING(500),
                allowNull: false,
            },
            s3Key: {
                type: sequelize_1.DataTypes.STRING(500),
                allowNull: true,
            },
            attachmentType: {
                type: sequelize_1.DataTypes.ENUM('Document', 'Image', 'Video', 'Audio', 'Other'),
                allowNull: false,
                defaultValue: 'Document',
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            uploadedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize_1.DataTypes.NOW,
            },
            downloadCount: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        }, {
            sequelize,
            modelName: 'project_attachment',
            tableName: 'project_attachment',
            timestamps: true,
            paranoid: true,
            indexes: [
                {
                    fields: ['projectId'],
                },
                {
                    fields: ['taskId'],
                },
                {
                    fields: ['commentId'],
                },
                {
                    fields: ['staffId'],
                },
            ],
        });
        return ProjectAttachment;
    }
}
exports.ProjectAttachment = ProjectAttachment;
//# sourceMappingURL=ProjectAttachment.model.js.map
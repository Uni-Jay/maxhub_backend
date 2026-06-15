"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectNote = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class ProjectNote extends sequelize_1.Model {
    static initModel(sequelize) {
        ProjectNote.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            projectId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Project ID' },
            noteTitle: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Note title' },
            noteContent: { type: sequelize_1.DataTypes.TEXT, allowNull: false, comment: 'Note content' },
            noteType: { type: sequelize_1.DataTypes.ENUM('General', 'Technical', 'Risk', 'Decision', 'Change', 'Issue', 'Meeting'), defaultValue: 'General' },
            priority: { type: sequelize_1.DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'), defaultValue: 'Medium' },
            createdById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
            attachmentUrl: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Attachment URL/path' },
            isPublic: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Is public' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'project_notes', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['projectId'], name: 'idx_project_notes_projectId' },
                { fields: ['noteType'], name: 'idx_project_notes_noteType' },
                { fields: ['priority'], name: 'idx_project_notes_priority' },
                { fields: ['createdById'], name: 'idx_project_notes_createdById' },
                { fields: ['uuid'], name: 'idx_project_notes_uuid' },
            ],
            comment: 'Project notes and documentation'
        });
        return ProjectNote;
    }
}
exports.ProjectNote = ProjectNote;
//# sourceMappingURL=ProjectNote.model.js.map
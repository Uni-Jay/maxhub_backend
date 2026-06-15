"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KanbanBoard = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class KanbanBoard extends sequelize_1.Model {
    static initModel(sequelize) {
        KanbanBoard.init({
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
                allowNull: false,
                references: {
                    model: 'project',
                    key: 'id',
                },
            },
            name: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            boardType: {
                type: sequelize_1.DataTypes.ENUM('Kanban', 'Sprint', 'Custom'),
                allowNull: false,
                defaultValue: 'Kanban',
            },
            statusColumns: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: false,
                defaultValue: ['Todo', 'In Progress', 'Review', 'Done'],
            },
            isDefault: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            displayOrder: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            createdBy: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                references: {
                    model: 'staff',
                    key: 'id',
                },
            },
            archivedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
        }, {
            sequelize,
            modelName: 'kanban_board',
            tableName: 'kanban_board',
            timestamps: true,
            paranoid: true,
            indexes: [
                {
                    fields: ['projectId'],
                },
                {
                    fields: ['isDefault'],
                },
            ],
        });
        return KanbanBoard;
    }
}
exports.KanbanBoard = KanbanBoard;
//# sourceMappingURL=KanbanBoard.model.js.map
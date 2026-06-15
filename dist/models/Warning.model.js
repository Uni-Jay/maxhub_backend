"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Warning = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Warning extends sequelize_1.Model {
    static initModel(sequelize) {
        Warning.init({
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
            staffId: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                references: {
                    model: 'staff',
                    key: 'id',
                },
            },
            issuedBy: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                references: {
                    model: 'staff',
                    key: 'id',
                },
            },
            warningType: {
                type: sequelize_1.DataTypes.ENUM('Verbal', 'Written', 'Final'),
                allowNull: false,
            },
            reason: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            issuedDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize_1.DataTypes.NOW,
            },
            followUpDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            escalationLevel: {
                type: sequelize_1.DataTypes.ENUM('1', '2', '3'),
                allowNull: false,
                defaultValue: '1',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Active', 'Resolved', 'Escalated', 'Withdrawn'),
                allowNull: false,
                defaultValue: 'Active',
            },
            resolutionDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            resolutionNotes: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            acknowledgedBy: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: true,
                references: {
                    model: 'staff',
                    key: 'id',
                },
            },
            acknowledgedDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
        }, {
            sequelize,
            modelName: 'warning',
            tableName: 'warning',
            timestamps: true,
            paranoid: true,
            indexes: [
                {
                    fields: ['staffId'],
                },
                {
                    fields: ['issuedBy'],
                },
                {
                    fields: ['status'],
                },
                {
                    fields: ['issuedDate'],
                },
            ],
        });
        return Warning;
    }
}
exports.Warning = Warning;
//# sourceMappingURL=Warning.model.js.map
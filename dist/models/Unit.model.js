"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Unit = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Unit extends sequelize_1.Model {
    static initModel(sequelize) {
        Unit.init({
            id: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            uuid: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: () => (0, uuid_1.v4)(),
                allowNull: false,
                unique: true,
            },
            name: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: false,
                comment: 'Core unit name e.g. Finance Unit, IT Unit',
            },
            code: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: false,
                comment: 'Short unit code e.g. FIN, IT, HR',
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            branchId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Reference to branches table',
            },
            headUserId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Reference to users table — unit head',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Active', 'Inactive'),
                defaultValue: 'Active',
                allowNull: false,
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
        }, {
            sequelize,
            tableName: 'units',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                { fields: ['code', 'branchId'], name: 'idx_units_code_branchId' },
                { fields: ['branchId'], name: 'idx_units_branchId' },
                { fields: ['status'], name: 'idx_units_status' },
                { fields: ['uuid'], name: 'idx_units_uuid' },
            ],
            comment: 'Core organizational units within a branch',
        });
        return Unit;
    }
}
exports.Unit = Unit;
//# sourceMappingURL=Unit.model.js.map
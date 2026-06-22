"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Broadcast = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Broadcast extends sequelize_1.Model {
    static initModel(sequelize) {
        Broadcast.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true },
            title: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
            message: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
            audienceType: { type: sequelize_1.DataTypes.ENUM('All', 'BusinessUnit', 'Department', 'Role'), defaultValue: 'All' },
            audienceValue: { type: sequelize_1.DataTypes.STRING(255), allowNull: true },
            createdById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        }, {
            sequelize,
            tableName: 'broadcasts',
            paranoid: true,
            timestamps: true,
            underscored: false,
            freezeTableName: true,
        });
        return Broadcast;
    }
}
exports.Broadcast = Broadcast;
exports.default = Broadcast;
//# sourceMappingURL=Broadcast.model.js.map
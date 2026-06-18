"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffQueryReply = void 0;
const sequelize_1 = require("sequelize");
class StaffQueryReply extends sequelize_1.Model {
    static initModel(sequelize) {
        StaffQueryReply.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, unique: true },
            queryId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
            message: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
            senderUserId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
            isInternal: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
            attachments: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        }, {
            sequelize,
            modelName: 'StaffQueryReply',
            tableName: 'staff_query_replies',
            paranoid: true,
            timestamps: true,
            underscored: false,
        });
    }
}
exports.StaffQueryReply = StaffQueryReply;
exports.default = StaffQueryReply;
//# sourceMappingURL=StaffQueryReply.model.js.map
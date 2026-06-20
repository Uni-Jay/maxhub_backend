"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientNote = void 0;
const sequelize_1 = require("sequelize");
class ClientNote extends sequelize_1.Model {
    static initModel(sequelize) {
        ClientNote.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, unique: true },
            clientId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
            note: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
            createdByUserId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
        }, {
            sequelize,
            modelName: 'ClientNote',
            tableName: 'client_notes',
            paranoid: true,
            timestamps: true,
            underscored: false,
        });
    }
}
exports.ClientNote = ClientNote;
exports.default = ClientNote;
//# sourceMappingURL=ClientNote.model.js.map
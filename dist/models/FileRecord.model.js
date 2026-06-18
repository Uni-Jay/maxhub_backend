"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileRecord = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class FileRecord extends sequelize_1.Model {
    static initModel(sequelize) {
        FileRecord.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true },
            name: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
            originalName: { type: sequelize_1.DataTypes.STRING(255), allowNull: true },
            path: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            mimeType: { type: sequelize_1.DataTypes.STRING(120), allowNull: true },
            size: { type: sequelize_1.DataTypes.BIGINT, defaultValue: 0 },
            folderId: { type: sequelize_1.DataTypes.STRING(36), allowNull: true },
            isFolder: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
            icon: { type: sequelize_1.DataTypes.STRING(10), allowNull: true },
            uploadedById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true },
            uploadedByName: { type: sequelize_1.DataTypes.STRING(200), allowNull: true },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        }, {
            sequelize,
            tableName: 'file_records',
            paranoid: true,
            timestamps: true,
            underscored: false,
            freezeTableName: true,
        });
        return FileRecord;
    }
}
exports.FileRecord = FileRecord;
exports.default = FileRecord;
//# sourceMappingURL=FileRecord.model.js.map
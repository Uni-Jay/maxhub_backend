"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Program = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Program extends sequelize_1.Model {
    static initModel(sequelize) {
        Program.init({
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
            companyId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
            name: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
            code: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            level: {
                type: sequelize_1.DataTypes.ENUM('Certificate', 'Diploma', 'Professional', 'Short Course'),
                allowNull: false,
            },
            durationMonths: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 3 },
            maxStudents: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true },
            tuitionFee: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: true },
            currency: { type: sequelize_1.DataTypes.STRING(10), allowNull: false, defaultValue: 'NGN' },
            prerequisites: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            outcomes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            thumbnail: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
            status: {
                type: sequelize_1.DataTypes.ENUM('Active', 'Inactive', 'Draft'),
                allowNull: false,
                defaultValue: 'Draft',
            },
            createdById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true },
        }, {
            sequelize,
            modelName: 'Program',
            tableName: 'programs',
            timestamps: true,
            indexes: [{ fields: ['companyId'] }, { fields: ['status'] }],
        });
        return Program;
    }
}
exports.Program = Program;
exports.default = Program;
//# sourceMappingURL=Program.model.js.map
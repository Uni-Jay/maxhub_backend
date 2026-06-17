"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Branch = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Branch extends sequelize_1.Model {
    static initModel(sequelize) {
        Branch.init({
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
            branchCode: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: false,
                unique: true,
                comment: 'Unique branch code e.g. HQ, LAG01, ABJ01',
            },
            branchName: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: false,
                comment: 'Full branch name',
            },
            country: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
            },
            state: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
            },
            city: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
            },
            address: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            phone: {
                type: sequelize_1.DataTypes.STRING(30),
                allowNull: true,
            },
            email: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true,
                validate: { isEmail: true },
            },
            managerId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Reference to users table — branch manager',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Active', 'Inactive', 'Closed'),
                defaultValue: 'Active',
                allowNull: false,
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
        }, {
            sequelize,
            tableName: 'branches',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                { fields: ['branchCode'], name: 'idx_branches_branchCode' },
                { fields: ['status'], name: 'idx_branches_status' },
                { fields: ['managerId'], name: 'idx_branches_managerId' },
                { fields: ['uuid'], name: 'idx_branches_uuid' },
            ],
            comment: 'Company branch / office locations',
        });
        return Branch;
    }
}
exports.Branch = Branch;
//# sourceMappingURL=Branch.model.js.map
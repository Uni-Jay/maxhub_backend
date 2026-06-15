"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveType = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class LeaveType extends sequelize_1.Model {
    static initModel(sequelize) {
        LeaveType.init({
            id: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            uuid: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: () => (0, uuid_1.v4)(),
                unique: true,
                allowNull: false,
            },
            code: {
                type: sequelize_1.DataTypes.STRING(50),
                unique: true,
                allowNull: false,
                comment: 'Leave type code (PL, SL, CL, etc.)',
            },
            name: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
                comment: 'Leave type name',
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Leave type details',
            },
            categoryType: {
                type: sequelize_1.DataTypes.ENUM('Paid', 'Unpaid', 'Compulsory'),
                allowNull: false,
                comment: 'Leave payment category',
            },
            maxDaysPerYear: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                allowNull: false,
                comment: 'Maximum days per calendar year',
            },
            carryForwardDays: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                comment: 'Carryover days to next year',
            },
            requiresApproval: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: true,
                allowNull: false,
                comment: 'Whether manager approval is required',
            },
            applicableToAll: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: true,
                allowNull: false,
                comment: 'Whether applicable to all staff',
            },
            applicableDepartments: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
                comment: 'Departments for which leave is applicable',
            },
            applicableDesignations: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
                comment: 'Designations for which leave is applicable',
            },
            attachmentRequired: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false,
                comment: 'Whether medical certificate or proof is required',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Active', 'Inactive'),
                defaultValue: 'Active',
                allowNull: false,
                comment: 'Leave type status',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'leave_types',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['code'],
                    name: 'idx_leave_types_code',
                },
                {
                    fields: ['categoryType'],
                    name: 'idx_leave_types_categoryType',
                },
                {
                    fields: ['status'],
                    name: 'idx_leave_types_status',
                },
                {
                    fields: ['uuid'],
                    name: 'idx_leave_types_uuid',
                },
            ],
            comment: 'Leave type configurations',
        });
        return LeaveType;
    }
}
exports.LeaveType = LeaveType;
//# sourceMappingURL=LeaveType.model.js.map
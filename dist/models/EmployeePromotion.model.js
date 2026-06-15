"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeePromotion = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class EmployeePromotion extends sequelize_1.Model {
    static initModel(sequelize) {
        EmployeePromotion.init({
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
            fromDesignationId: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                references: {
                    model: 'designation',
                    key: 'id',
                },
            },
            toDesignationId: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                references: {
                    model: 'designation',
                    key: 'id',
                },
            },
            fromDepartmentId: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: true,
                references: {
                    model: 'department',
                    key: 'id',
                },
            },
            toDepartmentId: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: true,
                references: {
                    model: 'department',
                    key: 'id',
                },
            },
            promotionDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: false,
                defaultValue: sequelize_1.DataTypes.NOW,
            },
            effectiveDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: false,
            },
            reason: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            promotedBy: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                references: {
                    model: 'staff',
                    key: 'id',
                },
            },
            salaryIncreasePercentage: {
                type: sequelize_1.DataTypes.DECIMAL(5, 2),
                allowNull: true,
            },
            newSalary: {
                type: sequelize_1.DataTypes.DECIMAL(12, 2),
                allowNull: true,
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Proposed', 'Approved', 'Rejected', 'Effective', 'Completed'),
                allowNull: false,
                defaultValue: 'Proposed',
            },
            approvalDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            approvalRemarks: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            rejectionReason: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
        }, {
            sequelize,
            modelName: 'employee_promotion',
            tableName: 'employee_promotion',
            timestamps: true,
            paranoid: true,
            indexes: [
                {
                    fields: ['staffId'],
                },
                {
                    fields: ['status'],
                },
                {
                    fields: ['effectiveDate'],
                },
            ],
        });
        return EmployeePromotion;
    }
}
exports.EmployeePromotion = EmployeePromotion;
//# sourceMappingURL=EmployeePromotion.model.js.map
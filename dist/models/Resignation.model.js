"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resignation = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Resignation extends sequelize_1.Model {
    static initModel(sequelize) {
        Resignation.init({
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
                unique: true,
                references: {
                    model: 'staff',
                    key: 'id',
                },
            },
            resignationDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: false,
                defaultValue: sequelize_1.DataTypes.NOW,
            },
            lastWorkingDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: true,
            },
            reasonForResignation: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false,
            },
            noticePeroidDays: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 30,
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Submitted', 'Acknowledged', 'Approved', 'Rejected', 'Completed'),
                allowNull: false,
                defaultValue: 'Submitted',
            },
            acknowledgmentDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            approvalDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            approvedBy: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: true,
                references: {
                    model: 'staff',
                    key: 'id',
                },
            },
            rejectionReason: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            exitInterviewDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            finalSettlementDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            remarks: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
        }, {
            sequelize,
            modelName: 'resignation',
            tableName: 'resignation',
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
                    fields: ['resignationDate'],
                },
            ],
        });
        return Resignation;
    }
}
exports.Resignation = Resignation;
//# sourceMappingURL=Resignation.model.js.map
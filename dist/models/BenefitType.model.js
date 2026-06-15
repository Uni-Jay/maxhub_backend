"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BenefitType = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class BenefitType extends sequelize_1.Model {
    static initModel(sequelize) {
        BenefitType.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            benefitCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Benefit code' },
            benefitName: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Benefit name' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Description' },
            benefitType: { type: sequelize_1.DataTypes.ENUM('Health', 'Insurance', 'Retirement', 'Leave', 'Financial', 'Wellness', 'Other'), allowNull: false },
            isActive: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true, allowNull: false, comment: 'Is active' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'benefit_types', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['benefitCode'], name: 'idx_benefit_types_benefitCode' },
                { fields: ['benefitType'], name: 'idx_benefit_types_benefitType' },
                { fields: ['isActive'], name: 'idx_benefit_types_isActive' },
                { fields: ['uuid'], name: 'idx_benefit_types_uuid' },
            ],
            comment: 'Employee benefit types'
        });
        return BenefitType;
    }
}
exports.BenefitType = BenefitType;
//# sourceMappingURL=BenefitType.model.js.map
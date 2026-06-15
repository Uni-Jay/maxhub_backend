"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingProgram = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class TrainingProgram extends sequelize_1.Model {
    static initModel(sequelize) {
        TrainingProgram.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            trainingCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Training code' },
            trainingName: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Training name' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Description' },
            trainingType: { type: sequelize_1.DataTypes.ENUM('Mandatory', 'Optional', 'InductionProgram', 'SkillDevelopment', 'Leadership'), allowNull: false },
            duration: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false, comment: 'Duration' },
            durationUnit: { type: sequelize_1.DataTypes.ENUM('Days', 'Weeks', 'Months', 'Hours'), allowNull: false },
            provider: { type: sequelize_1.DataTypes.STRING(200), allowNull: true, comment: 'Training provider' },
            location: { type: sequelize_1.DataTypes.STRING(200), allowNull: true, comment: 'Location' },
            status: { type: sequelize_1.DataTypes.ENUM('Draft', 'Active', 'Completed', 'Cancelled'), defaultValue: 'Draft' },
            startDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, comment: 'Start date' },
            endDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, comment: 'End date' },
            budget: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: true, comment: 'Budget' },
            createdById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'training_programs', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['trainingCode'], name: 'idx_training_programs_trainingCode' },
                { fields: ['trainingType'], name: 'idx_training_programs_trainingType' },
                { fields: ['status'], name: 'idx_training_programs_status' },
                { fields: ['startDate'], name: 'idx_training_programs_startDate' },
                { fields: ['uuid'], name: 'idx_training_programs_uuid' },
            ],
            comment: 'Training programs'
        });
        return TrainingProgram;
    }
}
exports.TrainingProgram = TrainingProgram;
//# sourceMappingURL=TrainingProgram.model.js.map
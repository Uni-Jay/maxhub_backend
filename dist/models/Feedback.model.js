"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Feedback = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Feedback extends sequelize_1.Model {
    static initModel(sequelize) {
        Feedback.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            feedbackCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Feedback code' },
            employeeId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Employee/Staff ID' },
            givenBy: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Given by user ID' },
            feedbackType: { type: sequelize_1.DataTypes.ENUM('Positive', 'Constructive', 'Neutral'), allowNull: false },
            category: { type: sequelize_1.DataTypes.STRING(100), allowNull: false, comment: 'Category' },
            subject: { type: sequelize_1.DataTypes.STRING(200), allowNull: true, comment: 'Subject' },
            comment: { type: sequelize_1.DataTypes.TEXT, allowNull: false, comment: 'Feedback comment' },
            isAnonymous: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Anonymous feedback' },
            isPublic: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Public feedback' },
            acknowledgement: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Acknowledgement' },
            acknowledgedDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Acknowledgement date' },
            rating: { type: sequelize_1.DataTypes.INTEGER, allowNull: true, comment: 'Rating 1-5' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'feedbacks', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['feedbackCode'], name: 'idx_feedbacks_feedbackCode' },
                { fields: ['employeeId'], name: 'idx_feedbacks_employeeId' },
                { fields: ['givenBy'], name: 'idx_feedbacks_givenBy' },
                { fields: ['feedbackType'], name: 'idx_feedbacks_feedbackType' },
                { fields: ['isAnonymous'], name: 'idx_feedbacks_isAnonymous' },
                { fields: ['uuid'], name: 'idx_feedbacks_uuid' },
            ],
            comment: 'Employee feedback'
        });
        return Feedback;
    }
}
exports.Feedback = Feedback;
//# sourceMappingURL=Feedback.model.js.map
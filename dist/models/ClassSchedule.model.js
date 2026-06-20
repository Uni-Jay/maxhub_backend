"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassSchedule = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class ClassSchedule extends sequelize_1.Model {
    static initModel(sequelize) {
        ClassSchedule.init({
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
            courseId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
            programId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true },
            instructorId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true },
            title: { type: sequelize_1.DataTypes.STRING(300), allowNull: false },
            dayOfWeek: {
                type: sequelize_1.DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
                allowNull: false,
            },
            startTime: { type: sequelize_1.DataTypes.TIME, allowNull: false },
            endTime: { type: sequelize_1.DataTypes.TIME, allowNull: false },
            venue: { type: sequelize_1.DataTypes.STRING(300), allowNull: true },
            isOnline: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            meetingLink: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
            meetingPassword: { type: sequelize_1.DataTypes.STRING(100), allowNull: true },
            effectiveFrom: { type: sequelize_1.DataTypes.DATEONLY, allowNull: false },
            effectiveUntil: { type: sequelize_1.DataTypes.DATEONLY, allowNull: true },
            isActive: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        }, {
            sequelize,
            modelName: 'ClassSchedule',
            tableName: 'class_schedules',
            timestamps: true,
            underscored: false,
            paranoid: false,
            indexes: [
                { fields: ['courseId'] },
                { fields: ['instructorId'] },
                { fields: ['dayOfWeek'] },
                { fields: ['isActive'] },
            ],
        });
        return ClassSchedule;
    }
}
exports.ClassSchedule = ClassSchedule;
exports.default = ClassSchedule;
//# sourceMappingURL=ClassSchedule.model.js.map
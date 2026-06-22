"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const sequelize_1 = require("sequelize");
const Department_model_1 = require("./Department.model");
class Client extends sequelize_1.Model {
    static initModel(sequelize) {
        Client.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, unique: true },
            clientId: { type: sequelize_1.DataTypes.STRING(20), unique: true },
            fullName: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
            email: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
            phone: { type: sequelize_1.DataTypes.STRING(20), allowNull: false },
            alternatePhone: { type: sequelize_1.DataTypes.STRING(20), allowNull: true },
            address: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            city: { type: sequelize_1.DataTypes.STRING(100), allowNull: true },
            state: { type: sequelize_1.DataTypes.STRING(100), allowNull: true },
            country: { type: sequelize_1.DataTypes.STRING(100), allowNull: true },
            nationality: { type: sequelize_1.DataTypes.STRING(100), allowNull: true },
            dateOfBirth: { type: sequelize_1.DataTypes.DATEONLY, allowNull: true },
            passportUrl: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
            avatar: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
            departmentId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true },
            assignedStaffId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true },
            registrationDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
            status: {
                type: sequelize_1.DataTypes.ENUM('Active', 'Inactive', 'Pending', 'Suspended'),
                defaultValue: 'Active',
            },
            notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            createdByUserId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
        }, {
            sequelize,
            modelName: 'Client',
            tableName: 'clients',
            paranoid: true,
            timestamps: true,
            underscored: false,
            hooks: {
                afterCreate: async (client) => {
                    if (client.clientId)
                        return;
                    let prefix = 'CLT';
                    if (client.departmentId) {
                        const dept = await Department_model_1.Department.findByPk(client.departmentId, { attributes: ['code'] });
                        if (dept?.code)
                            prefix = dept.code;
                    }
                    const countInScope = client.departmentId
                        ? await Client.count({ where: { departmentId: client.departmentId } })
                        : await Client.count({ where: { departmentId: null } });
                    client.clientId = `${prefix}-${String(countInScope).padStart(4, '0')}`;
                    await client.save();
                },
            },
        });
    }
}
exports.Client = Client;
exports.default = Client;
//# sourceMappingURL=Client.model.js.map
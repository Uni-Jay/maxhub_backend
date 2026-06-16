"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientDocument = void 0;
const sequelize_1 = require("sequelize");
class ClientDocument extends sequelize_1.Model {
    static initModel(sequelize) {
        ClientDocument.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, unique: true },
            clientId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
            documentName: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
            category: {
                type: sequelize_1.DataTypes.ENUM('Passport', 'Certificate', 'Visa', 'AdmissionLetter', 'EmploymentDocument', 'Contract', 'IdentityDocument', 'Other'),
                defaultValue: 'Other',
            },
            fileUrl: { type: sequelize_1.DataTypes.STRING(1000), allowNull: false },
            fileSize: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
            mimeType: { type: sequelize_1.DataTypes.STRING(100), allowNull: true },
            version: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 1 },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            uploadedByUserId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false },
        }, {
            sequelize,
            modelName: 'ClientDocument',
            tableName: 'client_documents',
            paranoid: true,
            timestamps: true,
        });
    }
}
exports.ClientDocument = ClientDocument;
exports.default = ClientDocument;
//# sourceMappingURL=ClientDocument.model.js.map
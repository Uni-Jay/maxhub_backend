"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeDocument = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class EmployeeDocument extends sequelize_1.Model {
    static initModel(sequelize) {
        EmployeeDocument.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            documentCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Document code' },
            staffId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Staff ID' },
            documentType: { type: sequelize_1.DataTypes.ENUM('Contract', 'Letter', 'Agreement', 'Certification', 'License', 'Insurance', 'Other'), allowNull: false },
            documentName: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Document name' },
            documentUrl: { type: sequelize_1.DataTypes.TEXT, allowNull: false, comment: 'Document URL/path' },
            issueDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Issue date' },
            expiryDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Expiry date' },
            status: { type: sequelize_1.DataTypes.ENUM('Active', 'Expired', 'Archived', 'Revoked'), defaultValue: 'Active' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Description' },
            uploadedBy: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Uploaded by user ID' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'employee_documents', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['documentCode'], name: 'idx_employee_documents_documentCode' },
                { fields: ['staffId'], name: 'idx_employee_documents_staffId' },
                { fields: ['documentType'], name: 'idx_employee_documents_documentType' },
                { fields: ['status'], name: 'idx_employee_documents_status' },
                { fields: ['expiryDate'], name: 'idx_employee_documents_expiryDate' },
                { fields: ['uuid'], name: 'idx_employee_documents_uuid' },
            ],
            comment: 'Employee documents'
        });
        return EmployeeDocument;
    }
}
exports.EmployeeDocument = EmployeeDocument;
//# sourceMappingURL=EmployeeDocument.model.js.map
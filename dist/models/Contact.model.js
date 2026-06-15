"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contact = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Contact extends sequelize_1.Model {
    static initModel(sequelize) {
        Contact.init({
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
            contactCode: {
                type: sequelize_1.DataTypes.STRING(50),
                unique: true,
                allowNull: false,
                comment: 'Unique contact identifier',
            },
            firstName: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
                comment: 'Contact first name',
            },
            lastName: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
                comment: 'Contact last name',
            },
            email: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
                unique: true,
                validate: { isEmail: true },
                comment: 'Contact email address',
            },
            phone: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: false,
                comment: 'Primary phone number',
            },
            alternatePhone: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: true,
                comment: 'Alternate phone number',
            },
            company: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: true,
                comment: 'Company name',
            },
            position: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
                comment: 'Job position',
            },
            department: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
                comment: 'Department',
            },
            accountId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Reference to accounts table',
            },
            source: {
                type: sequelize_1.DataTypes.ENUM('Direct', 'Website', 'Email', 'Phone', 'Referral', 'Event', 'Social', 'Other'),
                defaultValue: 'Direct',
                allowNull: false,
                comment: 'Contact source',
            },
            leadScore: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                validate: {
                    min: 0,
                    max: 100,
                },
                comment: 'Lead scoring (0-100)',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('Active', 'Inactive', 'Lead', 'Prospect', 'Converted', 'Lost'),
                defaultValue: 'Lead',
                allowNull: false,
                comment: 'Contact status',
            },
            ownerUserId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Sales rep owner',
            },
            address: {
                type: sequelize_1.DataTypes.STRING(500),
                allowNull: true,
                comment: 'Street address',
            },
            city: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
                comment: 'City',
            },
            state: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
                comment: 'State/Province',
            },
            country: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
                comment: 'Country',
            },
            postalCode: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: true,
                comment: 'Postal/ZIP code',
            },
            industry: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
                comment: 'Industry classification',
            },
            noOfEmployees: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
                comment: 'Number of employees (for company)',
            },
            websiteUrl: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true,
                comment: 'Website URL',
            },
            notes: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Internal notes',
            },
            lastContactedDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Last contact date',
            },
            nextFollowUpDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Next follow-up date',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'contacts',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['contactCode'],
                    name: 'idx_contacts_contactCode',
                },
                {
                    fields: ['email'],
                    name: 'idx_contacts_email',
                },
                {
                    fields: ['accountId'],
                    name: 'idx_contacts_accountId',
                },
                {
                    fields: ['ownerUserId'],
                    name: 'idx_contacts_ownerUserId',
                },
                {
                    fields: ['status'],
                    name: 'idx_contacts_status',
                },
                {
                    fields: ['source'],
                    name: 'idx_contacts_source',
                },
                {
                    fields: ['nextFollowUpDate'],
                    name: 'idx_contacts_nextFollowUpDate',
                },
                {
                    fields: ['uuid'],
                    name: 'idx_contacts_uuid',
                },
            ],
            comment: 'CRM contacts (leads and customers)',
        });
        return Contact;
    }
    getFullName() {
        return `${this.firstName} ${this.lastName}`;
    }
    isFollowUpOverdue() {
        if (!this.nextFollowUpDate)
            return false;
        return new Date() > this.nextFollowUpDate;
    }
    daysSinceLastContact() {
        if (!this.lastContactedDate)
            return null;
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        return Math.floor((new Date().getTime() - this.lastContactedDate.getTime()) / millisecondsPerDay);
    }
}
exports.Contact = Contact;
//# sourceMappingURL=Contact.model.js.map
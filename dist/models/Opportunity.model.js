"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Opportunity = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Opportunity extends sequelize_1.Model {
    static initModel(sequelize) {
        Opportunity.init({
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
            opportunityCode: {
                type: sequelize_1.DataTypes.STRING(50),
                unique: true,
                allowNull: false,
                comment: 'Unique opportunity identifier',
            },
            title: {
                type: sequelize_1.DataTypes.STRING(300),
                allowNull: false,
                comment: 'Opportunity title',
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Opportunity details',
            },
            accountId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Reference to accounts table',
            },
            primaryContactId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Reference to contacts table',
            },
            ownerUserId: {
                type: sequelize_1.DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Sales rep owner',
            },
            amount: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false,
                comment: 'Deal amount',
            },
            currency: {
                type: sequelize_1.DataTypes.STRING(3),
                defaultValue: 'USD',
                allowNull: false,
                comment: 'Currency code (USD, EUR, etc.)',
            },
            closeDate: {
                type: sequelize_1.DataTypes.DATEONLY,
                allowNull: false,
                comment: 'Expected close date',
            },
            stage: {
                type: sequelize_1.DataTypes.ENUM('Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost', 'Closed'),
                defaultValue: 'Prospecting',
                allowNull: false,
                comment: 'Sales pipeline stage',
            },
            probability: {
                type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
                defaultValue: 0,
                validate: {
                    min: 0,
                    max: 100,
                },
                comment: 'Win probability percentage',
            },
            expectedRevenue: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                comment: 'Expected revenue (amount * probability)',
            },
            priority: {
                type: sequelize_1.DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
                defaultValue: 'Medium',
                allowNull: false,
                comment: 'Opportunity priority',
            },
            type: {
                type: sequelize_1.DataTypes.ENUM('New Business', 'Expansion', 'Renewal', 'Upgrade', 'Cross-sell', 'Up-sell'),
                defaultValue: 'New Business',
                allowNull: false,
                comment: 'Opportunity type',
            },
            source: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
                comment: 'Opportunity source',
            },
            competitorInfo: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Competitor information',
            },
            nextStepDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Date of next step',
            },
            nextStep: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Next action to take',
            },
            lostReason: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'Reason for losing deal',
            },
            lostDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'When opportunity was lost',
            },
            wonDate: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'When opportunity was won',
            },
            deletedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Soft delete timestamp',
            },
        }, {
            sequelize,
            tableName: 'opportunities',
            timestamps: true,
            paranoid: true,
            underscored: false,
            freezeTableName: true,
            indexes: [
                {
                    fields: ['opportunityCode'],
                    name: 'idx_opportunities_opportunityCode',
                },
                {
                    fields: ['accountId'],
                    name: 'idx_opportunities_accountId',
                },
                {
                    fields: ['primaryContactId'],
                    name: 'idx_opportunities_primaryContactId',
                },
                {
                    fields: ['ownerUserId'],
                    name: 'idx_opportunities_ownerUserId',
                },
                {
                    fields: ['stage'],
                    name: 'idx_opportunities_stage',
                },
                {
                    fields: ['closeDate'],
                    name: 'idx_opportunities_closeDate',
                },
                {
                    fields: ['type'],
                    name: 'idx_opportunities_type',
                },
                {
                    fields: ['uuid'],
                    name: 'idx_opportunities_uuid',
                },
            ],
            comment: 'Sales opportunities in pipeline',
        });
        return Opportunity;
    }
    isOverdue() {
        return new Date() > this.closeDate && this.stage !== 'Won' && this.stage !== 'Lost' && this.stage !== 'Closed';
    }
    calculateExpectedValue() {
        return (Number(this.amount) * (this.probability || 0)) / 100;
    }
    daysUntilClose() {
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        return Math.ceil((this.closeDate.getTime() - new Date().getTime()) / millisecondsPerDay);
    }
    isNextStepOverdue() {
        if (!this.nextStepDate || this.stage === 'Won' || this.stage === 'Lost' || this.stage === 'Closed')
            return false;
        return new Date() > this.nextStepDate;
    }
}
exports.Opportunity = Opportunity;
//# sourceMappingURL=Opportunity.model.js.map
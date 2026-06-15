import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface OpportunityAttributes {
  id: bigint;
  uuid: string;
  opportunityCode: string;
  title: string;
  description?: string;
  accountId?: bigint;
  primaryContactId: bigint;
  ownerUserId: bigint;
  amount: number;
  currency: string;
  closeDate: Date;
  stage: 'Prospecting' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost' | 'Closed';
  probability?: number;
  expectedRevenue?: number;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  type: 'New Business' | 'Expansion' | 'Renewal' | 'Upgrade' | 'Cross-sell' | 'Up-sell';
  source?: string;
  competitorInfo?: string;
  nextStepDate?: Date;
  nextStep?: string;
  lostReason?: string;
  lostDate?: Date;
  wonDate?: Date;
  deletedAt?: Date;
}

interface OpportunityCreationAttributes extends Optional<OpportunityAttributes, 'id' | 'uuid'> {}

export class Opportunity extends Model<OpportunityAttributes, OpportunityCreationAttributes>
  implements OpportunityAttributes {
  public id!: bigint;
  public uuid!: string;
  public opportunityCode!: string;
  public title!: string;
  public description?: string;
  public accountId?: bigint;
  public primaryContactId!: bigint;
  public ownerUserId!: bigint;
  public amount!: number;
  public currency!: string;
  public closeDate!: Date;
  public stage!: 'Prospecting' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost' | 'Closed';
  public probability?: number;
  public expectedRevenue?: number;
  public priority!: 'Low' | 'Medium' | 'High' | 'Critical';
  public type!: 'New Business' | 'Expansion' | 'Renewal' | 'Upgrade' | 'Cross-sell' | 'Up-sell';
  public source?: string;
  public competitorInfo?: string;
  public nextStepDate?: Date;
  public nextStep?: string;
  public lostReason?: string;
  public lostDate?: Date;
  public wonDate?: Date;
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Opportunity {
    Opportunity.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        uuid: {
          type: DataTypes.UUID,
          defaultValue: () => uuidv4(),
          unique: true,
          allowNull: false,
        },
        opportunityCode: {
          type: DataTypes.STRING(50),
          unique: true,
          allowNull: false,
          comment: 'Unique opportunity identifier',
        },
        title: {
          type: DataTypes.STRING(300),
          allowNull: false,
          comment: 'Opportunity title',
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Opportunity details',
        },
        accountId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Reference to accounts table',
        },
        primaryContactId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Reference to contacts table',
        },
        ownerUserId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          comment: 'Sales rep owner',
        },
        amount: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          comment: 'Deal amount',
        },
        currency: {
          type: DataTypes.STRING(3),
          defaultValue: 'USD',
          allowNull: false,
          comment: 'Currency code (USD, EUR, etc.)',
        },
        closeDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          comment: 'Expected close date',
        },
        stage: {
          type: DataTypes.ENUM('Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost', 'Closed'),
          defaultValue: 'Prospecting',
          allowNull: false,
          comment: 'Sales pipeline stage',
        },
        probability: {
          type: DataTypes.INTEGER.UNSIGNED,
          defaultValue: 0,
          validate: {
            min: 0,
            max: 100,
          },
          comment: 'Win probability percentage',
        },
        expectedRevenue: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: true,
          comment: 'Expected revenue (amount * probability)',
        },
        priority: {
          type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
          defaultValue: 'Medium',
          allowNull: false,
          comment: 'Opportunity priority',
        },
        type: {
          type: DataTypes.ENUM('New Business', 'Expansion', 'Renewal', 'Upgrade', 'Cross-sell', 'Up-sell'),
          defaultValue: 'New Business',
          allowNull: false,
          comment: 'Opportunity type',
        },
        source: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Opportunity source',
        },
        competitorInfo: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Competitor information',
        },
        nextStepDate: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Date of next step',
        },
        nextStep: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Next action to take',
        },
        lostReason: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Reason for losing deal',
        },
        lostDate: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'When opportunity was lost',
        },
        wonDate: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'When opportunity was won',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
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
      }
    );

    return Opportunity;
  }

  // Helper to check if opportunity is overdue
  public isOverdue(): boolean {
    return new Date() > this.closeDate && this.stage !== 'Won' && this.stage !== 'Lost' && this.stage !== 'Closed';
  }

  // Helper to calculate expected value
  public calculateExpectedValue(): number {
    return (Number(this.amount) * (this.probability || 0)) / 100;
  }

  // Helper to get days until close
  public daysUntilClose(): number {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    return Math.ceil((this.closeDate.getTime() - new Date().getTime()) / millisecondsPerDay);
  }

  // Helper to check if next step is overdue
  public isNextStepOverdue(): boolean {
    if (!this.nextStepDate || this.stage === 'Won' || this.stage === 'Lost' || this.stage === 'Closed') return false;
    return new Date() > this.nextStepDate;
  }
}
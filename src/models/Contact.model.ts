import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface ContactAttributes {
  id: bigint;
  uuid: string;
  contactCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  company?: string;
  position?: string;
  department?: string;
  accountId?: bigint;
  source: 'Direct' | 'Website' | 'Email' | 'Phone' | 'Referral' | 'Event' | 'Social' | 'Other';
  leadScore?: number;
  status: 'Active' | 'Inactive' | 'Lead' | 'Prospect' | 'Converted' | 'Lost';
  ownerUserId?: bigint;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  industry?: string;
  noOfEmployees?: number;
  websiteUrl?: string;
  notes?: string;
  lastContactedDate?: Date;
  nextFollowUpDate?: Date;
  deletedAt?: Date;
}

interface ContactCreationAttributes extends Optional<ContactAttributes, 'id' | 'uuid'> {}

export class Contact extends Model<ContactAttributes, ContactCreationAttributes> implements ContactAttributes {
  public id!: bigint;
  public uuid!: string;
  public contactCode!: string;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public phone!: string;
  public alternatePhone?: string;
  public company?: string;
  public position?: string;
  public department?: string;
  public accountId?: bigint;
  public source!: 'Direct' | 'Website' | 'Email' | 'Phone' | 'Referral' | 'Event' | 'Social' | 'Other';
  public leadScore?: number;
  public status!: 'Active' | 'Inactive' | 'Lead' | 'Prospect' | 'Converted' | 'Lost';
  public ownerUserId?: bigint;
  public address?: string;
  public city?: string;
  public state?: string;
  public country?: string;
  public postalCode?: string;
  public industry?: string;
  public noOfEmployees?: number;
  public websiteUrl?: string;
  public notes?: string;
  public lastContactedDate?: Date;
  public nextFollowUpDate?: Date;
  public deletedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Contact {
    Contact.init(
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
        contactCode: {
          type: DataTypes.STRING(50),
          unique: true,
          allowNull: false,
          comment: 'Unique contact identifier',
        },
        firstName: {
          type: DataTypes.STRING(100),
          allowNull: false,
          comment: 'Contact first name',
        },
        lastName: {
          type: DataTypes.STRING(100),
          allowNull: false,
          comment: 'Contact last name',
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
          validate: { isEmail: true },
          comment: 'Contact email address',
        },
        phone: {
          type: DataTypes.STRING(20),
          allowNull: false,
          comment: 'Primary phone number',
        },
        alternatePhone: {
          type: DataTypes.STRING(20),
          allowNull: true,
          comment: 'Alternate phone number',
        },
        company: {
          type: DataTypes.STRING(200),
          allowNull: true,
          comment: 'Company name',
        },
        position: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Job position',
        },
        department: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Department',
        },
        accountId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Reference to accounts table',
        },
        source: {
          type: DataTypes.ENUM('Direct', 'Website', 'Email', 'Phone', 'Referral', 'Event', 'Social', 'Other'),
          defaultValue: 'Direct',
          allowNull: false,
          comment: 'Contact source',
        },
        leadScore: {
          type: DataTypes.INTEGER.UNSIGNED,
          defaultValue: 0,
          validate: {
            min: 0,
            max: 100,
          },
          comment: 'Lead scoring (0-100)',
        },
        status: {
          type: DataTypes.ENUM('Active', 'Inactive', 'Lead', 'Prospect', 'Converted', 'Lost'),
          defaultValue: 'Lead',
          allowNull: false,
          comment: 'Contact status',
        },
        ownerUserId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
          comment: 'Sales rep owner',
        },
        address: {
          type: DataTypes.STRING(500),
          allowNull: true,
          comment: 'Street address',
        },
        city: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'City',
        },
        state: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'State/Province',
        },
        country: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Country',
        },
        postalCode: {
          type: DataTypes.STRING(20),
          allowNull: true,
          comment: 'Postal/ZIP code',
        },
        industry: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: 'Industry classification',
        },
        noOfEmployees: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          comment: 'Number of employees (for company)',
        },
        websiteUrl: {
          type: DataTypes.STRING(255),
          allowNull: true,
          comment: 'Website URL',
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Internal notes',
        },
        lastContactedDate: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Last contact date',
        },
        nextFollowUpDate: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Next follow-up date',
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Soft delete timestamp',
        },
      },
      {
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
      }
    );

    return Contact;
  }

  // Helper to get full name
  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Helper to check if follow-up is overdue
  public isFollowUpOverdue(): boolean {
    if (!this.nextFollowUpDate) return false;
    return new Date() > this.nextFollowUpDate;
  }

  // Helper to get days since last contact
  public daysSinceLastContact(): number | null {
    if (!this.lastContactedDate) return null;
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    return Math.floor((new Date().getTime() - this.lastContactedDate.getTime()) / millisecondsPerDay);
  }
}
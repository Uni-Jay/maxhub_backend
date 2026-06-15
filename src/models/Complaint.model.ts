import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface ComplaintAttributes {
  id: bigint;
  uuid: string;
  complaintCode: string;
  complaintType: 'Internal' | 'External' | 'Harassment' | 'Discrimination' | 'Safety' | 'Quality' | 'Other';
  raisedBy: bigint;
  againstPerson?: bigint;
  againstDepartment?: bigint;
  subject: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'UnderInvestigation' | 'Resolved' | 'Closed' | 'Escalated';
  raiseDate: Date;
  resolutionDate?: Date;
  resolutionNotes?: string;
  assignedTo?: bigint;
  deletedAt?: Date;
}

interface ComplaintCreationAttributes extends Optional<ComplaintAttributes, 'id' | 'uuid'> {}

export class Complaint extends Model<ComplaintAttributes, ComplaintCreationAttributes>
  implements ComplaintAttributes {
  public id!: bigint;
  public uuid!: string;
  public complaintCode!: string;
  public complaintType!: 'Internal' | 'External' | 'Harassment' | 'Discrimination' | 'Safety' | 'Quality' | 'Other';
  public raisedBy!: bigint;
  public againstPerson?: bigint;
  public againstDepartment?: bigint;
  public subject!: string;
  public description!: string;
  public priority!: 'Low' | 'Medium' | 'High' | 'Critical';
  public status!: 'Open' | 'UnderInvestigation' | 'Resolved' | 'Closed' | 'Escalated';
  public raiseDate!: Date;
  public resolutionDate?: Date;
  public resolutionNotes?: string;
  public assignedTo?: bigint;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Complaint {
    Complaint.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        complaintCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Complaint code' },
        complaintType: { type: DataTypes.ENUM('Internal', 'External', 'Harassment', 'Discrimination', 'Safety', 'Quality', 'Other'), allowNull: false },
        raisedBy: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Raised by user ID' },
        againstPerson: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Against user/staff ID' },
        againstDepartment: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Against department ID' },
        subject: { type: DataTypes.STRING(200), allowNull: false, comment: 'Subject' },
        description: { type: DataTypes.TEXT, allowNull: false, comment: 'Complaint description' },
        priority: { type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'), defaultValue: 'Medium' },
        status: { type: DataTypes.ENUM('Open', 'UnderInvestigation', 'Resolved', 'Closed', 'Escalated'), defaultValue: 'Open' },
        raiseDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, comment: 'Raise date' },
        resolutionDate: { type: DataTypes.DATE, allowNull: true, comment: 'Resolution date' },
        resolutionNotes: { type: DataTypes.TEXT, allowNull: true, comment: 'Resolution notes' },
        assignedTo: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Assigned to user ID' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'complaints', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['complaintCode'], name: 'idx_complaints_complaintCode' },
          { fields: ['complaintType'], name: 'idx_complaints_complaintType' },
          { fields: ['priority'], name: 'idx_complaints_priority' },
          { fields: ['status'], name: 'idx_complaints_status' },
          { fields: ['raisedBy'], name: 'idx_complaints_raisedBy' },
          { fields: ['assignedTo'], name: 'idx_complaints_assignedTo' },
          { fields: ['uuid'], name: 'idx_complaints_uuid' },
        ],
        comment: 'Employee complaints and grievances'
      }
    );
    return Complaint;
  }
}

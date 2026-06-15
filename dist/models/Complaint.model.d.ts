import { Model, Optional, Sequelize } from 'sequelize';
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
interface ComplaintCreationAttributes extends Optional<ComplaintAttributes, 'id' | 'uuid'> {
}
export declare class Complaint extends Model<ComplaintAttributes, ComplaintCreationAttributes> implements ComplaintAttributes {
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
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Complaint;
}
export {};
//# sourceMappingURL=Complaint.model.d.ts.map
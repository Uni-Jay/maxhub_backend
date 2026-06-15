import { Model, Optional, Sequelize } from 'sequelize';
interface AssignmentAttributes {
    id: bigint;
    uuid: string;
    courseId: bigint;
    assignmentCode: string;
    assignmentName: string;
    description?: string;
    points: number;
    dueDate: Date;
    allowLateSubmission: boolean;
    latePenaltyPercentage?: number;
    submissionType: 'File' | 'Text' | 'Link' | 'Quiz';
    maxFileSize?: number;
    allowedFileTypes?: string;
    status: 'Draft' | 'Published' | 'Closed' | 'Archived';
    createdById: bigint;
    deletedAt?: Date;
}
interface AssignmentCreationAttributes extends Optional<AssignmentAttributes, 'id' | 'uuid'> {
}
export declare class Assignment extends Model<AssignmentAttributes, AssignmentCreationAttributes> implements AssignmentAttributes {
    id: bigint;
    uuid: string;
    courseId: bigint;
    assignmentCode: string;
    assignmentName: string;
    description?: string;
    points: number;
    dueDate: Date;
    allowLateSubmission: boolean;
    latePenaltyPercentage?: number;
    submissionType: 'File' | 'Text' | 'Link' | 'Quiz';
    maxFileSize?: number;
    allowedFileTypes?: string;
    status: 'Draft' | 'Published' | 'Closed' | 'Archived';
    createdById: bigint;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Assignment;
}
export {};
//# sourceMappingURL=Assignment.model.d.ts.map
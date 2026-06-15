import { Model, Optional, Sequelize } from 'sequelize';
interface ProjectCommentAttributes {
    id: bigint;
    uuid: string;
    taskId: bigint;
    projectId: bigint;
    staffId: bigint;
    content: string;
    mentionedStaffIds?: string;
    parentCommentId?: bigint;
    isResolved: boolean;
    resolvedBy?: bigint;
    resolvedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
interface ProjectCommentCreationAttributes extends Optional<ProjectCommentAttributes, 'id' | 'uuid'> {
}
export declare class ProjectComment extends Model<ProjectCommentAttributes, ProjectCommentCreationAttributes> implements ProjectCommentAttributes {
    id: bigint;
    uuid: string;
    taskId: bigint;
    projectId: bigint;
    staffId: bigint;
    content: string;
    mentionedStaffIds?: string;
    parentCommentId?: bigint;
    isResolved: boolean;
    resolvedBy?: bigint;
    resolvedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
    static initModel(sequelize: Sequelize): typeof ProjectComment;
}
export {};
//# sourceMappingURL=ProjectComment.model.d.ts.map
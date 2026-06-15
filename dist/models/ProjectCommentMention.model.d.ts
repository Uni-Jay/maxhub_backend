import { Model, Optional, Sequelize } from 'sequelize';
interface ProjectCommentMentionAttributes {
    id: bigint;
    uuid: string;
    commentId: bigint;
    projectId: bigint;
    mentionedStaffId: bigint;
    mentionedBy: bigint;
    mentionedAt: Date;
    notified: boolean;
    notificationDeliveredAt?: Date;
    notificationRead: boolean;
    acknowledgedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
interface ProjectCommentMentionCreationAttributes extends Optional<ProjectCommentMentionAttributes, 'id' | 'uuid'> {
}
export declare class ProjectCommentMention extends Model<ProjectCommentMentionAttributes, ProjectCommentMentionCreationAttributes> implements ProjectCommentMentionAttributes {
    id: bigint;
    uuid: string;
    commentId: bigint;
    projectId: bigint;
    mentionedStaffId: bigint;
    mentionedBy: bigint;
    mentionedAt: Date;
    notified: boolean;
    notificationDeliveredAt?: Date;
    notificationRead: boolean;
    acknowledgedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
    static initModel(sequelize: Sequelize): typeof ProjectCommentMention;
}
export {};
//# sourceMappingURL=ProjectCommentMention.model.d.ts.map
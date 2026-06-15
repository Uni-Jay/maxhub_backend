import { Model, Optional, Sequelize } from 'sequelize';
interface ProjectNoteAttributes {
    id: bigint;
    uuid: string;
    projectId: bigint;
    noteTitle: string;
    noteContent: string;
    noteType: 'General' | 'Technical' | 'Risk' | 'Decision' | 'Change' | 'Issue' | 'Meeting';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    createdById: bigint;
    attachmentUrl?: string;
    isPublic: boolean;
    deletedAt?: Date;
}
interface ProjectNoteCreationAttributes extends Optional<ProjectNoteAttributes, 'id' | 'uuid'> {
}
export declare class ProjectNote extends Model<ProjectNoteAttributes, ProjectNoteCreationAttributes> implements ProjectNoteAttributes {
    id: bigint;
    uuid: string;
    projectId: bigint;
    noteTitle: string;
    noteContent: string;
    noteType: 'General' | 'Technical' | 'Risk' | 'Decision' | 'Change' | 'Issue' | 'Meeting';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    createdById: bigint;
    attachmentUrl?: string;
    isPublic: boolean;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof ProjectNote;
}
export {};
//# sourceMappingURL=ProjectNote.model.d.ts.map
import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

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

interface ProjectNoteCreationAttributes extends Optional<ProjectNoteAttributes, 'id' | 'uuid'> {}

export class ProjectNote extends Model<ProjectNoteAttributes, ProjectNoteCreationAttributes>
  implements ProjectNoteAttributes {
  public id!: bigint;
  public uuid!: string;
  public projectId!: bigint;
  public noteTitle!: string;
  public noteContent!: string;
  public noteType!: 'General' | 'Technical' | 'Risk' | 'Decision' | 'Change' | 'Issue' | 'Meeting';
  public priority!: 'Low' | 'Medium' | 'High' | 'Critical';
  public createdById!: bigint;
  public attachmentUrl?: string;
  public isPublic!: boolean;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof ProjectNote {
    ProjectNote.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        projectId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Project ID' },
        noteTitle: { type: DataTypes.STRING(200), allowNull: false, comment: 'Note title' },
        noteContent: { type: DataTypes.TEXT, allowNull: false, comment: 'Note content' },
        noteType: { type: DataTypes.ENUM('General', 'Technical', 'Risk', 'Decision', 'Change', 'Issue', 'Meeting'), defaultValue: 'General' },
        priority: { type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'), defaultValue: 'Medium' },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
        attachmentUrl: { type: DataTypes.TEXT, allowNull: true, comment: 'Attachment URL/path' },
        isPublic: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Is public' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'project_notes', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['projectId'], name: 'idx_project_notes_projectId' },
          { fields: ['noteType'], name: 'idx_project_notes_noteType' },
          { fields: ['priority'], name: 'idx_project_notes_priority' },
          { fields: ['createdById'], name: 'idx_project_notes_createdById' },
          { fields: ['uuid'], name: 'idx_project_notes_uuid' },
        ],
        comment: 'Project notes and documentation'
      }
    );
    return ProjectNote;
  }
}

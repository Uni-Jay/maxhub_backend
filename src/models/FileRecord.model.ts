import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface FileRecordAttributes {
  id: bigint;
  uuid: string;
  name: string;
  originalName?: string;
  path?: string;
  mimeType?: string;
  size: number;
  folderId?: string;
  isFolder: boolean;
  folderType?: 'Personal' | 'General';
  /** JSON array of canonical role buckets allowed to see this folder (e.g. '["admin","hr","superadmin"]'). Null/undefined = visible to everyone. Only meaningful on isFolder rows; never applies to Personal folders, which use ownership instead. */
  restrictedToRoles?: string;
  icon?: string;
  uploadedById?: bigint;
  uploadedByName?: string;
  deletedAt?: Date;
}

interface FileRecordCreationAttributes extends Optional<FileRecordAttributes, 'id' | 'uuid' | 'size' | 'isFolder'> {}

export class FileRecord
  extends Model<FileRecordAttributes, FileRecordCreationAttributes>
  implements FileRecordAttributes {
  declare id: bigint;
  declare uuid: string;
  declare name: string;
  declare originalName?: string;
  declare path?: string;
  declare mimeType?: string;
  declare size: number;
  declare folderId?: string;
  declare isFolder: boolean;
  declare folderType?: 'Personal' | 'General';
  declare restrictedToRoles?: string;
  declare icon?: string;
  declare uploadedById?: bigint;
  declare uploadedByName?: string;
  declare deletedAt?: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public static initModel(sequelize: Sequelize): typeof FileRecord {
    FileRecord.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true },
        name: { type: DataTypes.STRING(255), allowNull: false },
        originalName: { type: DataTypes.STRING(255), allowNull: true },
        path: { type: DataTypes.TEXT, allowNull: true },
        mimeType: { type: DataTypes.STRING(120), allowNull: true },
        size: { type: DataTypes.BIGINT, defaultValue: 0 },
        folderId: { type: DataTypes.STRING(36), allowNull: true },
        isFolder: { type: DataTypes.BOOLEAN, defaultValue: false },
        folderType: { type: DataTypes.ENUM('Personal', 'General'), allowNull: true },
        restrictedToRoles: { type: DataTypes.TEXT, allowNull: true },
        icon: { type: DataTypes.STRING(10), allowNull: true },
        uploadedById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        uploadedByName: { type: DataTypes.STRING(200), allowNull: true },
        deletedAt: { type: DataTypes.DATE, allowNull: true },
      },
      {
        sequelize,
        tableName: 'file_records',
        paranoid: true,
        timestamps: true,
        underscored: false,
        freezeTableName: true,
      }
    );
    return FileRecord;
  }
}

export default FileRecord;

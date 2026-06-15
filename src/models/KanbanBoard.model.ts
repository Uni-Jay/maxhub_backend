import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface KanbanBoardAttributes {
  id: bigint;
  uuid: string;
  projectId: bigint;
  name: string;
  description?: string;
  boardType: 'Kanban' | 'Sprint' | 'Custom';
  statusColumns: string; // JSON array of column names
  isDefault: boolean;
  displayOrder: number;
  createdBy: bigint;
  archivedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface KanbanBoardCreationAttributes extends Optional<KanbanBoardAttributes, 'id' | 'uuid'> {}

export class KanbanBoard
  extends Model<KanbanBoardAttributes, KanbanBoardCreationAttributes>
  implements KanbanBoardAttributes
{
  public id!: bigint;
  public uuid!: string;
  public projectId!: bigint;
  public name!: string;
  public description?: string;
  public boardType!: 'Kanban' | 'Sprint' | 'Custom';
  public statusColumns!: string;
  public isDefault!: boolean;
  public displayOrder!: number;
  public createdBy!: bigint;
  public archivedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;

  static initModel(sequelize: Sequelize): typeof KanbanBoard {
    KanbanBoard.init(
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },
        uuid: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          defaultValue: uuidv4,
        },
        projectId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: 'project',
            key: 'id',
          },
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        boardType: {
          type: DataTypes.ENUM('Kanban', 'Sprint', 'Custom'),
          allowNull: false,
          defaultValue: 'Kanban',
        },
        statusColumns: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: ['Todo', 'In Progress', 'Review', 'Done'],
        },
        isDefault: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        displayOrder: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        createdBy: {
          type: DataTypes.BIGINT,
          allowNull: false,
          references: {
            model: 'staff',
            key: 'id',
          },
        },
        archivedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'kanban_board',
        tableName: 'kanban_board',
        timestamps: true,
        paranoid: true,
        indexes: [
          {
            fields: ['projectId'],
          },
          {
            fields: ['isDefault'],
          },
        ],
      }
    );
    return KanbanBoard;
  }
}

import { Model, Optional, Sequelize } from 'sequelize';
interface KanbanBoardAttributes {
    id: bigint;
    uuid: string;
    projectId: bigint;
    name: string;
    description?: string;
    boardType: 'Kanban' | 'Sprint' | 'Custom';
    statusColumns: string;
    isDefault: boolean;
    displayOrder: number;
    createdBy: bigint;
    archivedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
interface KanbanBoardCreationAttributes extends Optional<KanbanBoardAttributes, 'id' | 'uuid'> {
}
export declare class KanbanBoard extends Model<KanbanBoardAttributes, KanbanBoardCreationAttributes> implements KanbanBoardAttributes {
    id: bigint;
    uuid: string;
    projectId: bigint;
    name: string;
    description?: string;
    boardType: 'Kanban' | 'Sprint' | 'Custom';
    statusColumns: string;
    isDefault: boolean;
    displayOrder: number;
    createdBy: bigint;
    archivedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
    static initModel(sequelize: Sequelize): typeof KanbanBoard;
}
export {};
//# sourceMappingURL=KanbanBoard.model.d.ts.map
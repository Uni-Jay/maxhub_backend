import { Model, Sequelize, Optional } from 'sequelize';
export interface ClientNoteAttributes {
    id: bigint;
    uuid: string;
    clientId: bigint;
    note: string;
    createdByUserId: bigint;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
interface ClientNoteCreationAttributes extends Optional<ClientNoteAttributes, 'id' | 'uuid' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
export declare class ClientNote extends Model<ClientNoteAttributes, ClientNoteCreationAttributes> implements ClientNoteAttributes {
    id: bigint;
    uuid: string;
    clientId: bigint;
    note: string;
    createdByUserId: bigint;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt: Date;
    static initModel(sequelize: Sequelize): void;
}
export default ClientNote;
//# sourceMappingURL=ClientNote.model.d.ts.map
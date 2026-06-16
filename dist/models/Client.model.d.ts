import { Model, Sequelize, Optional } from 'sequelize';
export interface ClientAttributes {
    id: bigint;
    uuid: string;
    clientId: string;
    fullName: string;
    email: string;
    phone: string;
    alternatePhone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    nationality?: string;
    dateOfBirth?: Date;
    passportUrl?: string;
    avatar?: string;
    departmentId?: bigint;
    assignedStaffId?: bigint;
    registrationDate: Date;
    status: 'Active' | 'Inactive' | 'Pending' | 'Suspended';
    notes?: string;
    createdByUserId: bigint;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
interface ClientCreationAttributes extends Optional<ClientAttributes, 'id' | 'uuid' | 'clientId' | 'alternatePhone' | 'address' | 'city' | 'state' | 'country' | 'nationality' | 'dateOfBirth' | 'passportUrl' | 'avatar' | 'departmentId' | 'assignedStaffId' | 'notes' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
export declare class Client extends Model<ClientAttributes, ClientCreationAttributes> implements ClientAttributes {
    id: bigint;
    uuid: string;
    clientId: string;
    fullName: string;
    email: string;
    phone: string;
    alternatePhone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    nationality?: string;
    dateOfBirth?: Date;
    passportUrl?: string;
    avatar?: string;
    departmentId?: bigint;
    assignedStaffId?: bigint;
    registrationDate: Date;
    status: 'Active' | 'Inactive' | 'Pending' | 'Suspended';
    notes?: string;
    createdByUserId: bigint;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt: Date;
    static initModel(sequelize: Sequelize): void;
}
export default Client;
//# sourceMappingURL=Client.model.d.ts.map
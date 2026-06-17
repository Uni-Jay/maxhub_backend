import { Model, Optional, Sequelize } from 'sequelize';
interface BranchAttributes {
    id: bigint;
    uuid: string;
    branchCode: string;
    branchName: string;
    country?: string;
    state?: string;
    city?: string;
    address?: string;
    phone?: string;
    email?: string;
    managerId?: bigint;
    status: 'Active' | 'Inactive' | 'Closed';
    deletedAt?: Date;
}
interface BranchCreationAttributes extends Optional<BranchAttributes, 'id' | 'uuid'> {
}
export declare class Branch extends Model<BranchAttributes, BranchCreationAttributes> implements BranchAttributes {
    id: bigint;
    uuid: string;
    branchCode: string;
    branchName: string;
    country?: string;
    state?: string;
    city?: string;
    address?: string;
    phone?: string;
    email?: string;
    managerId?: bigint;
    status: 'Active' | 'Inactive' | 'Closed';
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Branch;
}
export {};
//# sourceMappingURL=Branch.model.d.ts.map
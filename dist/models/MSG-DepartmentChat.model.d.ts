import { Model } from 'sequelize';
export interface IDepartmentChat {
    id: bigint;
    organizationId: bigint;
    departmentId: bigint;
    chatName: string;
    description?: string;
    chatImageUrl?: string;
    isActive: boolean;
    createdBy: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class DepartmentChat extends Model<IDepartmentChat> implements IDepartmentChat {
    id: bigint;
    organizationId: bigint;
    departmentId: bigint;
    chatName: string;
    description?: string;
    chatImageUrl?: string;
    isActive: boolean;
    createdBy: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default DepartmentChat;
//# sourceMappingURL=MSG-DepartmentChat.model.d.ts.map
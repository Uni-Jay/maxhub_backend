import { FindAttributeOptions } from 'sequelize';
export declare abstract class BaseRepository<T> {
    protected model: any;
    constructor(model: any);
    findAll(options?: {
        where?: any;
        attributes?: FindAttributeOptions;
        include?: any[];
        order?: any[][];
        limit?: number;
        offset?: number;
        paranoid?: boolean;
    }): Promise<T[]>;
    findPaginated(page?: number, limit?: number, filters?: any, order?: any[][], include?: any[]): Promise<{
        rows: T[];
        count: number;
        total: number;
        pages: number;
    }>;
    findById(id: bigint | number, include?: any[]): Promise<T | null>;
    findByUuid(uuid: string, include?: any[]): Promise<T | null>;
    findOne(where: any, include?: any[]): Promise<T | null>;
    create(data: any): Promise<T>;
    createMany(data: any[]): Promise<T[]>;
    update(data: any, where: any): Promise<[number, T[]]>;
    updateById(id: bigint | number, data: any): Promise<T | null>;
    delete(where: any): Promise<number>;
    deleteById(id: bigint | number): Promise<number>;
    hardDelete(where: any): Promise<number>;
    restore(where: any): Promise<number>;
    count(where?: any): Promise<number>;
    exists(where: any): Promise<boolean>;
    aggregate(attribute: string, fn: string, where?: any): Promise<any>;
    bulkUpdate(updates: Array<{
        where: any;
        data: any;
    }>): Promise<void>;
    raw(query: string, params?: any[]): Promise<any>;
}
export declare class UserRepository extends BaseRepository<any> {
    constructor(userModel: any);
    findByEmail(email: string): Promise<any | null>;
    findActive(include?: any[]): Promise<any[]>;
    findWithPermissions(userId: bigint): Promise<any | null>;
}
//# sourceMappingURL=BaseRepository.d.ts.map
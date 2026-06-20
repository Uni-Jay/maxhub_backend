import { Request } from 'express';
export declare function getUserDepartmentIds(userId: number): Promise<number[]>;
export declare function getMultiDeptScope(req: Request, allPermission: string): Promise<{
    scoped: boolean;
    departmentIds: number[];
}>;
//# sourceMappingURL=departmentScope.d.ts.map
import { Router } from 'express';
export declare const EXPENSE_CATEGORIES: string[];
interface Bucket {
    income: Record<string, number>;
    expenses: Record<string, number>;
}
export declare function monthBuckets(year: number, month: number): Promise<Map<string, Bucket>>;
export declare function profitRouter(): Router;
export {};
//# sourceMappingURL=profit.d.ts.map
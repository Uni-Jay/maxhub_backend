import { Router } from 'express';
export declare const AWAITING = "Awaiting payment";
export declare function purchaseSettings(): Promise<{
    hodLimit: number;
}>;
export declare function budgetFor(brandId: number, year: number, month: number): Promise<{
    amount: number;
    categories: any;
    notes: any;
    setFor: string;
    carried: boolean;
} | null>;
export declare function spendFor(brandId: number, year: number, month: number): Promise<{
    spent: any;
    committed: any;
    pending: number;
    pendingCount: number;
    byCategory: Record<string, {
        spent: number;
        committed: number;
    }>;
}>;
export declare function procurementRouter(): Router;
//# sourceMappingURL=procurement.d.ts.map
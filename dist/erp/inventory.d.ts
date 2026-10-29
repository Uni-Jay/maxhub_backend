import { Router, Request } from 'express';
export declare const BEADMAX_CATEGORIES: {
    'Finished product': string[];
    'Raw material': string[];
};
export declare const MAXFOOD_CATEGORIES: string[];
export declare const SHOP_ORDER_STAGES: string[];
export declare function moveStock(req: Request | null, brand: 'BM' | 'MF', productId: number, change: number, reason: string, reference?: string, note?: string): Promise<number | null>;
export declare function shopTotals(data: any): void;
export declare function inventoryRouter(): Router;
//# sourceMappingURL=inventory.d.ts.map
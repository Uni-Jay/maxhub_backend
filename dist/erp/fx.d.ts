import { Router } from 'express';
export declare const CURRENCIES: string[];
export interface FxState {
    market: Record<string, number>;
    manual: Record<string, number>;
    updatedAt: string | null;
    manualUpdatedAt?: string | null;
    manualBy?: string | null;
    source?: string;
}
export declare function fxState(): Promise<FxState>;
export declare function rateToNgn(currency?: string | null): Promise<number | null>;
export declare function toNgn(amount: any, currency?: string | null): Promise<{
    amountNgn: number | null;
    fxRate: number | null;
}>;
export declare function refreshMarketRates(): Promise<FxState>;
export declare function backfillPaymentNgn(table?: 'erp_payments' | 'erp_expenses'): Promise<number>;
export declare function fxRouter(): Router;
//# sourceMappingURL=fx.d.ts.map
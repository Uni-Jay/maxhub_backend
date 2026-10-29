import { Router } from 'express';
export declare const METRICS: Record<string, {
    label: string;
    money?: boolean;
    brands?: string[];
}>;
export declare function periodRange(t: {
    period: string;
    year: number;
    month?: number | null;
    quarter?: number | null;
}): {
    start: Date;
    end: Date;
    label: string;
};
export declare function measure(t: any): Promise<number>;
export declare function targetsWithProgress(where?: {
    year?: number;
}): Promise<any[]>;
export declare function targetsRouter(): Router;
//# sourceMappingURL=targets.d.ts.map
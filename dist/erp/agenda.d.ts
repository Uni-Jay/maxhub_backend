import { Router } from 'express';
export interface AgendaItem {
    brand: string;
    kind: string;
    title: string;
    detail?: string;
    date: string;
    overdue: boolean;
    url: string;
    ownerUserId?: number | null;
    departmentId?: number | null;
}
export declare function brandAgenda(brand: string, days?: number): Promise<AgendaItem[]>;
export declare function feeBalances(school: 'KS' | 'BM'): Promise<any[]>;
export declare function agendaRouter(): Router;
export declare function runMorningReminders(): Promise<void>;
//# sourceMappingURL=agenda.d.ts.map
import { Router } from 'express';
export declare const STAGES: {
    travelCase: string[];
    booking: string[];
    techProject: string[];
    subscription: string[];
    ticket: string[];
    customOrder: string[];
    exportOrder: string[];
};
export declare function buildChecklist(serviceType?: string, visaType?: string): {
    item: string;
    required: boolean;
    received: boolean;
    fileUrl: null;
    note: string;
}[];
export declare function brandModulesRouter(): Router;
//# sourceMappingURL=brandModules.d.ts.map
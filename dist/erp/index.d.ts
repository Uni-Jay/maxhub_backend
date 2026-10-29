import { Router } from 'express';
export { runErpMigrations } from './migrate';
export { startErpScheduler } from './scheduler';
export declare function mountErpPublic(apiRouter: Router): void;
export declare function mountErpProtected(apiRouter: Router): void;
//# sourceMappingURL=index.d.ts.map
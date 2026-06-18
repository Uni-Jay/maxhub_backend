import type { Request } from 'express';
import type { ChatToolDeclaration } from '../providers/AIProvider.interface';
export declare const ERP_TOOL_DECLARATIONS: ChatToolDeclaration[];
export declare function createToolExecutor(req: Request): (name: string, args: Record<string, unknown>) => Promise<string>;
//# sourceMappingURL=ERPTools.d.ts.map
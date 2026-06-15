import { Model } from 'sequelize';
export interface IStockAlert {
    id: bigint;
    organizationId: bigint;
    inventoryId: bigint;
    alertType: 'Low Stock' | 'Out of Stock' | 'Overstocked' | 'Expired' | 'Damaged';
    currentStock: number;
    threshold: number;
    status: 'Active' | 'Acknowledged' | 'Resolved' | 'Ignored';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    alertDate: Date;
    acknowledgedBy?: bigint;
    acknowledgedDate?: Date;
    resolvedBy?: bigint;
    resolvedDate?: Date;
    action: 'Purchase Order' | 'Stock Transfer' | 'Write Off' | 'Other';
    actionDetails?: string;
    notifiedTo?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class StockAlert extends Model<IStockAlert> implements IStockAlert {
    id: bigint;
    organizationId: bigint;
    inventoryId: bigint;
    alertType: 'Low Stock' | 'Out of Stock' | 'Overstocked' | 'Expired' | 'Damaged';
    currentStock: number;
    threshold: number;
    status: 'Active' | 'Acknowledged' | 'Resolved' | 'Ignored';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    alertDate: Date;
    acknowledgedBy?: bigint;
    acknowledgedDate?: Date;
    resolvedBy?: bigint;
    resolvedDate?: Date;
    action: 'Purchase Order' | 'Stock Transfer' | 'Write Off' | 'Other';
    actionDetails?: string;
    notifiedTo?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default StockAlert;
//# sourceMappingURL=StockAlert.model.d.ts.map
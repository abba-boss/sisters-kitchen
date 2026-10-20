export interface CommissionBreakdown {
    orderTotal: number;
    platformCommission: number;
    vendorEarnings: number;
    commissionRate: number;
}
/**
 * Calculate commission breakdown for an order
 */
export declare function calculateCommission(orderTotal: number): CommissionBreakdown;
/**
 * Update vendor earnings with commission deduction
 * Called when order is delivered
 */
export declare function updateVendorEarnings(vendorId: string, orderTotal: number, orderId: string): Promise<{
    success: boolean;
    breakdown: CommissionBreakdown;
    error?: string;
}>;
/**
 * Get total platform commission earned
 */
export declare function getPlatformCommissionTotal(startDate?: Date, endDate?: Date): Promise<number>;
/**
 * Get vendor's commission breakdown for a period
 */
export declare function getVendorCommissionBreakdown(vendorId: string, startDate?: Date, endDate?: Date): Promise<{
    totalOrders: number;
    grossRevenue: number;
    platformCommission: number;
    netEarnings: number;
}>;
//# sourceMappingURL=commissionService.d.ts.map
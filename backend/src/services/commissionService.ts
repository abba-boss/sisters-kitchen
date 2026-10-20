import { AppDataSource } from '../config/database';
import { Order } from '../entities/Order';
import { Vendor } from '../entities/Vendor';
import { logger } from '../utils/logger';

// Commission configuration
const PLATFORM_COMMISSION_RATE = Number(process.env.PLATFORM_COMMISSION_RATE) || 0.10; // 10% default

export interface CommissionBreakdown {
  orderTotal: number;
  platformCommission: number;
  vendorEarnings: number;
  commissionRate: number;
}

/**
 * Calculate commission breakdown for an order
 */
export function calculateCommission(orderTotal: number): CommissionBreakdown {
  const platformCommission = orderTotal * PLATFORM_COMMISSION_RATE;
  const vendorEarnings = orderTotal - platformCommission;

  return {
    orderTotal,
    platformCommission: Math.round(platformCommission * 100) / 100, // Round to 2 decimals
    vendorEarnings: Math.round(vendorEarnings * 100) / 100,
    commissionRate: PLATFORM_COMMISSION_RATE,
  };
}

/**
 * Update vendor earnings with commission deduction
 * Called when order is delivered
 */
export async function updateVendorEarnings(
  vendorId: string,
  orderTotal: number,
  orderId: string
): Promise<{ success: boolean; breakdown: CommissionBreakdown; error?: string }> {
  try {
    const vendorRepo = AppDataSource.getRepository(Vendor);
    const vendor = await vendorRepo.findOne({ where: { id: vendorId } });

    if (!vendor) {
      return {
        success: false,
        breakdown: calculateCommission(orderTotal),
        error: 'Vendor not found',
      };
    }

    const breakdown = calculateCommission(orderTotal);

    // Update vendor earnings with commission deducted
    vendor.totalEarnings = Number(vendor.totalEarnings) + breakdown.vendorEarnings;
    vendor.totalOrders = (vendor.totalOrders || 0) + 1;

    await vendorRepo.save(vendor);

    logger.info(
      `💰 Commission calculated for order ${orderId}: Vendor gets ₦${breakdown.vendorEarnings}, Platform gets ₦${breakdown.platformCommission}`
    );

    return { success: true, breakdown };
  } catch (error: any) {
    logger.error('Commission calculation error:', error);
    return {
      success: false,
      breakdown: calculateCommission(orderTotal),
      error: error.message,
    };
  }
}

/**
 * Get total platform commission earned
 */
export async function getPlatformCommissionTotal(startDate?: Date, endDate?: Date): Promise<number> {
  try {
    const orderRepo = AppDataSource.getRepository(Order);
    const qb = orderRepo
      .createQueryBuilder('order')
      .where('order.status = :status', { status: 'delivered' });

    if (startDate) {
      qb.andWhere('order.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('order.createdAt <= :endDate', { endDate });
    }

    const orders = await qb.getMany();
    
    let totalCommission = 0;
    for (const order of orders) {
      const { platformCommission } = calculateCommission(Number(order.total));
      totalCommission += platformCommission;
    }

    return Math.round(totalCommission * 100) / 100;
  } catch (error: any) {
    logger.error('Failed to calculate platform commission:', error);
    return 0;
  }
}

/**
 * Get vendor's commission breakdown for a period
 */
export async function getVendorCommissionBreakdown(
  vendorId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalOrders: number;
  grossRevenue: number;
  platformCommission: number;
  netEarnings: number;
}> {
  try {
    const orderRepo = AppDataSource.getRepository(Order);
    const qb = orderRepo
      .createQueryBuilder('order')
      .where('order.vendor = :vendorId', { vendorId })
      .andWhere('order.status = :status', { status: 'delivered' });

    if (startDate) {
      qb.andWhere('order.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('order.createdAt <= :endDate', { endDate });
    }

    const orders = await qb.getMany();

    let grossRevenue = 0;
    let platformCommission = 0;

    for (const order of orders) {
      const total = Number(order.total);
      grossRevenue += total;
      const breakdown = calculateCommission(total);
      platformCommission += breakdown.platformCommission;
    }

    return {
      totalOrders: orders.length,
      grossRevenue: Math.round(grossRevenue * 100) / 100,
      platformCommission: Math.round(platformCommission * 100) / 100,
      netEarnings: Math.round((grossRevenue - platformCommission) * 100) / 100,
    };
  } catch (error: any) {
    logger.error('Failed to calculate vendor commission breakdown:', error);
    return {
      totalOrders: 0,
      grossRevenue: 0,
      platformCommission: 0,
      netEarnings: 0,
    };
  }
}

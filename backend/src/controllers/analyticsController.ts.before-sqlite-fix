import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Order, OrderStatus } from "../entities/Order";
import { Vendor } from "../entities/Vendor";
import { User, UserRole } from "../entities/User";
import { Product } from "../entities/Product";
import { Payment, PaymentStatus } from "../entities/Payment";
import { AuthRequest } from "../middleware/auth";

// ─── Vendor Analytics ───────────────────────────────────────────
export const getVendorAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendorRepo = AppDataSource.getRepository(Vendor);
    const vendor = await vendorRepo.findOne({ where: { user: { id: req.user!.id } } });
    if (!vendor) { res.status(404).json({ success: false, message: "Vendor not found" }); return; }

    const orderRepo = AppDataSource.getRepository(Order);

    // Total stats
    const totalOrders = await orderRepo.count({ where: { vendor: { id: vendor.id } } });
    const deliveredOrders = await orderRepo.count({ where: { vendor: { id: vendor.id }, status: OrderStatus.DELIVERED } });

    // Revenue by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await orderRepo
      .createQueryBuilder("order")
      .select("DATE_FORMAT(order.createdAt, '%Y-%m') as month")
      .addSelect("SUM(order.total) as revenue")
      .addSelect("COUNT(order.id) as orders")
      .where("order.vendorId = :vendorId", { vendorId: vendor.id })
      .andWhere("order.status = :status", { status: OrderStatus.DELIVERED })
      .andWhere("order.createdAt >= :from", { from: sixMonthsAgo })
      .groupBy("month")
      .orderBy("month", "ASC")
      .getRawMany();

    // Daily revenue (last 14 days)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const dailyRevenue = await orderRepo
      .createQueryBuilder("order")
      .select("DATE(order.createdAt) as day")
      .addSelect("SUM(order.total) as revenue")
      .addSelect("COUNT(order.id) as orders")
      .where("order.vendorId = :vendorId", { vendorId: vendor.id })
      .andWhere("order.status = :status", { status: OrderStatus.DELIVERED })
      .andWhere("order.createdAt >= :from", { from: twoWeeksAgo })
      .groupBy("day")
      .orderBy("day", "ASC")
      .getRawMany();

    // Top selling products
    const topProducts = await AppDataSource
      .createQueryBuilder()
      .select("product.id", "productId")
      .addSelect("product.name", "name")
      .addSelect("product.images", "images")
      .addSelect("SUM(order_item.quantity)", "totalSold")
      .addSelect("SUM(order_item.subtotal)", "revenue")
      .from("order_items", "order_item")
      .innerJoin("products", "product", "product.id = order_item.productId")
      .innerJoin("orders", "order", "order.id = order_item.orderId")
      .where("order.vendorId = :vendorId", { vendorId: vendor.id })
      .andWhere("order.status = :status", { status: OrderStatus.DELIVERED })
      .groupBy("product.id")
      .orderBy("totalSold", "DESC")
      .limit(5)
      .getRawMany();

    // Orders by status
    const ordersByStatus = await orderRepo
      .createQueryBuilder("order")
      .select("order.status as status")
      .addSelect("COUNT(order.id) as count")
      .where("order.vendorId = :vendorId", { vendorId: vendor.id })
      .groupBy("order.status")
      .getRawMany();

    res.json({
      success: true,
      data: {
        summary: {
          totalOrders,
          deliveredOrders,
          totalEarnings: vendor.totalEarnings,
          rating: vendor.rating,
          totalReviews: vendor.totalReviews,
          completionRate: totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0,
        },
        monthlyRevenue,
        dailyRevenue,
        topProducts,
        ordersByStatus,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Admin Analytics ────────────────────────────────────────────
export const getAdminAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const vendorRepo = AppDataSource.getRepository(Vendor);
    const orderRepo = AppDataSource.getRepository(Order);
    const productRepo = AppDataSource.getRepository(Product);

    const [totalCustomers, totalVendors, totalProducts, totalOrders] = await Promise.all([
      userRepo.count({ where: { role: UserRole.CUSTOMER } }),
      vendorRepo.count(),
      productRepo.count(),
      orderRepo.count(),
    ]);

    // Total revenue
    const revenueResult = await orderRepo
      .createQueryBuilder("order")
      .select("SUM(order.total)", "total")
      .where("order.status = :status", { status: OrderStatus.DELIVERED })
      .getRawOne();

    // Monthly revenue/orders (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await orderRepo
      .createQueryBuilder("order")
      .select("DATE_FORMAT(order.createdAt, '%Y-%m') as month")
      .addSelect("SUM(order.total) as revenue")
      .addSelect("COUNT(order.id) as orders")
      .where("order.status = :status", { status: OrderStatus.DELIVERED })
      .andWhere("order.createdAt >= :from", { from: sixMonthsAgo })
      .groupBy("month")
      .orderBy("month", "ASC")
      .getRawMany();

    // User registration growth (last 6 months)
    const userGrowth = await userRepo
      .createQueryBuilder("user")
      .select("DATE_FORMAT(user.createdAt, '%Y-%m') as month")
      .addSelect("COUNT(user.id) as newUsers")
      .where("user.createdAt >= :from", { from: sixMonthsAgo })
      .groupBy("month")
      .orderBy("month", "ASC")
      .getRawMany();

    // Top vendors by revenue
    const topVendors = await vendorRepo
      .createQueryBuilder("vendor")
      .select("vendor.id", "vendorId")
      .addSelect("vendor.businessName", "businessName")
      .addSelect("vendor.totalEarnings", "totalEarnings")
      .addSelect("vendor.totalOrders", "totalOrders")
      .addSelect("vendor.rating", "rating")
      .orderBy("vendor.totalEarnings", "DESC")
      .limit(5)
      .getRawMany();

    // Orders by status
    const ordersByStatus = await orderRepo
      .createQueryBuilder("order")
      .select("order.status as status")
      .addSelect("COUNT(order.id) as count")
      .groupBy("order.status")
      .getRawMany();

    // Recent orders
    const recentOrders = await orderRepo.find({
      relations: ["user", "vendor"],
      order: { createdAt: "DESC" },
      take: 10,
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalCustomers,
          totalVendors,
          totalProducts,
          totalOrders,
          totalRevenue: revenueResult?.total || 0,
        },
        monthlyStats,
        userGrowth,
        topVendors,
        ordersByStatus,
        recentOrders,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

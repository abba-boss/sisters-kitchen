"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminAnalytics = exports.getVendorAnalytics = void 0;
const database_1 = require("../config/database");
const Order_1 = require("../entities/Order");
const Vendor_1 = require("../entities/Vendor");
const User_1 = require("../entities/User");
const Product_1 = require("../entities/Product");
// ─── Vendor Analytics ───────────────────────────────────────────
const getVendorAnalytics = async (req, res) => {
    try {
        const vendorRepo = database_1.AppDataSource.getRepository(Vendor_1.Vendor);
        const vendor = await vendorRepo.findOne({ where: { user: { id: req.user.id } } });
        if (!vendor) {
            res.status(404).json({ success: false, message: "Vendor not found" });
            return;
        }
        const orderRepo = database_1.AppDataSource.getRepository(Order_1.Order);
        // Date range filtering
        const { startDate, endDate } = req.query;
        let dateFilter = {};
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // End of day
            dateFilter = { createdAt: database_1.AppDataSource.getRepository(Order_1.Order)
                    .createQueryBuilder()
                    .where("createdAt >= :start", { start })
                    .andWhere("createdAt <= :end", { end })
                    .getQuery()
            };
        }
        // Build base query for filtered orders
        const baseQuery = orderRepo
            .createQueryBuilder("order")
            .where("order.vendorId = :vendorId", { vendorId: vendor.id });
        if (startDate && endDate) {
            baseQuery
                .andWhere("order.createdAt >= :start", { start: new Date(startDate) })
                .andWhere("order.createdAt <= :end", {
                end: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            });
        }
        // Total stats with date filtering
        const totalOrders = await baseQuery.getCount();
        const deliveredQuery = baseQuery.clone()
            .andWhere("order.status = :status", { status: Order_1.OrderStatus.DELIVERED });
        const deliveredOrders = await deliveredQuery.getCount();
        const pendingQuery = baseQuery.clone()
            .andWhere("order.status IN (:...statuses)", {
            statuses: [Order_1.OrderStatus.PENDING, Order_1.OrderStatus.CONFIRMED, Order_1.OrderStatus.PREPARING, Order_1.OrderStatus.READY]
        });
        const pendingOrders = await pendingQuery.getCount();
        const completedOrders = deliveredOrders; // Delivered = Completed
        // Calculate total earnings from filtered orders
        const earningsResult = await baseQuery.clone()
            .select("SUM(order.total)", "total")
            .andWhere("order.status = :status", { status: Order_1.OrderStatus.DELIVERED })
            .getRawOne();
        const filteredEarnings = earningsResult?.total || 0;
        const totalProducts = await database_1.AppDataSource.getRepository(Product_1.Product).count({
            where: { vendor: { id: vendor.id } },
        });
        // Revenue by month (last 6 months or within date range)
        let fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - 6);
        if (startDate) {
            fromDate = new Date(startDate);
        }
        let toDate = new Date();
        if (endDate) {
            toDate = new Date(endDate);
            toDate.setHours(23, 59, 59, 999);
        }
        const monthlyRevenue = await orderRepo
            .createQueryBuilder("order")
            .select("strftime('%Y-%m', order.createdAt) as month")
            .addSelect("SUM(order.total) as revenue")
            .addSelect("COUNT(order.id) as orders")
            .where("order.vendorId = :vendorId", { vendorId: vendor.id })
            .andWhere("order.status = :status", { status: Order_1.OrderStatus.DELIVERED })
            .andWhere("order.createdAt >= :from", { from: fromDate })
            .andWhere("order.createdAt <= :to", { to: toDate })
            .groupBy("month")
            .orderBy("month", "ASC")
            .getRawMany();
        // Daily revenue (last 14 days or within date range)
        let dailyFromDate = new Date();
        dailyFromDate.setDate(dailyFromDate.getDate() - 14);
        if (startDate) {
            dailyFromDate = new Date(startDate);
        }
        const dailyRevenue = await orderRepo
            .createQueryBuilder("order")
            .select("DATE(order.createdAt) as day")
            .addSelect("SUM(order.total) as revenue")
            .addSelect("COUNT(order.id) as orders")
            .where("order.vendorId = :vendorId", { vendorId: vendor.id })
            .andWhere("order.status = :status", { status: Order_1.OrderStatus.DELIVERED })
            .andWhere("order.createdAt >= :from", { from: dailyFromDate })
            .andWhere("order.createdAt <= :to", { to: toDate })
            .groupBy("day")
            .orderBy("day", "ASC")
            .getRawMany();
        // Top selling products (with date filter)
        const topProductsQuery = database_1.AppDataSource
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
            .andWhere("order.status = :status", { status: Order_1.OrderStatus.DELIVERED });
        if (startDate && endDate) {
            topProductsQuery
                .andWhere("order.createdAt >= :start", { start: new Date(startDate) })
                .andWhere("order.createdAt <= :end", { end: toDate });
        }
        const topProducts = await topProductsQuery
            .groupBy("product.id")
            .orderBy("totalSold", "DESC")
            .limit(5)
            .getRawMany();
        // Orders by status (with date filter)
        const ordersByStatusQuery = orderRepo
            .createQueryBuilder("order")
            .select("order.status as status")
            .addSelect("COUNT(order.id) as count")
            .where("order.vendorId = :vendorId", { vendorId: vendor.id });
        if (startDate && endDate) {
            ordersByStatusQuery
                .andWhere("order.createdAt >= :start", { start: new Date(startDate) })
                .andWhere("order.createdAt <= :end", { end: toDate });
        }
        const ordersByStatus = await ordersByStatusQuery
            .groupBy("order.status")
            .getRawMany();
        res.json({
            success: true,
            data: {
                summary: {
                    totalOrders,
                    totalProducts,
                    pendingOrders,
                    completedOrders,
                    totalEarnings: startDate && endDate ? filteredEarnings : vendor.totalEarnings,
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getVendorAnalytics = getVendorAnalytics;
// ─── Admin Analytics ────────────────────────────────────────────
const getAdminAnalytics = async (req, res) => {
    try {
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const vendorRepo = database_1.AppDataSource.getRepository(Vendor_1.Vendor);
        const orderRepo = database_1.AppDataSource.getRepository(Order_1.Order);
        const productRepo = database_1.AppDataSource.getRepository(Product_1.Product);
        const [totalCustomers, totalVendors, totalProducts, totalOrders] = await Promise.all([
            userRepo.count({ where: { role: User_1.UserRole.CUSTOMER } }),
            vendorRepo.count(),
            productRepo.count(),
            orderRepo.count(),
        ]);
        // Total revenue
        const revenueResult = await orderRepo
            .createQueryBuilder("order")
            .select("SUM(order.total)", "total")
            .where("order.status = :status", { status: Order_1.OrderStatus.DELIVERED })
            .getRawOne();
        // Monthly revenue/orders (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const monthlyStats = await orderRepo
            .createQueryBuilder("order")
            .select("strftime('%Y-%m', order.createdAt) as month")
            .addSelect("SUM(order.total) as revenue")
            .addSelect("COUNT(order.id) as orders")
            .where("order.status = :status", { status: Order_1.OrderStatus.DELIVERED })
            .andWhere("order.createdAt >= :from", { from: sixMonthsAgo })
            .groupBy("month")
            .orderBy("month", "ASC")
            .getRawMany();
        // User registration growth (last 6 months)
        const userGrowth = await userRepo
            .createQueryBuilder("user")
            .select("strftime('%Y-%m', user.createdAt) as month")
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAdminAnalytics = getAdminAnalytics;
//# sourceMappingURL=analyticsController.js.map
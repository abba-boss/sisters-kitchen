"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllVendorsAdmin = exports.toggleUserStatus = exports.getAllUsers = exports.getDashboardStats = void 0;
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const Vendor_1 = require("../entities/Vendor");
const Product_1 = require("../entities/Product");
const Order_1 = require("../entities/Order");
const getDashboardStats = async (req, res) => {
    try {
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const vendorRepo = database_1.AppDataSource.getRepository(Vendor_1.Vendor);
        const productRepo = database_1.AppDataSource.getRepository(Product_1.Product);
        const orderRepo = database_1.AppDataSource.getRepository(Order_1.Order);
        const [totalUsers, totalVendors, totalProducts, totalOrders] = await Promise.all([
            userRepo.count({ where: { role: User_1.UserRole.CUSTOMER } }),
            vendorRepo.count(),
            productRepo.count(),
            orderRepo.count(),
        ]);
        const revenueResult = await orderRepo
            .createQueryBuilder("order")
            .select("SUM(order.total)", "total")
            .where("order.status = :status", { status: "delivered" })
            .getRawOne();
        const recentOrders = await orderRepo.find({
            relations: ["user", "vendor"],
            order: { createdAt: "DESC" },
            take: 10,
        });
        res.json({
            success: true,
            data: {
                totalUsers,
                totalVendors,
                totalProducts,
                totalOrders,
                totalRevenue: revenueResult?.total || 0,
                recentOrders,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getDashboardStats = getDashboardStats;
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, role, search } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const qb = userRepo.createQueryBuilder("user");
        if (role)
            qb.where("user.role = :role", { role });
        if (search) {
            qb.andWhere("(user.firstName LIKE :search OR user.email LIKE :search)", {
                search: `%${search}%`,
            });
        }
        const [users, total] = await qb
            .skip(skip)
            .take(Number(limit))
            .orderBy("user.createdAt", "DESC")
            .getManyAndCount();
        const sanitized = users.map(({ password, refreshToken, ...u }) => u);
        res.json({
            success: true,
            data: sanitized,
            meta: { total, page: Number(page), limit: Number(limit) },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllUsers = getAllUsers;
const toggleUserStatus = async (req, res) => {
    try {
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { id: req.params.id } });
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        user.isActive = !user.isActive;
        await userRepo.save(user);
        res.json({
            success: true,
            message: `User ${user.isActive ? "activated" : "deactivated"}`,
            data: { isActive: user.isActive },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.toggleUserStatus = toggleUserStatus;
const getAllVendorsAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const vendorRepo = database_1.AppDataSource.getRepository(Vendor_1.Vendor);
        const qb = vendorRepo
            .createQueryBuilder("vendor")
            .leftJoinAndSelect("vendor.user", "user");
        if (status)
            qb.where("vendor.status = :status", { status });
        const [vendors, total] = await qb
            .skip(skip)
            .take(Number(limit))
            .orderBy("vendor.createdAt", "DESC")
            .getManyAndCount();
        res.json({
            success: true,
            data: vendors,
            meta: { total, page: Number(page), limit: Number(limit) },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllVendorsAdmin = getAllVendorsAdmin;
//# sourceMappingURL=adminController.js.map
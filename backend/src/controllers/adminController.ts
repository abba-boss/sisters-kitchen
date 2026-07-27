import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { User, UserRole } from "../entities/User";
import { Vendor } from "../entities/Vendor";
import { Product } from "../entities/Product";
import { Order } from "../entities/Order";
import { AuthRequest } from "../middleware/auth";

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const vendorRepo = AppDataSource.getRepository(Vendor);
    const productRepo = AppDataSource.getRepository(Product);
    const orderRepo = AppDataSource.getRepository(Order);

    const [totalUsers, totalVendors, totalProducts, totalOrders] = await Promise.all([
      userRepo.count({ where: { role: UserRole.CUSTOMER } }),
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const userRepo = AppDataSource.getRepository(User);
    const qb = userRepo.createQueryBuilder("user");

    if (role) qb.where("user.role = :role", { role });
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: String(req.params.id) } });

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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllVendorsAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const vendorRepo = AppDataSource.getRepository(Vendor);
    const qb = vendorRepo
      .createQueryBuilder("vendor")
      .leftJoinAndSelect("vendor.user", "user");

    if (status) qb.where("vendor.status = :status", { status });

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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

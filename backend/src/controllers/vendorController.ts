import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Vendor, VendorStatus } from "../entities/Vendor";
import { User, UserRole } from "../entities/User";
import { AuthRequest } from "../middleware/auth";
import { uploadToCloudinary } from "../utils/helpers";

export const getAllVendors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 12, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const vendorRepo = AppDataSource.getRepository(Vendor);
    const qb = vendorRepo
      .createQueryBuilder("vendor")
      .leftJoinAndSelect("vendor.user", "user")
      .where("vendor.status = :status", { status: status || VendorStatus.APPROVED });

    if (search) {
      qb.andWhere("vendor.businessName LIKE :search", { search: `%${search}%` });
    }

    const [vendors, total] = await qb
      .skip(skip)
      .take(Number(limit))
      .orderBy("vendor.createdAt", "DESC")
      .getManyAndCount();

    res.json({
      success: true,
      data: vendors,
      meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVendorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const vendorRepo = AppDataSource.getRepository(Vendor);
    const vendor = await vendorRepo.findOne({
      where: { id: req.params.id as string },
      relations: ["user", "products", "products.category"],
    });

    if (!vendor) {
      res.status(404).json({ success: false, message: "Vendor not found" });
      return;
    }

    res.json({ success: true, data: vendor });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyVendorProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendorRepo = AppDataSource.getRepository(Vendor);
    const vendor = await vendorRepo.findOne({
      where: { user: { id: req.user!.id } },
      relations: ["user", "products"],
    });

    if (!vendor) {
      res.status(404).json({ success: false, message: "Vendor profile not found" });
      return;
    }

    res.json({ success: true, data: vendor });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVendorProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendorRepo = AppDataSource.getRepository(Vendor);
    const vendor = await vendorRepo.findOne({
      where: { user: { id: req.user!.id } },
    });

    if (!vendor) {
      res.status(404).json({ success: false, message: "Vendor profile not found" });
      return;
    }

    const {
      businessName, description, address, phone, whatsapp,
      openingTime, closingTime, availableDays, bankName, accountNumber, accountName,
    } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    let logoUrl = vendor.logo;
    let coverUrl = vendor.coverImage;

    if (files?.logo?.[0]) {
      logoUrl = await uploadToCloudinary(files.logo[0].path, "sisters-kitchen/vendors");
    }
    if (files?.coverImage?.[0]) {
      coverUrl = await uploadToCloudinary(files.coverImage[0].path, "sisters-kitchen/vendors");
    }

    Object.assign(vendor, {
      businessName: businessName || vendor.businessName,
      description: description || vendor.description,
      address: address || vendor.address,
      phone: phone || vendor.phone,
      whatsapp: whatsapp || vendor.whatsapp,
      openingTime: openingTime || vendor.openingTime,
      closingTime: closingTime || vendor.closingTime,
      availableDays: availableDays ? JSON.parse(availableDays) : vendor.availableDays,
      bankName: bankName || vendor.bankName,
      accountNumber: accountNumber || vendor.accountNumber,
      accountName: accountName || vendor.accountName,
      logo: logoUrl,
      coverImage: coverUrl,
    });

    await vendorRepo.save(vendor);
    res.json({ success: true, message: "Profile updated", data: vendor });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleVendorStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendorRepo = AppDataSource.getRepository(Vendor);
    const vendor = await vendorRepo.findOne({
      where: { user: { id: req.user!.id } },
    });

    if (!vendor) {
      res.status(404).json({ success: false, message: "Vendor not found" });
      return;
    }

    vendor.isOpen = !vendor.isOpen;
    await vendorRepo.save(vendor);

    res.json({
      success: true,
      message: `Store is now ${vendor.isOpen ? "open" : "closed"}`,
      data: { isOpen: vendor.isOpen },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVendorStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendorRepo = AppDataSource.getRepository(Vendor);
    const vendor = await vendorRepo.findOne({
      where: { user: { id: req.user!.id } },
      relations: ["products", "orders"],
    });

    if (!vendor) {
      res.status(404).json({ success: false, message: "Vendor not found" });
      return;
    }

    res.json({
      success: true,
      data: {
        totalProducts: vendor.products?.length || 0,
        totalOrders: vendor.totalOrders,
        totalEarnings: vendor.totalEarnings,
        rating: vendor.rating,
        totalReviews: vendor.totalReviews,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: approve/suspend vendor
export const updateVendorApproval = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const vendorRepo = AppDataSource.getRepository(Vendor);
    const vendor = await vendorRepo.findOne({ where: { id: req.params.id as string } });

    if (!vendor) {
      res.status(404).json({ success: false, message: "Vendor not found" });
      return;
    }

    vendor.status = status;
    await vendorRepo.save(vendor);

    res.json({ success: true, message: `Vendor ${status}`, data: vendor });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVendorApproval = exports.getVendorStats = exports.toggleVendorStatus = exports.updateVendorProfile = exports.getMyVendorProfile = exports.getVendorById = exports.getAllVendors = void 0;
const database_1 = require("../config/database");
const Vendor_1 = require("../entities/Vendor");
const helpers_1 = require("../utils/helpers");
const getAllVendors = async (req, res) => {
    try {
        const { page = 1, limit = 12, search, status } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const vendorRepo = database_1.AppDataSource.getRepository(Vendor_1.Vendor);
        const qb = vendorRepo
            .createQueryBuilder("vendor")
            .leftJoinAndSelect("vendor.user", "user")
            .where("vendor.status = :status", { status: status || Vendor_1.VendorStatus.APPROVED });
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllVendors = getAllVendors;
const getVendorById = async (req, res) => {
    try {
        const vendorRepo = database_1.AppDataSource.getRepository(Vendor_1.Vendor);
        const vendor = await vendorRepo.findOne({
            where: { id: req.params.id },
            relations: ["user", "products", "products.category"],
        });
        if (!vendor) {
            res.status(404).json({ success: false, message: "Vendor not found" });
            return;
        }
        res.json({ success: true, data: vendor });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getVendorById = getVendorById;
const getMyVendorProfile = async (req, res) => {
    try {
        const vendorRepo = database_1.AppDataSource.getRepository(Vendor_1.Vendor);
        const vendor = await vendorRepo.findOne({
            where: { user: { id: req.user.id } },
            relations: ["user", "products"],
        });
        if (!vendor) {
            res.status(404).json({ success: false, message: "Vendor profile not found" });
            return;
        }
        res.json({ success: true, data: vendor });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMyVendorProfile = getMyVendorProfile;
const updateVendorProfile = async (req, res) => {
    try {
        const vendorRepo = database_1.AppDataSource.getRepository(Vendor_1.Vendor);
        const vendor = await vendorRepo.findOne({
            where: { user: { id: req.user.id } },
        });
        if (!vendor) {
            res.status(404).json({ success: false, message: "Vendor profile not found" });
            return;
        }
        const { businessName, description, address, phone, whatsapp, openingTime, closingTime, availableDays, bankName, accountNumber, accountName, } = req.body;
        const files = req.files;
        let logoUrl = vendor.logo;
        let coverUrl = vendor.coverImage;
        if (files?.logo?.[0]) {
            logoUrl = await (0, helpers_1.uploadToCloudinary)(files.logo[0].path, "sisters-kitchen/vendors");
        }
        if (files?.coverImage?.[0]) {
            coverUrl = await (0, helpers_1.uploadToCloudinary)(files.coverImage[0].path, "sisters-kitchen/vendors");
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateVendorProfile = updateVendorProfile;
const toggleVendorStatus = async (req, res) => {
    try {
        const vendorRepo = database_1.AppDataSource.getRepository(Vendor_1.Vendor);
        const vendor = await vendorRepo.findOne({
            where: { user: { id: req.user.id } },
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.toggleVendorStatus = toggleVendorStatus;
const getVendorStats = async (req, res) => {
    try {
        const vendorRepo = database_1.AppDataSource.getRepository(Vendor_1.Vendor);
        const vendor = await vendorRepo.findOne({
            where: { user: { id: req.user.id } },
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getVendorStats = getVendorStats;
// Admin: approve/suspend vendor
const updateVendorApproval = async (req, res) => {
    try {
        const { status } = req.body;
        const vendorRepo = database_1.AppDataSource.getRepository(Vendor_1.Vendor);
        const vendor = await vendorRepo.findOne({ where: { id: req.params.id } });
        if (!vendor) {
            res.status(404).json({ success: false, message: "Vendor not found" });
            return;
        }
        vendor.status = status;
        await vendorRepo.save(vendor);
        res.json({ success: true, message: `Vendor ${status}`, data: vendor });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateVendorApproval = updateVendorApproval;
//# sourceMappingURL=vendorController.js.map
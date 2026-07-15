"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getVendorProducts = exports.getFreshTodayProducts = exports.getFeaturedProducts = exports.getProductById = exports.getAllProducts = void 0;
const database_1 = require("../config/database");
const Product_1 = require("../entities/Product");
const Vendor_1 = require("../entities/Vendor");
const Category_1 = require("../entities/Category");
const helpers_1 = require("../utils/helpers");
// ─── List / Search ─────────────────────────────────────────────
const getAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 12, search, category, vendorId, minPrice, maxPrice, sort } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const qb = database_1.AppDataSource.getRepository(Product_1.Product)
            .createQueryBuilder("product")
            .leftJoinAndSelect("product.vendor", "vendor")
            .leftJoinAndSelect("product.category", "category")
            .where("product.isAvailable = :yes", { yes: true })
            .andWhere("vendor.status = :approved", { approved: "approved" });
        if (search)
            qb.andWhere("(product.name LIKE :s OR product.description LIKE :s)", { s: `%${search}%` });
        if (category)
            qb.andWhere("category.id = :cat", { cat: category });
        if (vendorId)
            qb.andWhere("vendor.id = :vid", { vid: vendorId });
        if (minPrice)
            qb.andWhere("product.price >= :min", { min: Number(minPrice) });
        if (maxPrice)
            qb.andWhere("product.price <= :max", { max: Number(maxPrice) });
        const orderMap = {
            price_asc: { "product.price": "ASC" },
            price_desc: { "product.price": "DESC" },
            rating: { "product.rating": "DESC" },
            popular: { "product.totalOrders": "DESC" },
        };
        const orderBy = orderMap[sort] || { "product.createdAt": "DESC" };
        Object.entries(orderBy).forEach(([col, dir]) => qb.addOrderBy(col, dir));
        const [products, total] = await qb.skip(skip).take(Number(limit)).getManyAndCount();
        res.json({ success: true, data: products, meta: { total, page: +page, limit: +limit, pages: Math.ceil(total / +limit) } });
    }
    catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};
exports.getAllProducts = getAllProducts;
const getProductById = async (req, res) => {
    try {
        const product = await database_1.AppDataSource.getRepository(Product_1.Product).findOne({
            where: { id: req.params.id },
            relations: ["vendor", "category", "reviews", "reviews.user"],
        });
        if (!product) {
            res.status(404).json({ success: false, message: "Product not found" });
            return;
        }
        res.json({ success: true, data: product });
    }
    catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};
exports.getProductById = getProductById;
const getFeaturedProducts = async (req, res) => {
    try {
        const products = await database_1.AppDataSource.getRepository(Product_1.Product).find({
            where: { isFeatured: true, isAvailable: true },
            relations: ["vendor", "category"],
            take: 8,
            order: { createdAt: "DESC" },
        });
        res.json({ success: true, data: products });
    }
    catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};
exports.getFeaturedProducts = getFeaturedProducts;
const getFreshTodayProducts = async (req, res) => {
    try {
        const products = await database_1.AppDataSource.getRepository(Product_1.Product).find({
            where: { isFreshToday: true, isAvailable: true },
            relations: ["vendor", "category"],
            take: 8,
            order: { updatedAt: "DESC" },
        });
        res.json({ success: true, data: products });
    }
    catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};
exports.getFreshTodayProducts = getFreshTodayProducts;
// ─── Vendor: my products ────────────────────────────────────────
const getVendorProducts = async (req, res) => {
    try {
        const vendor = await database_1.AppDataSource.getRepository(Vendor_1.Vendor).findOne({ where: { user: { id: req.user.id } } });
        if (!vendor) {
            res.status(404).json({ success: false, message: "Vendor not found" });
            return;
        }
        const products = await database_1.AppDataSource.getRepository(Product_1.Product).find({
            where: { vendor: { id: vendor.id } },
            relations: ["category"],
            order: { createdAt: "DESC" },
        });
        res.json({ success: true, data: products });
    }
    catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};
exports.getVendorProducts = getVendorProducts;
// ─── Helper: collect images from request ───────────────────────
/**
 * Priority:
 * 1. existingImageUrls (already uploaded to Cloudinary by frontend)
 * 2. Files in req.files (backend will upload them to Cloudinary / local)
 */
async function collectImages(req, existingUrls = []) {
    const urls = [...existingUrls];
    const files = req.files;
    if (files && files.length > 0) {
        for (const file of files) {
            try {
                const url = await (0, helpers_1.uploadToCloudinary)(file.path, "sisters-kitchen/products");
                urls.push(url);
            }
            catch (err) {
                console.error("Image upload failed for file:", file.originalname, err);
                // push local fallback path
                urls.push(`/uploads/${file.filename}`);
            }
        }
    }
    // Remove duplicates, keep max 5
    return [...new Set(urls)].slice(0, 5);
}
// ─── Create ─────────────────────────────────────────────────────
const createProduct = async (req, res) => {
    try {
        const vendor = await database_1.AppDataSource.getRepository(Vendor_1.Vendor).findOne({ where: { user: { id: req.user.id } } });
        if (!vendor) {
            res.status(404).json({ success: false, message: "Vendor profile not found" });
            return;
        }
        const { name, description, price, discountPrice, categoryId, isAvailable, isFeatured, isFreshToday, stock, preparationTime, tags, existingImageUrls, } = req.body;
        // Existing URLs pre-uploaded by browser
        let preUploaded = [];
        try {
            preUploaded = JSON.parse(existingImageUrls || "[]");
        }
        catch { }
        const imageUrls = await collectImages(req, preUploaded);
        const category = categoryId
            ? await database_1.AppDataSource.getRepository(Category_1.Category).findOne({ where: { id: categoryId } })
            : null;
        const product = database_1.AppDataSource.getRepository(Product_1.Product).create({
            name, description,
            price: Number(price),
            discountPrice: discountPrice ? Number(discountPrice) : undefined,
            images: imageUrls,
            isAvailable: isAvailable !== undefined ? isAvailable === "true" : true,
            isFeatured: isFeatured === "true",
            isFreshToday: isFreshToday === "true",
            stock: Number(stock) || 0,
            preparationTime,
            tags: (() => { try {
                return JSON.parse(tags || "[]");
            }
            catch {
                return [];
            } })(),
            vendor,
            category: category || undefined,
        });
        await database_1.AppDataSource.getRepository(Product_1.Product).save(product);
        res.status(201).json({ success: true, message: "Product created", data: product });
    }
    catch (e) {
        console.error("createProduct error:", e);
        res.status(500).json({ success: false, message: e.message });
    }
};
exports.createProduct = createProduct;
// ─── Update ─────────────────────────────────────────────────────
const updateProduct = async (req, res) => {
    try {
        const productRepo = database_1.AppDataSource.getRepository(Product_1.Product);
        const product = await productRepo.findOne({
            where: { id: req.params.id },
            relations: ["vendor", "vendor.user"],
        });
        if (!product) {
            res.status(404).json({ success: false, message: "Product not found" });
            return;
        }
        // Only the owning vendor or admin can update
        if (product.vendor.user.id !== req.user.id && req.user.role !== "admin") {
            res.status(403).json({ success: false, message: "Not authorized" });
            return;
        }
        const { name, description, price, discountPrice, categoryId, isAvailable, isFeatured, isFreshToday, stock, preparationTime, tags, existingImageUrls, } = req.body;
        // Start with pre-uploaded URLs
        let preUploaded = [];
        try {
            preUploaded = JSON.parse(existingImageUrls || "[]");
        }
        catch { }
        // Upload any new files that weren't already handled by the browser
        const imageUrls = await collectImages(req, preUploaded);
        // If no images at all, keep existing ones
        const finalImages = imageUrls.length > 0 ? imageUrls : product.images;
        if (categoryId) {
            const cat = await database_1.AppDataSource.getRepository(Category_1.Category).findOne({ where: { id: categoryId } });
            if (cat)
                product.category = cat;
        }
        Object.assign(product, {
            name: name || product.name,
            description: description || product.description,
            price: price ? Number(price) : product.price,
            discountPrice: discountPrice ? Number(discountPrice) : product.discountPrice,
            images: finalImages,
            isAvailable: isAvailable !== undefined ? isAvailable === "true" : product.isAvailable,
            isFeatured: isFeatured !== undefined ? isFeatured === "true" : product.isFeatured,
            isFreshToday: isFreshToday !== undefined ? isFreshToday === "true" : product.isFreshToday,
            stock: stock ? Number(stock) : product.stock,
            preparationTime: preparationTime ?? product.preparationTime,
            tags: (() => { try {
                return tags ? JSON.parse(tags) : product.tags;
            }
            catch {
                return product.tags;
            } })(),
        });
        await productRepo.save(product);
        res.json({ success: true, message: "Product updated", data: product });
    }
    catch (e) {
        console.error("updateProduct error:", e);
        res.status(500).json({ success: false, message: e.message });
    }
};
exports.updateProduct = updateProduct;
// ─── Delete ─────────────────────────────────────────────────────
const deleteProduct = async (req, res) => {
    try {
        const productRepo = database_1.AppDataSource.getRepository(Product_1.Product);
        const product = await productRepo.findOne({
            where: { id: req.params.id },
            relations: ["vendor", "vendor.user"],
        });
        if (!product) {
            res.status(404).json({ success: false, message: "Product not found" });
            return;
        }
        if (product.vendor.user.id !== req.user.id && req.user.role !== "admin") {
            res.status(403).json({ success: false, message: "Not authorized" });
            return;
        }
        await productRepo.remove(product);
        res.json({ success: true, message: "Product deleted" });
    }
    catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};
exports.deleteProduct = deleteProduct;
//# sourceMappingURL=productController.js.map
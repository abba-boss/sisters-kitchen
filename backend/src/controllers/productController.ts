import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Product } from "../entities/Product";
import { Vendor } from "../entities/Vendor";
import { Category } from "../entities/Category";
import { AuthRequest } from "../middleware/auth";
import { uploadToCloudinary } from "../utils/helpers";

// ─── List / Search ─────────────────────────────────────────────
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 12, search, category, vendorId, minPrice, maxPrice, sort } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const qb = AppDataSource.getRepository(Product)
      .createQueryBuilder("product")
      .leftJoinAndSelect("product.vendor", "vendor")
      .leftJoinAndSelect("product.category", "category")
      .where("product.isAvailable = :yes", { yes: true })
      .andWhere("vendor.status = :approved", { approved: "approved" });

    if (search)   qb.andWhere("(product.name LIKE :s OR product.description LIKE :s)", { s: `%${search}%` });
    if (category) qb.andWhere("category.id = :cat", { cat: category });
    if (vendorId) qb.andWhere("vendor.id = :vid", { vid: vendorId });
    if (minPrice) qb.andWhere("product.price >= :min", { min: Number(minPrice) });
    if (maxPrice) qb.andWhere("product.price <= :max", { max: Number(maxPrice) });

    const orderMap: Record<string, any> = {
      price_asc:  { "product.price": "ASC"  },
      price_desc: { "product.price": "DESC" },
      rating:     { "product.rating": "DESC" },
      popular:    { "product.totalOrders": "DESC" },
    };
    const orderBy = orderMap[sort as string] || { "product.createdAt": "DESC" };
    Object.entries(orderBy).forEach(([col, dir]) => qb.addOrderBy(col, dir as any));

    const [products, total] = await qb.skip(skip).take(Number(limit)).getManyAndCount();
    res.json({ success: true, data: products, meta: { total, page: +page, limit: +limit, pages: Math.ceil(total / +limit) } });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await AppDataSource.getRepository(Product).findOne({
      where: { id: req.params.id as string },
      relations: ["vendor", "category", "reviews", "reviews.user"],
    });
    if (!product) { res.status(404).json({ success: false, message: "Product not found" }); return; }
    res.json({ success: true, data: product });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getFeaturedProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await AppDataSource.getRepository(Product).find({
      where: { isFeatured: true, isAvailable: true },
      relations: ["vendor", "category"],
      take: 8,
      order: { createdAt: "DESC" },
    });
    res.json({ success: true, data: products });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getFreshTodayProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await AppDataSource.getRepository(Product).find({
      where: { isFreshToday: true, isAvailable: true },
      relations: ["vendor", "category"],
      take: 8,
      order: { updatedAt: "DESC" },
    });
    res.json({ success: true, data: products });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// ─── Vendor: my products ────────────────────────────────────────
export const getVendorProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await AppDataSource.getRepository(Vendor).findOne({ where: { user: { id: req.user!.id } } });
    if (!vendor) { res.status(404).json({ success: false, message: "Vendor not found" }); return; }

    const products = await AppDataSource.getRepository(Product).find({
      where: { vendor: { id: vendor.id } },
      relations: ["category"],
      order: { createdAt: "DESC" },
    });
    res.json({ success: true, data: products });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// ─── Helper: collect images from request ───────────────────────
/**
 * Priority:
 * 1. existingImageUrls (already uploaded to Cloudinary by frontend)
 * 2. Files in req.files (backend will upload them to Cloudinary / local)
 */
async function collectImages(req: AuthRequest, existingUrls: string[] = []): Promise<string[]> {
  const urls = [...existingUrls];

  const files = req.files as Express.Multer.File[] | undefined;
  if (files && files.length > 0) {
    for (const file of files) {
      try {
        const url = await uploadToCloudinary(file.path, "sisters-kitchen/products");
        urls.push(url);
      } catch (err) {
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
export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await AppDataSource.getRepository(Vendor).findOne({ where: { user: { id: req.user!.id } } });
    if (!vendor) { res.status(404).json({ success: false, message: "Vendor profile not found" }); return; }

    const {
      name, description, price, discountPrice, categoryId,
      isAvailable, isFeatured, isFreshToday, stock, preparationTime, tags,
      existingImageUrls,
    } = req.body;

    // Existing URLs pre-uploaded by browser
    let preUploaded: string[] = [];
    try { preUploaded = JSON.parse(existingImageUrls || "[]"); } catch {}

    const imageUrls = await collectImages(req, preUploaded);

    const category = categoryId
      ? await AppDataSource.getRepository(Category).findOne({ where: { id: categoryId } })
      : null;

    const product = AppDataSource.getRepository(Product).create({
      name, description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      images: imageUrls,
      isAvailable:  isAvailable  !== undefined ? isAvailable  === "true" : true,
      isFeatured:   isFeatured   === "true",
      isFreshToday: isFreshToday === "true",
      stock:        Number(stock) || 0,
      preparationTime,
      tags: (() => { try { return JSON.parse(tags || "[]"); } catch { return []; } })(),
      vendor,
      category: category || undefined,
    });

    await AppDataSource.getRepository(Product).save(product);
    res.status(201).json({ success: true, message: "Product created", data: product });
  } catch (e: any) {
    console.error("createProduct error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// ─── Update ─────────────────────────────────────────────────────
export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    const product = await productRepo.findOne({
      where: { id: req.params.id as string },
      relations: ["vendor", "vendor.user"],
    });
    if (!product) { res.status(404).json({ success: false, message: "Product not found" }); return; }

    // Only the owning vendor or admin can update
    if (product.vendor.user.id !== req.user!.id && req.user!.role !== "admin") {
      res.status(403).json({ success: false, message: "Not authorized" }); return;
    }

    const {
      name, description, price, discountPrice, categoryId,
      isAvailable, isFeatured, isFreshToday, stock, preparationTime, tags,
      existingImageUrls,
    } = req.body;

    // Start with pre-uploaded URLs
    let preUploaded: string[] = [];
    try { preUploaded = JSON.parse(existingImageUrls || "[]"); } catch {}

    // Upload any new files that weren't already handled by the browser
    const imageUrls = await collectImages(req, preUploaded);
    // If no images at all, keep existing ones
    const finalImages = imageUrls.length > 0 ? imageUrls : product.images;

    if (categoryId) {
      const cat = await AppDataSource.getRepository(Category).findOne({ where: { id: categoryId } });
      if (cat) product.category = cat;
    }

    Object.assign(product, {
      name:           name          || product.name,
      description:    description   || product.description,
      price:          price         ? Number(price)         : product.price,
      discountPrice:  discountPrice ? Number(discountPrice) : product.discountPrice,
      images:         finalImages,
      isAvailable:    isAvailable  !== undefined ? isAvailable  === "true" : product.isAvailable,
      isFeatured:     isFeatured   !== undefined ? isFeatured   === "true" : product.isFeatured,
      isFreshToday:   isFreshToday !== undefined ? isFreshToday === "true" : product.isFreshToday,
      stock:          stock         ? Number(stock) : product.stock,
      preparationTime: preparationTime ?? product.preparationTime,
      tags:           (() => { try { return tags ? JSON.parse(tags) : product.tags; } catch { return product.tags; } })(),
    });

    await productRepo.save(product);
    res.json({ success: true, message: "Product updated", data: product });
  } catch (e: any) {
    console.error("updateProduct error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// ─── Delete ─────────────────────────────────────────────────────
export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    const product = await productRepo.findOne({
      where: { id: req.params.id as string },
      relations: ["vendor", "vendor.user"],
    });
    if (!product) { res.status(404).json({ success: false, message: "Product not found" }); return; }

    if (product.vendor.user.id !== req.user!.id && req.user!.role !== "admin") {
      res.status(403).json({ success: false, message: "Not authorized" }); return;
    }

    await productRepo.remove(product);
    res.json({ success: true, message: "Product deleted" });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

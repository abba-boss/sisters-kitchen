import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Product } from "../entities/Product";
import { Vendor } from "../entities/Vendor";
import { Category } from "../entities/Category";
import { AuthRequest } from "../middleware/auth";
import { uploadToCloudinary } from "../utils/helpers";

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 12, search, category, vendorId, minPrice, maxPrice, sort } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const productRepo = AppDataSource.getRepository(Product);
    const qb = productRepo
      .createQueryBuilder("product")
      .leftJoinAndSelect("product.vendor", "vendor")
      .leftJoinAndSelect("product.category", "category")
      .where("product.isAvailable = :isAvailable", { isAvailable: true })
      .andWhere("vendor.status = :vendorStatus", { vendorStatus: "approved" });

    if (search) {
      qb.andWhere("(product.name LIKE :search OR product.description LIKE :search)", {
        search: `%${search}%`,
      });
    }
    if (category) {
      qb.andWhere("category.id = :category", { category });
    }
    if (vendorId) {
      qb.andWhere("vendor.id = :vendorId", { vendorId });
    }
    if (minPrice) {
      qb.andWhere("product.price >= :minPrice", { minPrice: Number(minPrice) });
    }
    if (maxPrice) {
      qb.andWhere("product.price <= :maxPrice", { maxPrice: Number(maxPrice) });
    }

    if (sort === "price_asc") qb.orderBy("product.price", "ASC");
    else if (sort === "price_desc") qb.orderBy("product.price", "DESC");
    else if (sort === "rating") qb.orderBy("product.rating", "DESC");
    else if (sort === "popular") qb.orderBy("product.totalOrders", "DESC");
    else qb.orderBy("product.createdAt", "DESC");

    const [products, total] = await qb.skip(skip).take(Number(limit)).getManyAndCount();

    res.json({
      success: true,
      data: products,
      meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    const product = await productRepo.findOne({
      where: { id: req.params.id as string },
      relations: ["vendor", "category", "reviews", "reviews.user"],
    });

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeaturedProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    const products = await productRepo.find({
      where: { isFeatured: true, isAvailable: true },
      relations: ["vendor", "category"],
      take: 8,
      order: { createdAt: "DESC" },
    });
    res.json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFreshTodayProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    const products = await productRepo.find({
      where: { isFreshToday: true, isAvailable: true },
      relations: ["vendor", "category"],
      take: 8,
    });
    res.json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendorRepo = AppDataSource.getRepository(Vendor);
    const vendor = await vendorRepo.findOne({ where: { user: { id: req.user!.id } } });

    if (!vendor) {
      res.status(404).json({ success: false, message: "Vendor profile not found" });
      return;
    }

    const {
      name, description, price, discountPrice, categoryId,
      isAvailable, isFeatured, isFreshToday, stock, preparationTime, tags,
    } = req.body;

    const categoryRepo = AppDataSource.getRepository(Category);
    const category = await categoryRepo.findOne({ where: { id: categoryId } });

    const files = req.files as Express.Multer.File[];
    const imageUrls: string[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const url = await uploadToCloudinary(file.path, "sisters-kitchen/products");
        imageUrls.push(url);
      }
    }

    const productRepo = AppDataSource.getRepository(Product);
    const product = productRepo.create({
      name,
      description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      images: imageUrls,
      isAvailable: isAvailable !== undefined ? isAvailable === "true" : true,
      isFeatured: isFeatured === "true",
      isFreshToday: isFreshToday === "true",
      stock: Number(stock) || 0,
      preparationTime,
      tags: tags ? JSON.parse(tags) : [],
      vendor,
      category: category || undefined,
    });

    await productRepo.save(product);
    res.status(201).json({ success: true, message: "Product created", data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    const product = await productRepo.findOne({
      where: { id: req.params.id as string },
      relations: ["vendor", "vendor.user"],
    });

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    if (product.vendor.user.id !== req.user!.id) {
      res.status(403).json({ success: false, message: "Not authorized" });
      return;
    }

    const files = req.files as Express.Multer.File[];
    let imageUrls = product.images || [];

    if (files && files.length > 0) {
      for (const file of files) {
        const url = await uploadToCloudinary(file.path, "sisters-kitchen/products");
        imageUrls.push(url);
      }
    }

    const {
      name, description, price, discountPrice, categoryId,
      isAvailable, isFeatured, isFreshToday, stock, preparationTime, tags,
    } = req.body;

    if (categoryId) {
      const categoryRepo = AppDataSource.getRepository(Category);
      product.category = await categoryRepo.findOne({ where: { id: categoryId } }) || product.category;
    }

    Object.assign(product, {
      name: name || product.name,
      description: description || product.description,
      price: price ? Number(price) : product.price,
      discountPrice: discountPrice ? Number(discountPrice) : product.discountPrice,
      images: imageUrls,
      isAvailable: isAvailable !== undefined ? isAvailable === "true" : product.isAvailable,
      isFeatured: isFeatured !== undefined ? isFeatured === "true" : product.isFeatured,
      isFreshToday: isFreshToday !== undefined ? isFreshToday === "true" : product.isFreshToday,
      stock: stock ? Number(stock) : product.stock,
      preparationTime: preparationTime || product.preparationTime,
      tags: tags ? JSON.parse(tags) : product.tags,
    });

    await productRepo.save(product);
    res.json({ success: true, message: "Product updated", data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    const product = await productRepo.findOne({
      where: { id: req.params.id as string },
      relations: ["vendor", "vendor.user"],
    });

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    if (product.vendor.user.id !== req.user!.id && req.user!.role !== "admin") {
      res.status(403).json({ success: false, message: "Not authorized" });
      return;
    }

    await productRepo.remove(product);
    res.json({ success: true, message: "Product deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVendorProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendorRepo = AppDataSource.getRepository(Vendor);
    const vendor = await vendorRepo.findOne({ where: { user: { id: req.user!.id } } });

    if (!vendor) {
      res.status(404).json({ success: false, message: "Vendor not found" });
      return;
    }

    const productRepo = AppDataSource.getRepository(Product);
    const products = await productRepo.find({
      where: { vendor: { id: vendor.id } },
      relations: ["category"],
      order: { createdAt: "DESC" },
    });

    res.json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

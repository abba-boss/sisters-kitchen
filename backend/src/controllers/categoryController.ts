import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Category } from "../entities/Category";
import { uploadToCloudinary } from "../utils/helpers";

export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryRepo = AppDataSource.getRepository(Category);
    const categories = await categoryRepo.find({
      where: { isActive: true },
      order: { sortOrder: "ASC" },
    });
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryRepo = AppDataSource.getRepository(Category);
    const category = await categoryRepo.findOne({
      where: { id: req.params.id as string },
      relations: ["products"],
    });
    if (!category) {
      res.status(404).json({ success: false, message: "Category not found" });
      return;
    }
    res.json({ success: true, data: category });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, icon, sortOrder } = req.body;
    const categoryRepo = AppDataSource.getRepository(Category);

    let imageUrl: string | undefined;
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.path, "sisters-kitchen/categories");
    }

    const category = categoryRepo.create({
      name,
      description,
      icon,
      image: imageUrl,
      sortOrder: Number(sortOrder) || 0,
    });

    await categoryRepo.save(category);
    res.status(201).json({ success: true, message: "Category created", data: category });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryRepo = AppDataSource.getRepository(Category);
    const category = await categoryRepo.findOne({ where: { id: req.params.id as string } });

    if (!category) {
      res.status(404).json({ success: false, message: "Category not found" });
      return;
    }

    let imageUrl = category.image;
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.path, "sisters-kitchen/categories");
    }

    Object.assign(category, {
      name: req.body.name ?? category.name,
      description: req.body.description ?? category.description,
      icon: req.body.icon ?? category.icon,
      sortOrder: req.body.sortOrder !== undefined ? Number(req.body.sortOrder) : category.sortOrder,
      isActive: req.body.isActive !== undefined ? req.body.isActive === "true" || req.body.isActive === true : category.isActive,
      image: imageUrl,
    });
    await categoryRepo.save(category);
    res.json({ success: true, message: "Category updated", data: category });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryRepo = AppDataSource.getRepository(Category);
    const category = await categoryRepo.findOne({ where: { id: req.params.id as string } });

    if (!category) {
      res.status(404).json({ success: false, message: "Category not found" });
      return;
    }

    await categoryRepo.remove(category);
    res.json({ success: true, message: "Category deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

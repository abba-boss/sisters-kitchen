"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategoryById = exports.getAllCategories = void 0;
const database_1 = require("../config/database");
const Category_1 = require("../entities/Category");
const helpers_1 = require("../utils/helpers");
const getAllCategories = async (req, res) => {
    try {
        const categoryRepo = database_1.AppDataSource.getRepository(Category_1.Category);
        const categories = await categoryRepo.find({
            where: { isActive: true },
            order: { sortOrder: "ASC" },
        });
        res.json({ success: true, data: categories });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllCategories = getAllCategories;
const getCategoryById = async (req, res) => {
    try {
        const categoryRepo = database_1.AppDataSource.getRepository(Category_1.Category);
        const category = await categoryRepo.findOne({
            where: { id: req.params.id },
            relations: ["products"],
        });
        if (!category) {
            res.status(404).json({ success: false, message: "Category not found" });
            return;
        }
        res.json({ success: true, data: category });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCategoryById = getCategoryById;
const createCategory = async (req, res) => {
    try {
        const { name, description, icon, sortOrder } = req.body;
        const categoryRepo = database_1.AppDataSource.getRepository(Category_1.Category);
        let imageUrl;
        if (req.file) {
            imageUrl = await (0, helpers_1.uploadToCloudinary)(req.file.path, "sisters-kitchen/categories");
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res) => {
    try {
        const categoryRepo = database_1.AppDataSource.getRepository(Category_1.Category);
        const category = await categoryRepo.findOne({ where: { id: req.params.id } });
        if (!category) {
            res.status(404).json({ success: false, message: "Category not found" });
            return;
        }
        let imageUrl = category.image;
        if (req.file) {
            imageUrl = await (0, helpers_1.uploadToCloudinary)(req.file.path, "sisters-kitchen/categories");
        }
        Object.assign(category, { ...req.body, image: imageUrl });
        await categoryRepo.save(category);
        res.json({ success: true, message: "Category updated", data: category });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    try {
        const categoryRepo = database_1.AppDataSource.getRepository(Category_1.Category);
        const category = await categoryRepo.findOne({ where: { id: req.params.id } });
        if (!category) {
            res.status(404).json({ success: false, message: "Category not found" });
            return;
        }
        await categoryRepo.remove(category);
        res.json({ success: true, message: "Category deleted" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=categoryController.js.map
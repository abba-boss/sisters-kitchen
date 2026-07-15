"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyFavorites = exports.toggleFavorite = void 0;
const database_1 = require("../config/database");
const Favorite_1 = require("../entities/Favorite");
const Product_1 = require("../entities/Product");
const toggleFavorite = async (req, res) => {
    try {
        const { productId } = req.body;
        const favoriteRepo = database_1.AppDataSource.getRepository(Favorite_1.Favorite);
        const existing = await favoriteRepo.findOne({
            where: { user: { id: req.user.id }, product: { id: productId } },
        });
        if (existing) {
            await favoriteRepo.remove(existing);
            res.json({ success: true, message: "Removed from favorites", isFavorite: false });
        }
        else {
            const productRepo = database_1.AppDataSource.getRepository(Product_1.Product);
            const product = await productRepo.findOne({ where: { id: productId } });
            if (!product) {
                res.status(404).json({ success: false, message: "Product not found" });
                return;
            }
            const favorite = favoriteRepo.create({ user: req.user, product });
            await favoriteRepo.save(favorite);
            res.json({ success: true, message: "Added to favorites", isFavorite: true });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.toggleFavorite = toggleFavorite;
const getMyFavorites = async (req, res) => {
    try {
        const favoriteRepo = database_1.AppDataSource.getRepository(Favorite_1.Favorite);
        const favorites = await favoriteRepo.find({
            where: { user: { id: req.user.id } },
            relations: ["product", "product.vendor", "product.category"],
            order: { createdAt: "DESC" },
        });
        res.json({ success: true, data: favorites });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMyFavorites = getMyFavorites;
//# sourceMappingURL=favoriteController.js.map
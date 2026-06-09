import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Favorite } from "../entities/Favorite";
import { Product } from "../entities/Product";
import { AuthRequest } from "../middleware/auth";

export const toggleFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.body;
    const favoriteRepo = AppDataSource.getRepository(Favorite);

    const existing = await favoriteRepo.findOne({
      where: { user: { id: req.user!.id }, product: { id: productId } },
    });

    if (existing) {
      await favoriteRepo.remove(existing);
      res.json({ success: true, message: "Removed from favorites", isFavorite: false });
    } else {
      const productRepo = AppDataSource.getRepository(Product);
      const product = await productRepo.findOne({ where: { id: productId } });

      if (!product) {
        res.status(404).json({ success: false, message: "Product not found" });
        return;
      }

      const favorite = favoriteRepo.create({ user: req.user, product });
      await favoriteRepo.save(favorite);
      res.json({ success: true, message: "Added to favorites", isFavorite: true });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyFavorites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const favoriteRepo = AppDataSource.getRepository(Favorite);
    const favorites = await favoriteRepo.find({
      where: { user: { id: req.user!.id } },
      relations: ["product", "product.vendor", "product.category"],
      order: { createdAt: "DESC" },
    });
    res.json({ success: true, data: favorites });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

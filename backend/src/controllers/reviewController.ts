import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Review } from "../entities/Review";
import { Product } from "../entities/Product";
import { Vendor } from "../entities/Vendor";
import { AuthRequest } from "../middleware/auth";
import { creditCoins, REWARD_RATES } from "./rewardController";
import { RewardTxType } from "../entities/RewardTransaction";

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rating, comment, productId, vendorId } = req.body;

    if (!productId && !vendorId) {
      res.status(400).json({ success: false, message: "Product or vendor ID is required" });
      return;
    }

    const reviewRepo = AppDataSource.getRepository(Review);
    const review = reviewRepo.create({
      rating: Number(rating),
      comment,
      user: req.user,
    });

    if (productId) {
      const productRepo = AppDataSource.getRepository(Product);
      const product = await productRepo.findOne({ where: { id: productId } });
      if (!product) {
        res.status(404).json({ success: false, message: "Product not found" });
        return;
      }
      review.product = product;
        // Update product rating
        const reviews = await reviewRepo.find({ where: { product: { id: productId } } });
        const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) + Number(rating)) / (reviews.length + 1);
        product.rating = Math.round(avgRating * 10) / 10;
        product.totalReviews = reviews.length + 1;
        await productRepo.save(product);
    }

    if (vendorId) {
      const vendorRepo = AppDataSource.getRepository(Vendor);
      const vendor = await vendorRepo.findOne({ where: { id: vendorId } });
      if (!vendor) {
        res.status(404).json({ success: false, message: "Vendor not found" });
        return;
      }
      review.vendor = vendor;
        const reviews = await reviewRepo.find({ where: { vendor: { id: vendorId } } });
        const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) + Number(rating)) / (reviews.length + 1);
        vendor.rating = Math.round(avgRating * 10) / 10;
        vendor.totalReviews = reviews.length + 1;
        await vendorRepo.save(vendor);
    }

    await reviewRepo.save(review);

    // ── Reward reviewer ────────────────────────────────────────
    try {
      await creditCoins(
        req.user!.id, REWARD_RATES.REVIEW,
        RewardTxType.EARN_REVIEW,
        "Earned coins for writing a review",
        review.id
      );
    } catch {}

    res.status(201).json({ success: true, message: "Review submitted", data: review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const reviewRepo = AppDataSource.getRepository(Review);
    const reviews = await reviewRepo.find({
      where: { product: { id: req.params.productId as string } },
      relations: ["user"],
      order: { createdAt: "DESC" },
    });
    res.json({ success: true, data: reviews });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVendorReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const reviewRepo = AppDataSource.getRepository(Review);
    const reviews = await reviewRepo.find({
      where: { vendor: { id: req.params.vendorId as string } },
      relations: ["user"],
      order: { createdAt: "DESC" },
    });
    res.json({ success: true, data: reviews });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reviewRepo = AppDataSource.getRepository(Review);
    const review = await reviewRepo.findOne({
      where: { id: String(req.params.id) },
      relations: ["user"],
    });

    if (!review) {
      res.status(404).json({ success: false, message: "Review not found" });
      return;
    }

    if (review.user.id !== req.user!.id && req.user!.role !== "admin") {
      res.status(403).json({ success: false, message: "Not authorized" });
      return;
    }

    await reviewRepo.remove(review);
    res.json({ success: true, message: "Review deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

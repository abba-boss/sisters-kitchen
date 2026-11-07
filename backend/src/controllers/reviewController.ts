import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Review } from "../entities/Review";
import { Product } from "../entities/Product";
import { Vendor } from "../entities/Vendor";
import { Order, OrderStatus } from "../entities/Order";
import { AuthRequest } from "../middleware/auth";
import { publicUser } from "../utils/serializers";

/**
 * Has this customer actually received something from the vendor / this product?
 * Reviews are only accepted from completed orders, otherwise anyone can inflate
 * (or tank) a vendor's rating without ever buying anything.
 */
async function hasDeliveredOrder(
  userId: string,
  opts: { productId?: string; vendorId?: string }
): Promise<boolean> {
  const qb = AppDataSource.getRepository(Order)
    .createQueryBuilder("order")
    .innerJoin("order.items", "item")
    .where("order.userId = :userId", { userId })
    .andWhere("order.status = :status", { status: OrderStatus.DELIVERED });

  if (opts.productId) qb.andWhere("item.productId = :productId", { productId: opts.productId });
  if (opts.vendorId) qb.andWhere("order.vendorId = :vendorId", { vendorId: opts.vendorId });

  return (await qb.getCount()) > 0;
}

/** Recompute a product's stored rating/review count from its reviews. */
async function recalculateProductRating(productId: string): Promise<void> {
  const reviewRepo = AppDataSource.getRepository(Review);
  const agg = await reviewRepo
    .createQueryBuilder("review")
    .select("AVG(review.rating)", "avg")
    .addSelect("COUNT(review.id)", "count")
    .where("review.productId = :productId", { productId })
    .getRawOne<{ avg: string | null; count: string }>();

  const count = Number(agg?.count ?? 0);
  const avg = count > 0 ? Number(agg?.avg) : 0;

  await AppDataSource.getRepository(Product).update(
    { id: productId },
    { rating: Math.round(avg * 10) / 10, totalReviews: count }
  );
}

/** Recompute a vendor's stored rating/review count from its reviews. */
async function recalculateVendorRating(vendorId: string): Promise<void> {
  const reviewRepo = AppDataSource.getRepository(Review);
  const agg = await reviewRepo
    .createQueryBuilder("review")
    .select("AVG(review.rating)", "avg")
    .addSelect("COUNT(review.id)", "count")
    .where("review.vendorId = :vendorId", { vendorId })
    .getRawOne<{ avg: string | null; count: string }>();

  const count = Number(agg?.count ?? 0);
  const avg = count > 0 ? Number(agg?.avg) : 0;

  await AppDataSource.getRepository(Vendor).update(
    { id: vendorId },
    { rating: Math.round(avg * 10) / 10, totalReviews: count }
  );
}

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rating, comment, productId, vendorId } = req.body;

    if (!productId && !vendorId) {
      res.status(400).json({ success: false, message: "A product or vendor is required" });
      return;
    }

    const reviewRepo = AppDataSource.getRepository(Review);
    const productRepo = AppDataSource.getRepository(Product);
    const vendorRepo = AppDataSource.getRepository(Vendor);

    const product = productId ? await productRepo.findOne({ where: { id: productId } }) : null;
    if (productId && !product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    const vendor = vendorId ? await vendorRepo.findOne({ where: { id: vendorId } }) : null;
    if (vendorId && !vendor) {
      res.status(404).json({ success: false, message: "Vendor not found" });
      return;
    }

    // One review per customer per product (and per vendor).
    const duplicate = await reviewRepo.findOne({
      where: {
        user: { id: req.user!.id },
        ...(product ? { product: { id: product.id } } : { vendor: { id: vendor!.id } }),
      },
    });
    if (duplicate) {
      res.status(409).json({ success: false, message: "You have already reviewed this" });
      return;
    }

    const canReview = await hasDeliveredOrder(req.user!.id, {
      productId: product?.id,
      vendorId: vendor?.id ?? product?.vendor?.id,
    });
    if (!canReview) {
      res.status(403).json({
        success: false,
        message: "You can review items or vendors only after a completed order",
      });
      return;
    }

    const review = reviewRepo.create({
      rating: Number(rating),
      comment,
      user: req.user,
      product: product ?? undefined,
      vendor: vendor ?? undefined,
      isVerifiedPurchase: true,
    });

    await reviewRepo.save(review);

    if (product) await recalculateProductRating(product.id);
    if (vendor) await recalculateVendorRating(vendor.id);

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
    res.json({ success: true, data: reviews.map((r) => ({ ...r, user: publicUser(r.user) })) });
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
    res.json({ success: true, data: reviews.map((r) => ({ ...r, user: publicUser(r.user) })) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reviewRepo = AppDataSource.getRepository(Review);
    const review = await reviewRepo.findOne({
      where: { id: req.params.id as string },
      relations: ["user", "product", "vendor"],
    });

    if (!review) {
      res.status(404).json({ success: false, message: "Review not found" });
      return;
    }

    if (review.user.id !== req.user!.id && req.user!.role !== "admin") {
      res.status(403).json({ success: false, message: "Not authorized" });
      return;
    }

    const productId = review.product?.id;
    const vendorId = review.vendor?.id;

    await reviewRepo.remove(review);

    // Keep the cached aggregates honest after a review disappears.
    if (productId) await recalculateProductRating(productId);
    if (vendorId) await recalculateVendorRating(vendorId);

    res.json({ success: true, message: "Review deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Vendor, VendorStatus } from "../entities/Vendor";
import { Product } from "../entities/Product";
import { Review } from "../entities/Review";

export const getPublicStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const vendorRepo = AppDataSource.getRepository(Vendor);
    const productRepo = AppDataSource.getRepository(Product);
    const reviewRepo = AppDataSource.getRepository(Review);

    const [vendors, products, ratingRow] = await Promise.all([
      vendorRepo.count({ where: { status: VendorStatus.APPROVED } }),
      productRepo
        .createQueryBuilder("product")
        .innerJoin("product.vendor", "vendor")
        .where("vendor.status = :approved", { approved: VendorStatus.APPROVED })
        .andWhere("product.isAvailable = :yes", { yes: true })
        .getCount(),
      reviewRepo
        .createQueryBuilder("review")
        .select("AVG(review.rating)", "avg")
        .addSelect("COUNT(review.id)", "count")
        .getRawOne(),
    ]);

    let avgRating = 0;
    const reviewCount = Number(ratingRow?.count || 0);

    if (reviewCount > 0) {
      avgRating = Math.round(Number(ratingRow.avg) * 10) / 10;
    } else {
      const vendorRatingRow = await vendorRepo
        .createQueryBuilder("vendor")
        .select("AVG(vendor.rating)", "avg")
        .where("vendor.status = :approved", { approved: VendorStatus.APPROVED })
        .andWhere("vendor.totalReviews > 0")
        .getRawOne();
      avgRating = vendorRatingRow?.avg
        ? Math.round(Number(vendorRatingRow.avg) * 10) / 10
        : 0;
    }

    res.json({
      success: true,
      data: {
        vendors,
        products,
        avgRating,
        reviewCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

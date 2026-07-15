"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicStats = void 0;
const database_1 = require("../config/database");
const Vendor_1 = require("../entities/Vendor");
const Product_1 = require("../entities/Product");
const Review_1 = require("../entities/Review");
const getPublicStats = async (_req, res) => {
    try {
        const vendorRepo = database_1.AppDataSource.getRepository(Vendor_1.Vendor);
        const productRepo = database_1.AppDataSource.getRepository(Product_1.Product);
        const reviewRepo = database_1.AppDataSource.getRepository(Review_1.Review);
        const [vendors, products, ratingRow] = await Promise.all([
            vendorRepo.count({ where: { status: Vendor_1.VendorStatus.APPROVED } }),
            productRepo
                .createQueryBuilder("product")
                .innerJoin("product.vendor", "vendor")
                .where("vendor.status = :approved", { approved: Vendor_1.VendorStatus.APPROVED })
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
        }
        else {
            const vendorRatingRow = await vendorRepo
                .createQueryBuilder("vendor")
                .select("AVG(vendor.rating)", "avg")
                .where("vendor.status = :approved", { approved: Vendor_1.VendorStatus.APPROVED })
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPublicStats = getPublicStats;
//# sourceMappingURL=statsController.js.map
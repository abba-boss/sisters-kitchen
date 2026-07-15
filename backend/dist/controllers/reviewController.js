"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReview = exports.getVendorReviews = exports.getProductReviews = exports.createReview = void 0;
const database_1 = require("../config/database");
const Review_1 = require("../entities/Review");
const Product_1 = require("../entities/Product");
const Vendor_1 = require("../entities/Vendor");
const createReview = async (req, res) => {
    try {
        const { rating, comment, productId, vendorId } = req.body;
        const reviewRepo = database_1.AppDataSource.getRepository(Review_1.Review);
        const review = reviewRepo.create({
            rating: Number(rating),
            comment,
            user: req.user,
        });
        if (productId) {
            const productRepo = database_1.AppDataSource.getRepository(Product_1.Product);
            const product = await productRepo.findOne({ where: { id: productId } });
            if (product) {
                review.product = product;
                // Update product rating
                const reviews = await reviewRepo.find({ where: { product: { id: productId } } });
                const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) + Number(rating)) / (reviews.length + 1);
                product.rating = Math.round(avgRating * 10) / 10;
                product.totalReviews = reviews.length + 1;
                await productRepo.save(product);
            }
        }
        if (vendorId) {
            const vendorRepo = database_1.AppDataSource.getRepository(Vendor_1.Vendor);
            const vendor = await vendorRepo.findOne({ where: { id: vendorId } });
            if (vendor) {
                review.vendor = vendor;
                const reviews = await reviewRepo.find({ where: { vendor: { id: vendorId } } });
                const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) + Number(rating)) / (reviews.length + 1);
                vendor.rating = Math.round(avgRating * 10) / 10;
                vendor.totalReviews = reviews.length + 1;
                await vendorRepo.save(vendor);
            }
        }
        await reviewRepo.save(review);
        res.status(201).json({ success: true, message: "Review submitted", data: review });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createReview = createReview;
const getProductReviews = async (req, res) => {
    try {
        const reviewRepo = database_1.AppDataSource.getRepository(Review_1.Review);
        const reviews = await reviewRepo.find({
            where: { product: { id: req.params.productId } },
            relations: ["user"],
            order: { createdAt: "DESC" },
        });
        res.json({ success: true, data: reviews });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getProductReviews = getProductReviews;
const getVendorReviews = async (req, res) => {
    try {
        const reviewRepo = database_1.AppDataSource.getRepository(Review_1.Review);
        const reviews = await reviewRepo.find({
            where: { vendor: { id: req.params.vendorId } },
            relations: ["user"],
            order: { createdAt: "DESC" },
        });
        res.json({ success: true, data: reviews });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getVendorReviews = getVendorReviews;
const deleteReview = async (req, res) => {
    try {
        const reviewRepo = database_1.AppDataSource.getRepository(Review_1.Review);
        const review = await reviewRepo.findOne({
            where: { id: req.params.id },
            relations: ["user"],
        });
        if (!review) {
            res.status(404).json({ success: false, message: "Review not found" });
            return;
        }
        if (review.user.id !== req.user.id && req.user.role !== "admin") {
            res.status(403).json({ success: false, message: "Not authorized" });
            return;
        }
        await reviewRepo.remove(review);
        res.json({ success: true, message: "Review deleted" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteReview = deleteReview;
//# sourceMappingURL=reviewController.js.map
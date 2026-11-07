import { Router } from "express";
import {
  createReview,
  getProductReviews,
  getVendorReviews,
  deleteReview,
} from "../controllers/reviewController";
import { authenticate } from "../middleware/auth";
import { validateReview } from "../middleware/validate";

const router = Router();

router.post("/", authenticate, validateReview, createReview);
router.get("/product/:productId", getProductReviews);
router.get("/vendor/:vendorId", getVendorReviews);
router.delete("/:id", authenticate, deleteReview);

export default router;

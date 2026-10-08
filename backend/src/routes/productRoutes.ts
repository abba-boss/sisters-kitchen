import { Router } from "express";
import {
  getAllProducts,
  getProductById,
  getFeaturedProducts,
  getFreshTodayProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getVendorProducts,
  patchProduct,
} from "../controllers/productController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../entities/User";
import { uploadMultiple } from "../middleware/upload";

const router = Router();

router.get("/", getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/fresh-today", getFreshTodayProducts);
router.get("/my-products", authenticate, authorize(UserRole.VENDOR), getVendorProducts);
router.get("/:id", getProductById);
router.post(
  "/",
  authenticate,
  authorize(UserRole.VENDOR),
  uploadMultiple.array("images", 5),
  createProduct
);
router.put(
  "/:id",
  authenticate,
  authorize(UserRole.VENDOR),
  uploadMultiple.array("images", 5),
  updateProduct
);
// PATCH — partial update (admin can toggle availability, vendor can update minor fields)
router.patch(
  "/:id",
  authenticate,
  authorize(UserRole.VENDOR, UserRole.ADMIN),
  patchProduct
);
router.delete("/:id", authenticate, authorize(UserRole.VENDOR, UserRole.ADMIN), deleteProduct);

export default router;

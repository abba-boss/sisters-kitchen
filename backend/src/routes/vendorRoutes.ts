import { Router } from "express";
import {
  getAllVendors,
  getVendorById,
  getMyVendorProfile,
  updateVendorProfile,
  toggleVendorStatus,
  getVendorStats,
  updateVendorApproval,
} from "../controllers/vendorController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../entities/User";
import { uploadMultiple } from "../middleware/upload";

const router = Router();

router.get("/", getAllVendors);
router.get("/my-profile", authenticate, authorize(UserRole.VENDOR), getMyVendorProfile);
router.get("/stats", authenticate, authorize(UserRole.VENDOR), getVendorStats);
router.get("/:id", getVendorById);
router.put(
  "/my-profile",
  authenticate,
  authorize(UserRole.VENDOR),
  uploadMultiple.fields([{ name: "logo", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]),
  updateVendorProfile
);
router.patch("/toggle-status", authenticate, authorize(UserRole.VENDOR), toggleVendorStatus);
router.patch("/:id/approval", authenticate, authorize(UserRole.ADMIN), updateVendorApproval);

export default router;

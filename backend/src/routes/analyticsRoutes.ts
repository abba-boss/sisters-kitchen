import { Router } from "express";
import { getVendorAnalytics, getAdminAnalytics } from "../controllers/analyticsController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../entities/User";

const router = Router();

router.get("/vendor", authenticate, authorize(UserRole.VENDOR), getVendorAnalytics);
router.get("/admin", authenticate, authorize(UserRole.ADMIN), getAdminAnalytics);

export default router;

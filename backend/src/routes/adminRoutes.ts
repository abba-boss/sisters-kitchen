import { Router } from "express";
import {
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
  getAllVendorsAdmin,
} from "../controllers/adminController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../entities/User";

const router = Router();

router.use(authenticate, authorize(UserRole.ADMIN));

router.get("/dashboard", getDashboardStats);
router.get("/users", getAllUsers);
router.patch("/users/:id/toggle-status", toggleUserStatus);
router.get("/vendors", getAllVendorsAdmin);

export default router;

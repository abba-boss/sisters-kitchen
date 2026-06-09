import { Router } from "express";
import {
  createOrder, getMyOrders, getOrderById,
  getVendorOrders, updateOrderStatus, getAllOrders,
} from "../controllers/orderController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../entities/User";
import { validateCreateOrder } from "../middleware/validate";

const router = Router();

router.post("/", authenticate, authorize(UserRole.CUSTOMER), validateCreateOrder, createOrder);
router.get("/my-orders", authenticate, getMyOrders);
router.get("/vendor-orders", authenticate, authorize(UserRole.VENDOR), getVendorOrders);
router.get("/all", authenticate, authorize(UserRole.ADMIN), getAllOrders);
router.get("/:id", authenticate, getOrderById);
router.patch("/:id/status", authenticate, authorize(UserRole.VENDOR, UserRole.ADMIN), updateOrderStatus);

export default router;

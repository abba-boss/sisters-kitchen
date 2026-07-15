"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const auth_1 = require("../middleware/auth");
const User_1 = require("../entities/User");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
router.post("/", auth_1.authenticate, (0, auth_1.authorize)(User_1.UserRole.CUSTOMER), validate_1.validateCreateOrder, orderController_1.createOrder);
router.get("/my-orders", auth_1.authenticate, orderController_1.getMyOrders);
router.get("/vendor-orders", auth_1.authenticate, (0, auth_1.authorize)(User_1.UserRole.VENDOR), orderController_1.getVendorOrders);
router.get("/all", auth_1.authenticate, (0, auth_1.authorize)(User_1.UserRole.ADMIN), orderController_1.getAllOrders);
router.get("/:id", auth_1.authenticate, orderController_1.getOrderById);
router.patch("/:id/status", auth_1.authenticate, (0, auth_1.authorize)(User_1.UserRole.VENDOR, User_1.UserRole.ADMIN), orderController_1.updateOrderStatus);
exports.default = router;
//# sourceMappingURL=orderRoutes.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const User_1 = require("../entities/User");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, auth_1.authorize)(User_1.UserRole.ADMIN));
router.get("/dashboard", adminController_1.getDashboardStats);
router.get("/users", adminController_1.getAllUsers);
router.patch("/users/:id/toggle-status", adminController_1.toggleUserStatus);
router.get("/vendors", adminController_1.getAllVendorsAdmin);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map
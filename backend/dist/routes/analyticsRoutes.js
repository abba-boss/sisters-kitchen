"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsController_1 = require("../controllers/analyticsController");
const auth_1 = require("../middleware/auth");
const User_1 = require("../entities/User");
const router = (0, express_1.Router)();
router.get("/vendor", auth_1.authenticate, (0, auth_1.authorize)(User_1.UserRole.VENDOR), analyticsController_1.getVendorAnalytics);
router.get("/admin", auth_1.authenticate, (0, auth_1.authorize)(User_1.UserRole.ADMIN), analyticsController_1.getAdminAnalytics);
exports.default = router;
//# sourceMappingURL=analyticsRoutes.js.map
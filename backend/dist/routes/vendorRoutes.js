"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vendorController_1 = require("../controllers/vendorController");
const auth_1 = require("../middleware/auth");
const User_1 = require("../entities/User");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
router.get("/", vendorController_1.getAllVendors);
router.get("/my-profile", auth_1.authenticate, (0, auth_1.authorize)(User_1.UserRole.VENDOR), vendorController_1.getMyVendorProfile);
router.get("/stats", auth_1.authenticate, (0, auth_1.authorize)(User_1.UserRole.VENDOR), vendorController_1.getVendorStats);
router.get("/:id", vendorController_1.getVendorById);
router.put("/my-profile", auth_1.authenticate, (0, auth_1.authorize)(User_1.UserRole.VENDOR), upload_1.uploadMultiple.fields([{ name: "logo", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]), vendorController_1.updateVendorProfile);
router.patch("/toggle-status", auth_1.authenticate, (0, auth_1.authorize)(User_1.UserRole.VENDOR), vendorController_1.toggleVendorStatus);
router.patch("/:id/approval", auth_1.authenticate, (0, auth_1.authorize)(User_1.UserRole.ADMIN), vendorController_1.updateVendorApproval);
exports.default = router;
//# sourceMappingURL=vendorRoutes.js.map
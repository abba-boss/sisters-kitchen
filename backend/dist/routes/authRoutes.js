"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
router.post("/register", validate_1.validateRegister, authController_1.register);
router.post("/login", validate_1.validateLogin, authController_1.login);
router.post("/refresh-token", authController_1.refreshToken);
router.post("/logout", auth_1.authenticate, authController_1.logout);
router.get("/me", auth_1.authenticate, authController_1.getMe);
router.put("/profile", auth_1.authenticate, authController_1.updateProfile);
router.put("/change-password", auth_1.authenticate, authController_1.changePassword);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map
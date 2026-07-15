"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const auth_1 = require("../middleware/auth");
const User_1 = require("../entities/User");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
router.get("/", productController_1.getAllProducts);
router.get("/featured", productController_1.getFeaturedProducts);
router.get("/fresh-today", productController_1.getFreshTodayProducts);
router.get("/my-products", auth_1.authenticate, (0, auth_1.authorize)(User_1.UserRole.VENDOR), productController_1.getVendorProducts);
router.get("/:id", productController_1.getProductById);
router.post("/", auth_1.authenticate, (0, auth_1.authorize)(User_1.UserRole.VENDOR), upload_1.uploadMultiple.array("images", 5), productController_1.createProduct);
router.put("/:id", auth_1.authenticate, (0, auth_1.authorize)(User_1.UserRole.VENDOR), upload_1.uploadMultiple.array("images", 5), productController_1.updateProduct);
router.delete("/:id", auth_1.authenticate, (0, auth_1.authorize)(User_1.UserRole.VENDOR, User_1.UserRole.ADMIN), productController_1.deleteProduct);
exports.default = router;
//# sourceMappingURL=productRoutes.js.map
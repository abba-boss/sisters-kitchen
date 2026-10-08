"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categoryController_1 = require("../controllers/categoryController");
const auth_1 = require("../middleware/auth");
const User_1 = require("../entities/User");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
router.get("/", categoryController_1.getAllCategories);
router.get("/:id", categoryController_1.getCategoryById);
router.post("/", auth_1.authenticate, (0, auth_1.authorize)(User_1.UserRole.ADMIN), upload_1.upload.single("image"), categoryController_1.createCategory);
router.put("/:id", auth_1.authenticate, (0, auth_1.authorize)(User_1.UserRole.ADMIN), upload_1.upload.single("image"), categoryController_1.updateCategory);
router.delete("/:id", auth_1.authenticate, (0, auth_1.authorize)(User_1.UserRole.ADMIN), categoryController_1.deleteCategory);
exports.default = router;
//# sourceMappingURL=categoryRoutes.js.map
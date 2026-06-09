import { Router } from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../entities/User";
import { upload } from "../middleware/upload";

const router = Router();

router.get("/", getAllCategories);
router.get("/:id", getCategoryById);
router.post("/", authenticate, authorize(UserRole.ADMIN), upload.single("image"), createCategory);
router.put("/:id", authenticate, authorize(UserRole.ADMIN), upload.single("image"), updateCategory);
router.delete("/:id", authenticate, authorize(UserRole.ADMIN), deleteCategory);

export default router;

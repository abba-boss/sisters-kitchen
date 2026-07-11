import { Router } from "express";
import {
  createPost, getPublicFeed, getVendorPosts, getMyPosts,
  getPostById, updatePost, deletePost,
  toggleLike, getLikeStatus,
  addComment, getComments, deleteComment,
  toggleSave, getSavedPosts,
} from "../controllers/postController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../entities/User";
import { uploadMultiple } from "../middleware/upload";
import { body } from "express-validator";
import { handleValidationErrors } from "../middleware/validate";

const router = Router();

// ── Public ────────────────────────────────────────────────────────
router.get("/feed",            getPublicFeed);
router.get("/vendor/:vendorId", getVendorPosts);
router.get("/:id",             getPostById);
router.get("/:id/comments",    getComments);

// ── Authenticated ─────────────────────────────────────────────────
router.get("/saved/list", authenticate, getSavedPosts);
router.get("/:id/like-status", authenticate, getLikeStatus);

// ── Vendor only ───────────────────────────────────────────────────
router.post(
  "/",
  authenticate,
  authorize(UserRole.VENDOR),
  uploadMultiple.array("media", 10),
  [
    body("caption").trim().notEmpty().withMessage("Caption is required").isLength({ max: 2200 }),
    handleValidationErrors,
  ],
  createPost
);

router.put(
  "/:id",
  authenticate,
  authorize(UserRole.VENDOR, UserRole.ADMIN),
  updatePost
);

router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.VENDOR, UserRole.ADMIN),
  deletePost
);

router.get(
  "/my/posts",
  authenticate,
  authorize(UserRole.VENDOR),
  getMyPosts
);

// ── Engagement (any auth user) ────────────────────────────────────
router.post("/:id/like",    authenticate, toggleLike);
router.post("/:id/save",    authenticate, toggleSave);
router.post(
  "/:id/comments",
  authenticate,
  [
    body("content").trim().notEmpty().withMessage("Comment content required").isLength({ max: 500 }),
    handleValidationErrors,
  ],
  addComment
);
router.delete("/:id/comments/:commentId", authenticate, deleteComment);

export default router;

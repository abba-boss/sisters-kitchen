import { Router } from "express";
import {
  createPost, getPublicFeed, getFollowingFeed, getVendorPosts, getMyPosts, getMyPostById,
  getPostById, updatePost, deletePost,
  toggleLike, getLikeStatus,
  addComment, getComments, deleteComment,
  toggleSave, getSavedPosts,
} from "../controllers/postController";
import { authenticate, authorize, optionalAuth } from "../middleware/auth";
import { UserRole } from "../entities/User";
import { uploadMedia } from "../middleware/upload";
import { body } from "express-validator";
import { handleValidationErrors } from "../middleware/validate";

const router = Router();

// ── Public ────────────────────────────────────────────────────────
router.get("/feed",            optionalAuth, getPublicFeed);
router.get("/following",       authenticate, getFollowingFeed);
router.get("/vendor/:vendorId", optionalAuth, getVendorPosts);
router.get("/:id",             optionalAuth, getPostById);
router.get("/:id/comments",    getComments);

// ── Authenticated ─────────────────────────────────────────────────
router.get("/saved/list", authenticate, getSavedPosts);
router.get("/:id/like-status", authenticate, getLikeStatus);

// ── Vendor only ───────────────────────────────────────────────────
router.post(
  "/",
  authenticate,
  authorize(UserRole.VENDOR),
  uploadMedia.array("media", 10),
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
  "/my/posts/:id",
  authenticate,
  authorize(UserRole.VENDOR, UserRole.ADMIN),
  getMyPostById
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

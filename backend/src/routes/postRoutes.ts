import { Router } from "express";
import { authenticate, optionalAuth } from "../middleware/auth";
import { upload } from "../middleware/upload";
import {
  getFeed, getVendorPosts, getMyPosts, getSavedPosts, getPost,
  createPost, updatePost, deletePost,
  toggleLike, toggleSave,
  getComments, addComment, deleteComment,
} from "../controllers/postController";

const router = Router();

// Feed & discovery (optional auth for personalisation)
router.get("/feed",          optionalAuth, getFeed);
router.get("/vendor/:vendorId", optionalAuth, getVendorPosts);
router.get("/saved/list",    authenticate, getSavedPosts);
router.get("/my/posts",      authenticate, getMyPosts);
router.get("/:id",           optionalAuth, getPost);

// Mutations
router.post("/",             authenticate, upload.array("media", 5), createPost);
router.put("/:id",           authenticate, updatePost);
router.delete("/:id",        authenticate, deletePost);

// Social actions
router.post("/:id/like",     authenticate, toggleLike);
router.post("/:id/save",     authenticate, toggleSave);

// Comments
router.get("/:id/comments",          optionalAuth, getComments);
router.post("/:id/comments",         authenticate, addComment);
router.delete("/:id/comments/:commentId", authenticate, deleteComment);

export default router;

import { Router } from "express";
import {
  createStory, getVendorStories, getStoriesFeed,
  viewStory, deleteStory, getMyStories,
} from "../controllers/storyController";
import { authenticate, authorize, optionalAuth } from "../middleware/auth";
import { UserRole } from "../entities/User";
import { uploadMedia } from "../middleware/upload";

const router = Router();

// ── Public / optional-auth ────────────────────────────────────────
router.get("/feed", optionalAuth, getStoriesFeed);     // public + seen-status if logged in
router.get("/vendor/:vendorId", getVendorStories);     // fully public

// ── Authenticated ─────────────────────────────────────────────────
router.get("/my",     authenticate, authorize(UserRole.VENDOR), getMyStories);
router.post("/",      authenticate, authorize(UserRole.VENDOR), uploadMedia.single("media"), createStory);
router.post("/:id/view", authenticate, viewStory);
router.delete("/:id", authenticate, authorize(UserRole.VENDOR, UserRole.ADMIN), deleteStory);

export default router;

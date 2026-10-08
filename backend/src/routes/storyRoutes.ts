import { Router } from "express";
import { authenticate, optionalAuth } from "../middleware/auth";
import { upload } from "../middleware/upload";
import {
  getStoryFeed, getVendorStories, getMyStories,
  createStory, viewStory, deleteStory,
} from "../controllers/storyController";

const router = Router();

router.get("/feed",           optionalAuth, getStoryFeed);
router.get("/vendor/:vendorId", optionalAuth, getVendorStories);
router.get("/my",             authenticate, getMyStories);
router.post("/",              authenticate, upload.single("media"), createStory);
router.post("/:id/view",      optionalAuth, viewStory);
router.delete("/:id",         authenticate, deleteStory);

export default router;

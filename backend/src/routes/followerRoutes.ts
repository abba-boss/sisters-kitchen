import { Router } from "express";
import { authenticate, optionalAuth } from "../middleware/auth";
import {
  toggleFollow, getFollowStatus, getFollowers, getMyFollowing,
} from "../controllers/followerController";

const router = Router();

router.post("/:vendorId/follow",  authenticate,  toggleFollow);
router.get("/:vendorId/count",    optionalAuth,   getFollowStatus);
router.get("/:vendorId/list",     optionalAuth,   getFollowers);
router.get("/my/following",       authenticate,  getMyFollowing);

export default router;

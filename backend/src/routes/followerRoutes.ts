import { Router } from "express";
import {
  toggleFollow,
  getVendorFollowers,
  getFollowing,
  checkFollowStatus,
} from "../controllers/followerController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post  ("/:vendorId/follow",  authenticate, toggleFollow);
router.get   ("/:vendorId/count",   authenticate, checkFollowStatus);
router.get   ("/:vendorId/list",    getVendorFollowers);
router.get   ("/my/following",      authenticate, getFollowing);

export default router;

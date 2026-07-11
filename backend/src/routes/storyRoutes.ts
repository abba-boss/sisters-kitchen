import { Router } from "express";
import {
  createStory, getVendorStories, getStoriesFeed,
  viewStory, deleteStory, getMyStories,
} from "../controllers/storyController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../entities/User";
import { upload } from "../middleware/upload";

const router = Router();

// ── Public / optional-auth ────────────────────────────────────────
router.get("/feed", optionalAuth, getStoriesFeed);     // public + seen-status if logged in
router.get("/vendor/:vendorId", getVendorStories);     // fully public

// ── Authenticated ─────────────────────────────────────────────────
router.get("/my",     authenticate, authorize(UserRole.VENDOR), getMyStories);
router.post("/",      authenticate, authorize(UserRole.VENDOR), upload.single("media"), createStory);
router.post("/:id/view", authenticate, viewStory);
router.delete("/:id", authenticate, authorize(UserRole.VENDOR, UserRole.ADMIN), deleteStory);

export default router;

// ── Optional auth middleware ──────────────────────────────────────
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { AuthRequest } from "../middleware/auth";

async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      const token   = header.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user    = await AppDataSource.getRepository(User).findOne({
        where: { id: decoded.userId, isActive: true },
      });
      if (user) req.user = user;
    }
  } catch {} // silently ignore — just means unauthenticated
  next();
}

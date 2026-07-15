import { Router } from "express";
import { createStory, getStoriesFeed, getVendorStories, viewStory, deleteStory, getMyStories } from "../controllers/storyController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../entities/User";
import { upload } from "../middleware/upload";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { AuthRequest } from "../middleware/auth";

const router = Router();

// Optional-auth middleware for feed
async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET!) as {userId:string};
      const user = await AppDataSource.getRepository(User).findOne({where:{id:decoded.userId,isActive:true}});
      if (user) req.user = user;
    }
  } catch {}
  next();
}

router.get("/feed",             optionalAuth, getStoriesFeed);
router.get("/vendor/:vendorId", getVendorStories);
router.get("/my",               authenticate, authorize(UserRole.VENDOR), getMyStories);
router.post("/",                authenticate, authorize(UserRole.VENDOR), upload.single("media"), createStory);
router.post("/:id/view",        authenticate, viewStory);
router.delete("/:id",           authenticate, authorize(UserRole.VENDOR, UserRole.ADMIN), deleteStory);

export default router;

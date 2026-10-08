import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Follower } from "../entities/Follower";
import { Vendor }   from "../entities/Vendor";
import { logger }   from "../utils/logger";

const followerRepo = () => AppDataSource.getRepository(Follower);
const vendorRepo   = () => AppDataSource.getRepository(Vendor);

// POST /followers/:vendorId/follow  — toggle follow
export const toggleFollow = async (req: Request, res: Response) => {
  try {
    const userId   = (req as any).user.id as string;
    const vendorId = req.params.vendorId as string;

    const vendor = await vendorRepo().findOne({ where: { id: vendorId } });
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });

    const existing = await followerRepo().findOne({
      where: { follower: { id: userId }, vendor: { id: vendorId } },
    });

    if (existing) {
      await followerRepo().remove(existing);
      const count = await followerRepo().count({ where: { vendor: { id: vendorId } } });
      return res.json({ success: true, following: false, followersCount: count, message: "Unfollowed" });
    } else {
      await followerRepo().save({
        follower: { id: userId } as any,
        vendor:   { id: vendorId } as any,
      });
      const count = await followerRepo().count({ where: { vendor: { id: vendorId } } });
      return res.json({ success: true, following: true, followersCount: count, message: "Following" });
    }
  } catch (err) {
    logger.error("toggleFollow:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// GET /followers/:vendorId/count
export const getFollowStatus = async (req: Request, res: Response) => {
  try {
    const userId   = (req as any).user?.id as string | undefined;
    const vendorId = req.params.vendorId as string;

    const count = await followerRepo().count({ where: { vendor: { id: vendorId } } });

    let following = false;
    if (userId) {
      const existing = await followerRepo().findOne({
        where: { follower: { id: userId }, vendor: { id: vendorId } },
      });
      following = !!existing;
    }

    res.json({ success: true, data: { following, followersCount: count } });
  } catch (err) {
    logger.error("getFollowStatus:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// GET /followers/:vendorId/list
export const getFollowers = async (req: Request, res: Response) => {
  try {
    const vendorId = req.params.vendorId as string;
    const page  = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const [followers, total] = await followerRepo().findAndCount({
      where: { vendor: { id: vendorId } },
      relations: ["follower"],
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({ success: true, data: followers, meta: { total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    logger.error("getFollowers:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// GET /followers/my/following
export const getMyFollowing = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const following = await followerRepo().find({
      where: { follower: { id: userId } },
      relations: ["vendor"],
      order: { createdAt: "DESC" },
    });
    res.json({ success: true, data: following.map((f) => f.vendor) });
  } catch (err) {
    logger.error("getMyFollowing:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

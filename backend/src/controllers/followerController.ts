import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Follower } from "../entities/Follower";
import { Vendor } from "../entities/Vendor";
import { Notification, NotificationType } from "../entities/Notification";
import { AuthRequest } from "../middleware/auth";
import { emitNewFollower, emitNotification } from "../config/socket";

export const toggleFollow = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendorId = req.params.vendorId as string;
    const vendorRepo   = AppDataSource.getRepository(Vendor);
    const followerRepo = AppDataSource.getRepository(Follower);

    const vendor = await vendorRepo.findOne({ where: { id: vendorId }, relations: ["user"] });
    if (!vendor) { res.status(404).json({ success: false, message: "Vendor not found" }); return; }

    if (vendor.user.id === req.user!.id) {
      res.status(400).json({ success: false, message: "You cannot follow your own store" }); return;
    }

    const existing = await followerRepo.findOne({
      where: { follower: { id: req.user!.id }, vendor: { id: vendor.id } },
    });

    if (existing) {
      await followerRepo.remove(existing);
      res.json({ success: true, following: false, message: "Unfollowed" });
    } else {
      const follow = followerRepo.create({ follower: req.user, vendor });
      await followerRepo.save(follow);

      const notifRepo = AppDataSource.getRepository(Notification);
      const n = notifRepo.create({
        user: vendor.user,
        title: "New Follower! 🎉",
        message: `${req.user!.firstName} ${req.user!.lastName} started following ${vendor.businessName}`,
        type: NotificationType.NEW_FOLLOWER,
        referenceId: vendor.id,
      });
      await notifRepo.save(n);
      emitNotification(vendor.user.id, n);
      emitNewFollower(vendor.user.id, {
        vendorId: vendor.id,
        follower: { id: req.user!.id, firstName: req.user!.firstName, lastName: req.user!.lastName, avatar: req.user!.avatar },
      });

      res.json({ success: true, following: true, message: "Now following" });
    }
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const getVendorFollowers = async (req: Request, res: Response): Promise<void> => {
  try {
    const vendorId = req.params.vendorId as string;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const followerRepo = AppDataSource.getRepository(Follower);
    const [rows, total] = await followerRepo.findAndCount({
      where: { vendor: { id: vendorId } },
      relations: ["follower"],
      order: { createdAt: "DESC" },
      skip,
      take: Number(limit),
    });

    const followers = rows.map((f) => ({
      id: f.id, createdAt: f.createdAt,
      user: { id: f.follower.id, firstName: f.follower.firstName, lastName: f.follower.lastName, avatar: f.follower.avatar },
    }));

    res.json({ success: true, data: followers, meta: { total, page: Number(page), limit: Number(limit) } });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const getFollowing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const followerRepo = AppDataSource.getRepository(Follower);
    const rows = await followerRepo.find({
      where: { follower: { id: req.user!.id } },
      relations: ["vendor"],
      order: { createdAt: "DESC" },
    });
    res.json({ success: true, data: rows.map((f) => f.vendor) });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const checkFollowStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendorId = req.params.vendorId as string;
    const followerRepo = AppDataSource.getRepository(Follower);

    const [following, count] = await Promise.all([
      followerRepo.findOne({ where: { follower: { id: req.user!.id }, vendor: { id: vendorId } } }),
      followerRepo.count({ where: { vendor: { id: vendorId } } }),
    ]);

    res.json({ success: true, data: { following: !!following, followersCount: count } });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

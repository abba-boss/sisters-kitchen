import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Story, StoryMediaType } from "../entities/Story";
import { StoryView } from "../entities/StoryView";
import { Vendor } from "../entities/Vendor";
import { AuthRequest } from "../middleware/auth";
import { uploadToCloudinary } from "../utils/helpers";
import { emitToUser } from "../config/socket";
import { MoreThan } from "typeorm";

// ── CREATE story ─────────────────────────────────────────────────
export const createStory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendorRepo = AppDataSource.getRepository(Vendor);
    const vendor = await vendorRepo.findOne({ where: { user: { id: req.user!.id } } });
    if (!vendor) { res.status(403).json({ success: false, message: "Vendor profile required" }); return; }

    const { caption, link, mediaUrl: bodyUrl } = req.body;

    let mediaUrl = bodyUrl;
    const file = req.file as Express.Multer.File | undefined;
    if (file) {
      mediaUrl = await uploadToCloudinary(file.path, `sisters-kitchen/stories/${vendor.id}`);
    }
    if (!mediaUrl) { res.status(400).json({ success: false, message: "Media is required" }); return; }

    const isVideo = mediaUrl.includes("/video/") || mediaUrl.endsWith(".mp4") || mediaUrl.endsWith(".webm");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const storyRepo = AppDataSource.getRepository(Story);
    const story = storyRepo.create({
      mediaUrl,
      mediaType: isVideo ? StoryMediaType.VIDEO : StoryMediaType.IMAGE,
      caption: caption?.trim(),
      link: link?.trim(),
      expiresAt,
      isActive: true,
      vendor,
      author: req.user,
    });
    await storyRepo.save(story);

    res.status(201).json({ success: true, message: "Story published", data: story });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// ── GET active stories for a vendor ──────────────────────────────
export const getVendorStories = async (req: Request, res: Response): Promise<void> => {
  try {
    const storyRepo = AppDataSource.getRepository(Story);
    const stories = await storyRepo.find({
      where: {
        vendor: { id: req.params.vendorId as string },
        isActive: true,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: "DESC" },
    });
    res.json({ success: true, data: stories });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// ── GET story feed (vendors the user follows that have active stories) ──
export const getStoriesFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const storyRepo = AppDataSource.getRepository(Story);

    // Get all active stories, group by vendor
    const stories = await storyRepo
      .createQueryBuilder("story")
      .leftJoinAndSelect("story.vendor", "vendor")
      .leftJoinAndSelect("story.author", "author")
      .where("story.isActive = :active", { active: true })
      .andWhere("story.expiresAt > :now", { now: new Date() })
      .andWhere("vendor.status = :status", { status: "approved" })
      .orderBy("story.createdAt", "DESC")
      .getMany();

    // Group by vendor
    const grouped: Record<string, any> = {};
    stories.forEach((s) => {
      const vid = s.vendor?.id;
      if (!vid) return;
      if (!grouped[vid]) {
        grouped[vid] = {
          vendor: {
            id: s.vendor.id,
            businessName: s.vendor.businessName,
            logo: s.vendor.logo,
          },
          stories: [],
          hasUnseen: false,
        };
      }
      grouped[vid].stories.push({
        id: s.id,
        mediaUrl: s.mediaUrl,
        mediaType: s.mediaType,
        thumbnailUrl: s.thumbnailUrl,
        caption: s.caption,
        link: s.link,
        viewsCount: s.viewsCount,
        expiresAt: s.expiresAt,
        createdAt: s.createdAt,
      });
    });

    // If authenticated, mark which stories the user hasn't seen
    if (req.user) {
      const viewRepo = AppDataSource.getRepository(StoryView);
      const seenIds  = await viewRepo
        .createQueryBuilder("sv")
        .select("sv.storyId")
        .where("sv.userId = :uid", { uid: req.user.id })
        .getRawMany()
        .then((rows) => new Set(rows.map((r) => r.sv_storyId)));

      Object.values(grouped).forEach((g: any) => {
        g.hasUnseen = g.stories.some((s: any) => !seenIds.has(s.id));
        g.stories   = g.stories.map((s: any) => ({ ...s, seen: seenIds.has(s.id) }));
      });
    }

    res.json({ success: true, data: Object.values(grouped) });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// ── VIEW a story ──────────────────────────────────────────────────
export const viewStory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const storyRepo = AppDataSource.getRepository(Story);
    const viewRepo  = AppDataSource.getRepository(StoryView);

    const story = await storyRepo.findOne({ where: { id: req.params.id as string } });
    if (!story) { res.status(404).json({ success: false, message: "Story not found" }); return; }

    // Upsert view (Unique constraint prevents duplicates)
    const existing = await viewRepo.findOne({
      where: { user: { id: req.user!.id }, story: { id: story.id } },
    });
    if (!existing) {
      await viewRepo.save(viewRepo.create({ user: req.user, story }));
      await storyRepo.update(story.id, { viewsCount: () => "viewsCount + 1" });
    }

    res.json({ success: true, message: "Viewed" });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// ── DELETE story ──────────────────────────────────────────────────
export const deleteStory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const storyRepo = AppDataSource.getRepository(Story);
    const story = await storyRepo.findOne({
      where: { id: req.params.id as string },
      relations: ["vendor", "vendor.user"],
    });
    if (!story) { res.status(404).json({ success: false, message: "Story not found" }); return; }
    if (story.vendor.user.id !== req.user!.id && req.user!.role !== "admin") {
      res.status(403).json({ success: false, message: "Not authorized" }); return;
    }
    story.isActive = false;
    await storyRepo.save(story);
    res.json({ success: true, message: "Story deleted" });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// ── GET my stories (vendor) ──────────────────────────────────────
export const getMyStories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const storyRepo = AppDataSource.getRepository(Story);
    const stories   = await storyRepo.find({
      where: { vendor: { user: { id: req.user!.id } } },
      order: { createdAt: "DESC" },
      take: 50,
    });
    res.json({ success: true, data: stories });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

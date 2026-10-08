import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Story, StoryView } from "../entities/Story";
import { Vendor } from "../entities/Vendor";
import { logger } from "../utils/logger";

const storyRepo  = () => AppDataSource.getRepository(Story);
const viewRepo   = () => AppDataSource.getRepository(StoryView);
const vendorRepo = () => AppDataSource.getRepository(Vendor);

// GET /stories/feed
export const getStoryFeed = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const stories = await storyRepo().find({
      where: { isActive: true },
      relations: ["vendor", "author"],
      order: { createdAt: "DESC" },
    });

    const active = stories.filter((s) => new Date(s.expiresAt) > now);
    const userId = (req as any).user?.id as string | undefined;

    let viewedIds = new Set<string>();
    if (userId) {
      const views = await viewRepo().find({ where: { user: { id: userId } }, relations: ["story"] });
      viewedIds   = new Set(views.map((v) => v.story?.id).filter(Boolean) as string[]);
    }

    const vendorMap = new Map<string, { vendor: any; stories: Story[]; hasUnseen: boolean }>();
    for (const story of active) {
      const vId = story.vendor?.id;
      if (!vId) continue;
      if (!vendorMap.has(vId)) {
        vendorMap.set(vId, { vendor: story.vendor, stories: [], hasUnseen: false });
      }
      const group = vendorMap.get(vId)!;
      group.stories.push(story);
      if (!viewedIds.has(story.id)) group.hasUnseen = true;
    }

    res.json({ success: true, data: Array.from(vendorMap.values()) });
  } catch (err) {
    logger.error("getStoryFeed:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// GET /stories/vendor/:vendorId
export const getVendorStories = async (req: Request, res: Response) => {
  try {
    const vendorId = req.params.vendorId as string;
    const now = new Date();
    const stories = await storyRepo().find({
      where: { vendor: { id: vendorId }, isActive: true },
      order: { createdAt: "DESC" },
    });
    res.json({ success: true, data: stories.filter((s) => new Date(s.expiresAt) > now) });
  } catch (err) {
    logger.error("getVendorStories:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// GET /stories/my
export const getMyStories = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const vendor = await vendorRepo().findOne({ where: { user: { id: userId } } });
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });

    const stories = await storyRepo().find({
      where: { vendor: { id: vendor.id } },
      order: { createdAt: "DESC" },
    });
    res.json({ success: true, data: stories });
  } catch (err) {
    logger.error("getMyStories:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// POST /stories
export const createStory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const vendor = await vendorRepo().findOne({ where: { user: { id: userId } } });
    if (!vendor) return res.status(403).json({ success: false, message: "Vendor account required" });

    const file = (req as any).file || ((req as any).files as Express.Multer.File[])?.[0];
    if (!file) return res.status(400).json({ success: false, message: "Media file required" });

    const mediaUrl  = (file as any).path || (file as any).secure_url || "";
    const mediaType: "image" | "video" = file.mimetype.startsWith("video") ? "video" : "image";

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = storyRepo().create({
      mediaUrl,
      mediaType,
      caption:  req.body.caption || undefined,
      link:     req.body.link    || undefined,
      expiresAt,
      isActive: true,
      vendor:   { id: vendor.id } as any,
      author:   { id: userId }   as any,
    });

    const saved = await storyRepo().save(story);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    logger.error("createStory:", err);
    res.status(500).json({ success: false, message: "Failed to create story" });
  }
};

// POST /stories/:id/view
export const viewStory = async (req: Request, res: Response) => {
  try {
    const userId  = (req as any).user?.id as string | undefined;
    const storyId = req.params.id as string;

    const story = await storyRepo().findOne({ where: { id: storyId } });
    if (!story) return res.status(404).json({ success: false, message: "Story not found" });

    if (userId) {
      const already = await viewRepo().findOne({
        where: { user: { id: userId }, story: { id: storyId } },
      });
      if (!already) {
        await viewRepo().save({ user: { id: userId } as any, story: { id: storyId } as any });
        story.viewsCount += 1;
        await storyRepo().save(story);
      }
    }

    res.json({ success: true, viewsCount: story.viewsCount });
  } catch (err) {
    logger.error("viewStory:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// DELETE /stories/:id
export const deleteStory = async (req: Request, res: Response) => {
  try {
    const userId  = (req as any).user.id as string;
    const storyId = req.params.id as string;
    const story   = await storyRepo().findOne({ where: { id: storyId }, relations: ["vendor"] });
    if (!story) return res.status(404).json({ success: false, message: "Story not found" });

    const vendor = await vendorRepo().findOne({ where: { user: { id: userId } } });
    if (!vendor || vendor.id !== story.vendor?.id) {
      return res.status(403).json({ success: false, message: "Not authorised" });
    }

    await storyRepo().remove(story);
    res.json({ success: true, message: "Story deleted" });
  } catch (err) {
    logger.error("deleteStory:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

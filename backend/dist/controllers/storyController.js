"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStory = exports.viewStory = exports.createStory = exports.getMyStories = exports.getVendorStories = exports.getStoryFeed = void 0;
const database_1 = require("../config/database");
const Story_1 = require("../entities/Story");
const Vendor_1 = require("../entities/Vendor");
const logger_1 = require("../utils/logger");
const storyRepo = () => database_1.AppDataSource.getRepository(Story_1.Story);
const viewRepo = () => database_1.AppDataSource.getRepository(Story_1.StoryView);
const vendorRepo = () => database_1.AppDataSource.getRepository(Vendor_1.Vendor);
// GET /stories/feed
const getStoryFeed = async (req, res) => {
    try {
        const now = new Date();
        const stories = await storyRepo().find({
            where: { isActive: true },
            relations: ["vendor", "author"],
            order: { createdAt: "DESC" },
        });
        const active = stories.filter((s) => new Date(s.expiresAt) > now);
        const userId = req.user?.id;
        let viewedIds = new Set();
        if (userId) {
            const views = await viewRepo().find({ where: { user: { id: userId } }, relations: ["story"] });
            viewedIds = new Set(views.map((v) => v.story?.id).filter(Boolean));
        }
        const vendorMap = new Map();
        for (const story of active) {
            const vId = story.vendor?.id;
            if (!vId)
                continue;
            if (!vendorMap.has(vId)) {
                vendorMap.set(vId, { vendor: story.vendor, stories: [], hasUnseen: false });
            }
            const group = vendorMap.get(vId);
            group.stories.push(story);
            if (!viewedIds.has(story.id))
                group.hasUnseen = true;
        }
        res.json({ success: true, data: Array.from(vendorMap.values()) });
    }
    catch (err) {
        logger_1.logger.error("getStoryFeed:", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};
exports.getStoryFeed = getStoryFeed;
// GET /stories/vendor/:vendorId
const getVendorStories = async (req, res) => {
    try {
        const vendorId = req.params.vendorId;
        const now = new Date();
        const stories = await storyRepo().find({
            where: { vendor: { id: vendorId }, isActive: true },
            order: { createdAt: "DESC" },
        });
        res.json({ success: true, data: stories.filter((s) => new Date(s.expiresAt) > now) });
    }
    catch (err) {
        logger_1.logger.error("getVendorStories:", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};
exports.getVendorStories = getVendorStories;
// GET /stories/my
const getMyStories = async (req, res) => {
    try {
        const userId = req.user.id;
        const vendor = await vendorRepo().findOne({ where: { user: { id: userId } } });
        if (!vendor)
            return res.status(404).json({ success: false, message: "Vendor not found" });
        const stories = await storyRepo().find({
            where: { vendor: { id: vendor.id } },
            order: { createdAt: "DESC" },
        });
        res.json({ success: true, data: stories });
    }
    catch (err) {
        logger_1.logger.error("getMyStories:", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};
exports.getMyStories = getMyStories;
// POST /stories
const createStory = async (req, res) => {
    try {
        const userId = req.user.id;
        const vendor = await vendorRepo().findOne({ where: { user: { id: userId } } });
        if (!vendor)
            return res.status(403).json({ success: false, message: "Vendor account required" });
        const file = req.file || req.files?.[0];
        if (!file)
            return res.status(400).json({ success: false, message: "Media file required" });
        const mediaUrl = file.path || file.secure_url || "";
        const mediaType = file.mimetype.startsWith("video") ? "video" : "image";
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        const story = storyRepo().create({
            mediaUrl,
            mediaType,
            caption: req.body.caption || undefined,
            link: req.body.link || undefined,
            expiresAt,
            isActive: true,
            vendor: { id: vendor.id },
            author: { id: userId },
        });
        const saved = await storyRepo().save(story);
        res.status(201).json({ success: true, data: saved });
    }
    catch (err) {
        logger_1.logger.error("createStory:", err);
        res.status(500).json({ success: false, message: "Failed to create story" });
    }
};
exports.createStory = createStory;
// POST /stories/:id/view
const viewStory = async (req, res) => {
    try {
        const userId = req.user?.id;
        const storyId = req.params.id;
        const story = await storyRepo().findOne({ where: { id: storyId } });
        if (!story)
            return res.status(404).json({ success: false, message: "Story not found" });
        if (userId) {
            const already = await viewRepo().findOne({
                where: { user: { id: userId }, story: { id: storyId } },
            });
            if (!already) {
                await viewRepo().save({ user: { id: userId }, story: { id: storyId } });
                story.viewsCount += 1;
                await storyRepo().save(story);
            }
        }
        res.json({ success: true, viewsCount: story.viewsCount });
    }
    catch (err) {
        logger_1.logger.error("viewStory:", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};
exports.viewStory = viewStory;
// DELETE /stories/:id
const deleteStory = async (req, res) => {
    try {
        const userId = req.user.id;
        const storyId = req.params.id;
        const story = await storyRepo().findOne({ where: { id: storyId }, relations: ["vendor"] });
        if (!story)
            return res.status(404).json({ success: false, message: "Story not found" });
        const vendor = await vendorRepo().findOne({ where: { user: { id: userId } } });
        if (!vendor || vendor.id !== story.vendor?.id) {
            return res.status(403).json({ success: false, message: "Not authorised" });
        }
        await storyRepo().remove(story);
        res.json({ success: true, message: "Story deleted" });
    }
    catch (err) {
        logger_1.logger.error("deleteStory:", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};
exports.deleteStory = deleteStory;
//# sourceMappingURL=storyController.js.map
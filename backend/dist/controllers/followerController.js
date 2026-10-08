"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyFollowing = exports.getFollowers = exports.getFollowStatus = exports.toggleFollow = void 0;
const database_1 = require("../config/database");
const Follower_1 = require("../entities/Follower");
const Vendor_1 = require("../entities/Vendor");
const logger_1 = require("../utils/logger");
const followerRepo = () => database_1.AppDataSource.getRepository(Follower_1.Follower);
const vendorRepo = () => database_1.AppDataSource.getRepository(Vendor_1.Vendor);
// POST /followers/:vendorId/follow  — toggle follow
const toggleFollow = async (req, res) => {
    try {
        const userId = req.user.id;
        const vendorId = req.params.vendorId;
        const vendor = await vendorRepo().findOne({ where: { id: vendorId } });
        if (!vendor)
            return res.status(404).json({ success: false, message: "Vendor not found" });
        const existing = await followerRepo().findOne({
            where: { follower: { id: userId }, vendor: { id: vendorId } },
        });
        if (existing) {
            await followerRepo().remove(existing);
            const count = await followerRepo().count({ where: { vendor: { id: vendorId } } });
            return res.json({ success: true, following: false, followersCount: count, message: "Unfollowed" });
        }
        else {
            await followerRepo().save({
                follower: { id: userId },
                vendor: { id: vendorId },
            });
            const count = await followerRepo().count({ where: { vendor: { id: vendorId } } });
            return res.json({ success: true, following: true, followersCount: count, message: "Following" });
        }
    }
    catch (err) {
        logger_1.logger.error("toggleFollow:", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};
exports.toggleFollow = toggleFollow;
// GET /followers/:vendorId/count
const getFollowStatus = async (req, res) => {
    try {
        const userId = req.user?.id;
        const vendorId = req.params.vendorId;
        const count = await followerRepo().count({ where: { vendor: { id: vendorId } } });
        let following = false;
        if (userId) {
            const existing = await followerRepo().findOne({
                where: { follower: { id: userId }, vendor: { id: vendorId } },
            });
            following = !!existing;
        }
        res.json({ success: true, data: { following, followersCount: count } });
    }
    catch (err) {
        logger_1.logger.error("getFollowStatus:", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};
exports.getFollowStatus = getFollowStatus;
// GET /followers/:vendorId/list
const getFollowers = async (req, res) => {
    try {
        const vendorId = req.params.vendorId;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const [followers, total] = await followerRepo().findAndCount({
            where: { vendor: { id: vendorId } },
            relations: ["follower"],
            order: { createdAt: "DESC" },
            skip: (page - 1) * limit,
            take: limit,
        });
        res.json({ success: true, data: followers, meta: { total, page, pages: Math.ceil(total / limit) } });
    }
    catch (err) {
        logger_1.logger.error("getFollowers:", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};
exports.getFollowers = getFollowers;
// GET /followers/my/following
const getMyFollowing = async (req, res) => {
    try {
        const userId = req.user.id;
        const following = await followerRepo().find({
            where: { follower: { id: userId } },
            relations: ["vendor"],
            order: { createdAt: "DESC" },
        });
        res.json({ success: true, data: following.map((f) => f.vendor) });
    }
    catch (err) {
        logger_1.logger.error("getMyFollowing:", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};
exports.getMyFollowing = getMyFollowing;
//# sourceMappingURL=followerController.js.map
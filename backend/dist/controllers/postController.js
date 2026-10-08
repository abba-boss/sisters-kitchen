"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.addComment = exports.getComments = exports.toggleSave = exports.toggleLike = exports.deletePost = exports.updatePost = exports.createPost = exports.getPost = exports.getSavedPosts = exports.getMyPosts = exports.getVendorPosts = exports.getFeed = void 0;
const database_1 = require("../config/database");
const Post_1 = require("../entities/Post");
const Vendor_1 = require("../entities/Vendor");
const logger_1 = require("../utils/logger");
const postRepo = () => database_1.AppDataSource.getRepository(Post_1.Post);
const likeRepo = () => database_1.AppDataSource.getRepository(Post_1.PostLike);
const commentRepo = () => database_1.AppDataSource.getRepository(Post_1.PostComment);
const savedRepo = () => database_1.AppDataSource.getRepository(Post_1.SavedPost);
const mediaRepo = () => database_1.AppDataSource.getRepository(Post_1.PostMedia);
const vendorRepo = () => database_1.AppDataSource.getRepository(Vendor_1.Vendor);
// GET /posts/feed
const getFeed = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 30);
        const type = req.query.type;
        const search = req.query.search;
        const userId = req.user?.id;
        const qb = postRepo().createQueryBuilder("post")
            .leftJoinAndSelect("post.vendor", "vendor")
            .leftJoinAndSelect("post.author", "author")
            .leftJoinAndSelect("post.product", "product")
            .leftJoinAndSelect("post.media", "media")
            .where("post.status = :status", { status: Post_1.PostStatus.PUBLISHED })
            .orderBy("post.createdAt", "DESC")
            .skip((page - 1) * limit)
            .take(limit);
        if (type)
            qb.andWhere("post.type = :type", { type });
        if (search)
            qb.andWhere("(post.caption LIKE :s OR post.tags LIKE :s)", { s: `%${search}%` });
        const posts = await qb.getMany();
        let likedIds = new Set();
        let savedIds = new Set();
        if (userId) {
            const [liked, saved] = await Promise.all([
                likeRepo().find({ where: { user: { id: userId } }, relations: ["post"] }),
                savedRepo().find({ where: { user: { id: userId } }, relations: ["post"] }),
            ]);
            likedIds = new Set(liked.map((l) => l.post?.id).filter(Boolean));
            savedIds = new Set(saved.map((s) => s.post?.id).filter(Boolean));
        }
        const data = posts.map((p) => ({
            ...p,
            tags: p.tags ? tryParseArray(p.tags) : [],
            _liked: likedIds.has(p.id),
            _saved: savedIds.has(p.id),
        }));
        res.json({ success: true, data });
    }
    catch (err) {
        logger_1.logger.error("getFeed:", err);
        res.status(500).json({ success: false, message: "Failed to load feed" });
    }
};
exports.getFeed = getFeed;
// GET /posts/vendor/:vendorId
const getVendorPosts = async (req, res) => {
    try {
        const vendorId = req.params.vendorId;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 12, 30);
        const userId = req.user?.id;
        const posts = await postRepo().find({
            where: { vendor: { id: vendorId }, status: Post_1.PostStatus.PUBLISHED },
            relations: ["vendor", "author", "product", "media"],
            order: { createdAt: "DESC" },
            skip: (page - 1) * limit,
            take: limit,
        });
        let likedIds = new Set();
        if (userId) {
            const liked = await likeRepo().find({ where: { user: { id: userId } }, relations: ["post"] });
            likedIds = new Set(liked.map((l) => l.post?.id).filter(Boolean));
        }
        const data = posts.map((p) => ({
            ...p,
            tags: p.tags ? tryParseArray(p.tags) : [],
            _liked: likedIds.has(p.id),
        }));
        res.json({ success: true, data });
    }
    catch (err) {
        logger_1.logger.error("getVendorPosts:", err);
        res.status(500).json({ success: false, message: "Failed to load posts" });
    }
};
exports.getVendorPosts = getVendorPosts;
// GET /posts/my/posts
const getMyPosts = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const vendor = await vendorRepo().findOne({ where: { user: { id: userId } } });
        if (!vendor)
            return res.status(404).json({ success: false, message: "Vendor not found" });
        const posts = await postRepo().find({
            where: { vendor: { id: vendor.id } },
            relations: ["product", "media"],
            order: { createdAt: "DESC" },
            skip: (page - 1) * limit,
            take: limit,
        });
        const data = posts.map((p) => ({
            ...p,
            vendor: { id: vendor.id, businessName: vendor.businessName, logo: vendor.logo },
            tags: p.tags ? tryParseArray(p.tags) : [],
        }));
        res.json({ success: true, data });
    }
    catch (err) {
        logger_1.logger.error("getMyPosts:", err);
        res.status(500).json({ success: false, message: "Failed to load posts" });
    }
};
exports.getMyPosts = getMyPosts;
// GET /posts/saved/list
const getSavedPosts = async (req, res) => {
    try {
        const userId = req.user.id;
        const saved = await savedRepo().find({
            where: { user: { id: userId } },
            relations: ["post", "post.vendor", "post.media", "post.product"],
            order: { createdAt: "DESC" },
        });
        const data = saved.map((s) => s.post ? {
            ...s.post,
            tags: s.post.tags ? tryParseArray(s.post.tags) : [],
            _saved: true,
        } : null).filter(Boolean);
        res.json({ success: true, data });
    }
    catch (err) {
        logger_1.logger.error("getSavedPosts:", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};
exports.getSavedPosts = getSavedPosts;
// GET /posts/:id
const getPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await postRepo().findOne({
            where: { id: postId },
            relations: ["vendor", "author", "product", "media"],
        });
        if (!post)
            return res.status(404).json({ success: false, message: "Post not found" });
        const userId = req.user?.id;
        let _liked = false, _saved = false;
        if (userId) {
            const [like, save] = await Promise.all([
                likeRepo().findOne({ where: { user: { id: userId }, post: { id: postId } } }),
                savedRepo().findOne({ where: { user: { id: userId }, post: { id: postId } } }),
            ]);
            _liked = !!like;
            _saved = !!save;
        }
        res.json({ success: true, data: { ...post, tags: post.tags ? tryParseArray(post.tags) : [], _liked, _saved } });
    }
    catch (err) {
        logger_1.logger.error("getPost:", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};
exports.getPost = getPost;
// POST /posts
const createPost = async (req, res) => {
    try {
        const userId = req.user.id;
        const vendor = await vendorRepo().findOne({ where: { user: { id: userId } } });
        if (!vendor)
            return res.status(403).json({ success: false, message: "Vendor account required" });
        const { caption, type, tags, productId, location } = req.body;
        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
            }
            catch {
                parsedTags = String(tags).split(",").map((t) => t.trim()).filter(Boolean);
            }
        }
        const post = postRepo().create({
            caption,
            location,
            type: type || Post_1.PostType.IMAGE,
            status: Post_1.PostStatus.PUBLISHED,
            tags: parsedTags.length ? JSON.stringify(parsedTags) : undefined,
            vendor: { id: vendor.id },
            author: { id: userId },
            product: productId ? { id: productId } : undefined,
        });
        const saved = await postRepo().save(post);
        const files = req.files;
        if (files?.length) {
            const mediaItems = files.map((f, i) => mediaRepo().create({
                url: f.path || f.secure_url || "",
                type: f.mimetype.startsWith("video") ? "video" : "image",
                sortOrder: i,
                post: { id: saved.id },
            }));
            await mediaRepo().save(mediaItems);
        }
        const full = await postRepo().findOne({
            where: { id: saved.id },
            relations: ["vendor", "author", "product", "media"],
        });
        res.status(201).json({ success: true, data: full });
    }
    catch (err) {
        logger_1.logger.error("createPost:", err);
        res.status(500).json({ success: false, message: "Failed to create post" });
    }
};
exports.createPost = createPost;
// PUT /posts/:id
const updatePost = async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.id;
        const post = await postRepo().findOne({ where: { id: postId }, relations: ["vendor"] });
        if (!post)
            return res.status(404).json({ success: false, message: "Post not found" });
        const vendor = await vendorRepo().findOne({ where: { user: { id: userId } } });
        if (!vendor || vendor.id !== post.vendor?.id) {
            return res.status(403).json({ success: false, message: "Not authorised" });
        }
        const { caption, type, tags, location } = req.body;
        if (caption !== undefined)
            post.caption = caption;
        if (type !== undefined)
            post.type = type;
        if (location !== undefined)
            post.location = location;
        if (tags !== undefined) {
            let parsedTags = [];
            try {
                parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
            }
            catch {
                parsedTags = String(tags).split(",").map((t) => t.trim()).filter(Boolean);
            }
            post.tags = JSON.stringify(parsedTags);
        }
        await postRepo().save(post);
        res.json({ success: true, data: post });
    }
    catch (err) {
        logger_1.logger.error("updatePost:", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};
exports.updatePost = updatePost;
// DELETE /posts/:id
const deletePost = async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.id;
        const post = await postRepo().findOne({ where: { id: postId }, relations: ["vendor"] });
        if (!post)
            return res.status(404).json({ success: false, message: "Post not found" });
        const vendor = await vendorRepo().findOne({ where: { user: { id: userId } } });
        const isAdmin = req.user.role === "admin";
        if (!isAdmin && (!vendor || vendor.id !== post.vendor?.id)) {
            return res.status(403).json({ success: false, message: "Not authorised" });
        }
        await postRepo().remove(post);
        res.json({ success: true, message: "Post deleted" });
    }
    catch (err) {
        logger_1.logger.error("deletePost:", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};
exports.deletePost = deletePost;
// POST /posts/:id/like
const toggleLike = async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.id;
        const post = await postRepo().findOne({ where: { id: postId } });
        if (!post)
            return res.status(404).json({ success: false, message: "Post not found" });
        const existing = await likeRepo().findOne({
            where: { user: { id: userId }, post: { id: postId } },
        });
        if (existing) {
            await likeRepo().remove(existing);
            post.likesCount = Math.max(0, post.likesCount - 1);
            await postRepo().save(post);
            return res.json({ success: true, liked: false, likesCount: post.likesCount });
        }
        else {
            await likeRepo().save({ user: { id: userId }, post: { id: postId } });
            post.likesCount += 1;
            await postRepo().save(post);
            return res.json({ success: true, liked: true, likesCount: post.likesCount });
        }
    }
    catch (err) {
        logger_1.logger.error("toggleLike:", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};
exports.toggleLike = toggleLike;
// POST /posts/:id/save
const toggleSave = async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.id;
        const post = await postRepo().findOne({ where: { id: postId } });
        if (!post)
            return res.status(404).json({ success: false, message: "Post not found" });
        const existing = await savedRepo().findOne({
            where: { user: { id: userId }, post: { id: postId } },
        });
        if (existing) {
            await savedRepo().remove(existing);
            return res.json({ success: true, saved: false });
        }
        else {
            await savedRepo().save({ user: { id: userId }, post: { id: postId } });
            return res.json({ success: true, saved: true });
        }
    }
    catch (err) {
        logger_1.logger.error("toggleSave:", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};
exports.toggleSave = toggleSave;
// GET /posts/:id/comments
const getComments = async (req, res) => {
    try {
        const postId = req.params.id;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const comments = await commentRepo().find({
            where: { post: { id: postId }, isDeleted: false },
            relations: ["user", "replies", "replies.user"],
            order: { createdAt: "DESC" },
            take: limit,
        });
        // Only top-level comments (no parent)
        const topLevel = comments.filter((c) => !c.parent);
        res.json({ success: true, data: topLevel });
    }
    catch (err) {
        logger_1.logger.error("getComments:", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};
exports.getComments = getComments;
// POST /posts/:id/comments
const addComment = async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.id;
        const post = await postRepo().findOne({ where: { id: postId } });
        if (!post)
            return res.status(404).json({ success: false, message: "Post not found" });
        const { content, parentId } = req.body;
        if (!content?.trim())
            return res.status(400).json({ success: false, message: "Content required" });
        const comment = commentRepo().create({
            content: content.trim(),
            user: { id: userId },
            post: { id: postId },
            parent: parentId ? { id: parentId } : undefined,
        });
        const savedComment = await commentRepo().save(comment);
        post.commentsCount += 1;
        await postRepo().save(post);
        const full = await commentRepo().findOne({ where: { id: savedComment.id }, relations: ["user"] });
        res.status(201).json({ success: true, data: full });
    }
    catch (err) {
        logger_1.logger.error("addComment:", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};
exports.addComment = addComment;
// DELETE /posts/:id/comments/:commentId
const deleteComment = async (req, res) => {
    try {
        const userId = req.user.id;
        const commentId = req.params.commentId;
        const comment = await commentRepo().findOne({
            where: { id: commentId },
            relations: ["user", "post"],
        });
        if (!comment)
            return res.status(404).json({ success: false, message: "Comment not found" });
        if (comment.user?.id !== userId && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Not authorised" });
        }
        comment.isDeleted = true;
        comment.content = "[deleted]";
        await commentRepo().save(comment);
        if (comment.post?.id) {
            const post = await postRepo().findOne({ where: { id: comment.post.id } });
            if (post) {
                post.commentsCount = Math.max(0, post.commentsCount - 1);
                await postRepo().save(post);
            }
        }
        res.json({ success: true, message: "Comment deleted" });
    }
    catch (err) {
        logger_1.logger.error("deleteComment:", err);
        res.status(500).json({ success: false, message: "Failed" });
    }
};
exports.deleteComment = deleteComment;
function tryParseArray(val) {
    try {
        return JSON.parse(val);
    }
    catch {
        return val.split(",").map((s) => s.trim()).filter(Boolean);
    }
}
//# sourceMappingURL=postController.js.map
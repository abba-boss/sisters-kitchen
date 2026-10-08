import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Post, PostMedia, PostLike, PostComment, SavedPost, PostStatus, PostType } from "../entities/Post";
import { Vendor } from "../entities/Vendor";
import { logger } from "../utils/logger";

const postRepo    = () => AppDataSource.getRepository(Post);
const likeRepo    = () => AppDataSource.getRepository(PostLike);
const commentRepo = () => AppDataSource.getRepository(PostComment);
const savedRepo   = () => AppDataSource.getRepository(SavedPost);
const mediaRepo   = () => AppDataSource.getRepository(PostMedia);
const vendorRepo  = () => AppDataSource.getRepository(Vendor);

// GET /posts/feed
export const getFeed = async (req: Request, res: Response) => {
  try {
    const page   = parseInt(req.query.page as string) || 1;
    const limit  = Math.min(parseInt(req.query.limit as string) || 10, 30);
    const type   = req.query.type as string | undefined;
    const search = req.query.search as string | undefined;
    const userId = (req as any).user?.id as string | undefined;

    const qb = postRepo().createQueryBuilder("post")
      .leftJoinAndSelect("post.vendor",  "vendor")
      .leftJoinAndSelect("post.author",  "author")
      .leftJoinAndSelect("post.product", "product")
      .leftJoinAndSelect("post.media",   "media")
      .where("post.status = :status", { status: PostStatus.PUBLISHED })
      .orderBy("post.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (type)   qb.andWhere("post.type = :type", { type });
    if (search) qb.andWhere("(post.caption LIKE :s OR post.tags LIKE :s)", { s: `%${search}%` });

    const posts = await qb.getMany();

    let likedIds = new Set<string>();
    let savedIds = new Set<string>();
    if (userId) {
      const [liked, saved] = await Promise.all([
        likeRepo().find({ where: { user: { id: userId } }, relations: ["post"] }),
        savedRepo().find({ where: { user: { id: userId } }, relations: ["post"] }),
      ]);
      likedIds = new Set(liked.map((l) => l.post?.id).filter(Boolean) as string[]);
      savedIds = new Set(saved.map((s) => s.post?.id).filter(Boolean) as string[]);
    }

    const data = posts.map((p) => ({
      ...p,
      tags: p.tags ? tryParseArray(p.tags) : [],
      _liked: likedIds.has(p.id),
      _saved: savedIds.has(p.id),
    }));

    res.json({ success: true, data });
  } catch (err) {
    logger.error("getFeed:", err);
    res.status(500).json({ success: false, message: "Failed to load feed" });
  }
};

// GET /posts/vendor/:vendorId
export const getVendorPosts = async (req: Request, res: Response) => {
  try {
    const vendorId = req.params.vendorId as string;
    const page  = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 12, 30);
    const userId = (req as any).user?.id as string | undefined;

    const posts = await postRepo().find({
      where: { vendor: { id: vendorId }, status: PostStatus.PUBLISHED },
      relations: ["vendor", "author", "product", "media"],
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    let likedIds = new Set<string>();
    if (userId) {
      const liked = await likeRepo().find({ where: { user: { id: userId } }, relations: ["post"] });
      likedIds = new Set(liked.map((l) => l.post?.id).filter(Boolean) as string[]);
    }

    const data = posts.map((p) => ({
      ...p,
      tags: p.tags ? tryParseArray(p.tags) : [],
      _liked: likedIds.has(p.id),
    }));

    res.json({ success: true, data });
  } catch (err) {
    logger.error("getVendorPosts:", err);
    res.status(500).json({ success: false, message: "Failed to load posts" });
  }
};

// GET /posts/my/posts
export const getMyPosts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const page   = parseInt(req.query.page as string) || 1;
    const limit  = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const vendor = await vendorRepo().findOne({ where: { user: { id: userId } } });
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });

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
  } catch (err) {
    logger.error("getMyPosts:", err);
    res.status(500).json({ success: false, message: "Failed to load posts" });
  }
};

// GET /posts/saved/list
export const getSavedPosts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const saved  = await savedRepo().find({
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
  } catch (err) {
    logger.error("getSavedPosts:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// GET /posts/:id
export const getPost = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id as string;
    const post = await postRepo().findOne({
      where: { id: postId },
      relations: ["vendor", "author", "product", "media"],
    });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const userId = (req as any).user?.id as string | undefined;
    let _liked = false, _saved = false;
    if (userId) {
      const [like, save] = await Promise.all([
        likeRepo().findOne({ where: { user: { id: userId }, post: { id: postId } } }),
        savedRepo().findOne({ where: { user: { id: userId }, post: { id: postId } } }),
      ]);
      _liked = !!like; _saved = !!save;
    }

    res.json({ success: true, data: { ...post, tags: post.tags ? tryParseArray(post.tags) : [], _liked, _saved } });
  } catch (err) {
    logger.error("getPost:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// POST /posts
export const createPost = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const vendor = await vendorRepo().findOne({ where: { user: { id: userId } } });
    if (!vendor) return res.status(403).json({ success: false, message: "Vendor account required" });

    const { caption, type, tags, productId, location } = req.body;

    let parsedTags: string[] = [];
    if (tags) {
      try { parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags; }
      catch { parsedTags = String(tags).split(",").map((t: string) => t.trim()).filter(Boolean); }
    }

    const post = postRepo().create({
      caption,
      location,
      type:   (type as PostType) || PostType.IMAGE,
      status: PostStatus.PUBLISHED,
      tags:   parsedTags.length ? JSON.stringify(parsedTags) : undefined,
      vendor: { id: vendor.id } as any,
      author: { id: userId } as any,
      product: productId ? { id: productId } as any : undefined,
    });

    const saved = await postRepo().save(post);

    const files = (req as any).files as Express.Multer.File[] | undefined;
    if (files?.length) {
      const mediaItems = files.map((f, i) => mediaRepo().create({
        url:       (f as any).path || (f as any).secure_url || "",
        type:      f.mimetype.startsWith("video") ? "video" as const : "image" as const,
        sortOrder: i,
        post:      { id: saved.id } as any,
      }));
      await mediaRepo().save(mediaItems);
    }

    const full = await postRepo().findOne({
      where: { id: saved.id },
      relations: ["vendor", "author", "product", "media"],
    });
    res.status(201).json({ success: true, data: full });
  } catch (err) {
    logger.error("createPost:", err);
    res.status(500).json({ success: false, message: "Failed to create post" });
  }
};

// PUT /posts/:id
export const updatePost = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const postId = req.params.id as string;
    const post   = await postRepo().findOne({ where: { id: postId }, relations: ["vendor"] });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const vendor = await vendorRepo().findOne({ where: { user: { id: userId } } });
    if (!vendor || vendor.id !== post.vendor?.id) {
      return res.status(403).json({ success: false, message: "Not authorised" });
    }

    const { caption, type, tags, location } = req.body;
    if (caption  !== undefined) post.caption  = caption;
    if (type     !== undefined) post.type     = type;
    if (location !== undefined) post.location = location;
    if (tags !== undefined) {
      let parsedTags: string[] = [];
      try { parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags; }
      catch { parsedTags = String(tags).split(",").map((t: string) => t.trim()).filter(Boolean); }
      post.tags = JSON.stringify(parsedTags);
    }

    await postRepo().save(post);
    res.json({ success: true, data: post });
  } catch (err) {
    logger.error("updatePost:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// DELETE /posts/:id
export const deletePost = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const postId = req.params.id as string;
    const post   = await postRepo().findOne({ where: { id: postId }, relations: ["vendor"] });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const vendor  = await vendorRepo().findOne({ where: { user: { id: userId } } });
    const isAdmin = (req as any).user.role === "admin";
    if (!isAdmin && (!vendor || vendor.id !== post.vendor?.id)) {
      return res.status(403).json({ success: false, message: "Not authorised" });
    }

    await postRepo().remove(post);
    res.json({ success: true, message: "Post deleted" });
  } catch (err) {
    logger.error("deletePost:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// POST /posts/:id/like
export const toggleLike = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const postId = req.params.id as string;
    const post   = await postRepo().findOne({ where: { id: postId } });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const existing = await likeRepo().findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });

    if (existing) {
      await likeRepo().remove(existing);
      post.likesCount = Math.max(0, post.likesCount - 1);
      await postRepo().save(post);
      return res.json({ success: true, liked: false, likesCount: post.likesCount });
    } else {
      await likeRepo().save({ user: { id: userId } as any, post: { id: postId } as any });
      post.likesCount += 1;
      await postRepo().save(post);
      return res.json({ success: true, liked: true, likesCount: post.likesCount });
    }
  } catch (err) {
    logger.error("toggleLike:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// POST /posts/:id/save
export const toggleSave = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const postId = req.params.id as string;
    const post   = await postRepo().findOne({ where: { id: postId } });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const existing = await savedRepo().findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });

    if (existing) {
      await savedRepo().remove(existing);
      return res.json({ success: true, saved: false });
    } else {
      await savedRepo().save({ user: { id: userId } as any, post: { id: postId } as any });
      return res.json({ success: true, saved: true });
    }
  } catch (err) {
    logger.error("toggleSave:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// GET /posts/:id/comments
export const getComments = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id as string;
    const limit  = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const comments = await commentRepo().find({
      where: { post: { id: postId }, isDeleted: false },
      relations: ["user", "replies", "replies.user"],
      order: { createdAt: "DESC" },
      take: limit,
    });

    // Only top-level comments (no parent)
    const topLevel = comments.filter((c) => !c.parent);
    res.json({ success: true, data: topLevel });
  } catch (err) {
    logger.error("getComments:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// POST /posts/:id/comments
export const addComment = async (req: Request, res: Response) => {
  try {
    const userId  = (req as any).user.id as string;
    const postId  = req.params.id as string;
    const post    = await postRepo().findOne({ where: { id: postId } });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const { content, parentId } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: "Content required" });

    const comment = commentRepo().create({
      content: content.trim(),
      user:    { id: userId } as any,
      post:    { id: postId } as any,
      parent:  parentId ? { id: parentId } as any : undefined,
    });
    const savedComment = await commentRepo().save(comment);
    post.commentsCount += 1;
    await postRepo().save(post);

    const full = await commentRepo().findOne({ where: { id: savedComment.id }, relations: ["user"] });
    res.status(201).json({ success: true, data: full });
  } catch (err) {
    logger.error("addComment:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

// DELETE /posts/:id/comments/:commentId
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const userId    = (req as any).user.id as string;
    const commentId = req.params.commentId as string;
    const comment   = await commentRepo().findOne({
      where: { id: commentId },
      relations: ["user", "post"],
    });
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });
    if (comment.user?.id !== userId && (req as any).user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorised" });
    }

    comment.isDeleted = true;
    comment.content   = "[deleted]";
    await commentRepo().save(comment);

    if (comment.post?.id) {
      const post = await postRepo().findOne({ where: { id: comment.post.id } });
      if (post) { post.commentsCount = Math.max(0, post.commentsCount - 1); await postRepo().save(post); }
    }

    res.json({ success: true, message: "Comment deleted" });
  } catch (err) {
    logger.error("deleteComment:", err);
    res.status(500).json({ success: false, message: "Failed" });
  }
};

function tryParseArray(val: string): string[] {
  try { return JSON.parse(val); }
  catch { return val.split(",").map((s) => s.trim()).filter(Boolean); }
}

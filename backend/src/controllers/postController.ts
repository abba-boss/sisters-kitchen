import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Post, PostStatus, PostType } from "../entities/Post";
import { PostMedia, MediaType } from "../entities/PostMedia";
import { PostLike } from "../entities/PostLike";
import { PostComment } from "../entities/PostComment";
import { SavedPost } from "../entities/SavedPost";
import { Vendor } from "../entities/Vendor";
import { Product } from "../entities/Product";
import { Notification, NotificationType } from "../entities/Notification";
import { AuthRequest } from "../middleware/auth";
import { uploadToCloudinary } from "../utils/helpers";
import {
  emitNewPost,
  emitPostLike,
  emitPostComment,
  emitNotification,
} from "../config/socket";

// ─── helper: persist + push a notification ──────────────────────
async function pushNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  referenceId: string,
) {
  try {
    const { User } = await import("../entities/User");
    const userRepo = AppDataSource.getRepository(User);
    const notifRepo = AppDataSource.getRepository(Notification);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) return;
    const n = notifRepo.create({ user, title, message, type, referenceId });
    await notifRepo.save(n);
    emitNotification(userId, n);
  } catch {}
}

// ── CREATE POST ──────────────────────────────────────────────────
export const createPost = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const vendorRepo = AppDataSource.getRepository(Vendor);
    const vendor = await vendorRepo.findOne({
      where: { user: { id: req.user!.id } },
      relations: ["user"],
    });
    if (!vendor) {
      res
        .status(403)
        .json({ success: false, message: "Vendor profile required" });
      return;
    }

    const {
      caption,
      type = PostType.IMAGE,
      status = PostStatus.PUBLISHED,
      tags,
      location,
      productId,
      allowComments = true,
      scheduledAt,
    } = req.body;

    const postRepo = AppDataSource.getRepository(Post);
    const post = postRepo.create({
      caption: caption?.trim(),
      type,
      status,
      allowComments: allowComments !== "false",
      tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [],
      location: location?.trim(),
      vendor,
      author: req.user,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    });

    if (productId) {
      const productRepo = AppDataSource.getRepository(Product);
      const product = await productRepo.findOne({
        where: { id: productId, vendor: { id: vendor.id } },
      });
      if (product) post.product = product;
    }

    await postRepo.save(post);

    // Handle uploaded media files
    const files = req.files as Express.Multer.File[] | undefined;
    if (files && files.length > 0) {
      const mediaRepo = AppDataSource.getRepository(PostMedia);
      const mediaEntities: PostMedia[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideo = file.mimetype.startsWith("video/");
        const url = await uploadToCloudinary(
          file.path,
          `sisters-kitchen/posts/${vendor.id}`,
        );
        const m = mediaRepo.create({
          url,
          type: isVideo ? MediaType.VIDEO : MediaType.IMAGE,
          sortOrder: i,
          post,
        });
        mediaEntities.push(m);
      }
      await mediaRepo.save(mediaEntities);
      post.media = mediaEntities;
    }

    // Also accept pre-uploaded URLs from request body (for Cloudinary browser uploads)
    const mediaUrls: string[] = req.body.mediaUrls
      ? Array.isArray(req.body.mediaUrls)
        ? req.body.mediaUrls
        : JSON.parse(req.body.mediaUrls)
      : [];

    if (mediaUrls.length > 0) {
      const mediaRepo = AppDataSource.getRepository(PostMedia);
      const urlEntities = mediaUrls.map((url, i) =>
        mediaRepo.create({ url, type: MediaType.IMAGE, sortOrder: i, post }),
      );
      await mediaRepo.save(urlEntities);
      post.media = [...(post.media || []), ...urlEntities];
    }

    // Reload full post
    const fullPost = await postRepo.findOne({
      where: { id: post.id },
      relations: ["media", "vendor", "author", "product"],
    });

    // Emit to followers' feed rooms
    if (status === PostStatus.PUBLISHED) {
      emitNewPost(vendor.id, fullPost);
    }

    res
      .status(201)
      .json({ success: true, message: "Post created", data: fullPost });
  } catch (err: any) {
    console.error("createPost error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUBLIC FEED ──────────────────────────────────────────────────
export const getPublicFeed = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { page = 1, limit = 12, type, vendorId, tag, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const postRepo = AppDataSource.getRepository(Post);
    const qb = postRepo
      .createQueryBuilder("post")
      .leftJoinAndSelect("post.media", "media")
      .leftJoinAndSelect("post.vendor", "vendor")
      .leftJoinAndSelect("post.author", "author")
      .leftJoinAndSelect("post.product", "product")
      .where("post.status = :status", { status: PostStatus.PUBLISHED })
      .andWhere("vendor.status = 'approved'");

    if (type) qb.andWhere("post.type = :type", { type });
    if (vendorId) qb.andWhere("vendor.id = :vendorId", { vendorId });
    if (search) qb.andWhere("post.caption LIKE :s", { s: `%${search}%` });
    if (tag) qb.andWhere("post.tags LIKE :tag", { tag: `%${tag}%` });

    const [posts, total] = await qb
      .orderBy("post.createdAt", "DESC")
      .skip(skip)
      .take(Number(limit))
      .getManyAndCount();

    // Strip sensitive author fields
    const sanitized = posts.map((p) => ({
      ...p,
      author: p.author
        ? {
            id: p.author.id,
            firstName: p.author.firstName,
            lastName: p.author.lastName,
            avatar: p.author.avatar,
          }
        : null,
    }));

    res.json({
      success: true,
      data: sanitized,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── VENDOR POSTS ─────────────────────────────────────────────────
export const getVendorPosts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 12, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const postRepo = AppDataSource.getRepository(Post);
    const qb = postRepo
      .createQueryBuilder("post")
      .leftJoinAndSelect("post.media", "media")
      .leftJoinAndSelect("post.vendor", "vendor")
      .leftJoinAndSelect("post.author", "author")
      .leftJoinAndSelect("post.product", "product")
      .where("vendor.id = :vendorId", { vendorId });

    if (status) {
      qb.andWhere("post.status = :status", { status });
    } else {
      qb.andWhere("post.status = :status", { status: PostStatus.PUBLISHED });
    }

    const [posts, total] = await qb
      .orderBy("post.createdAt", "DESC")
      .skip(skip)
      .take(Number(limit))
      .getManyAndCount();

    res.json({
      success: true,
      data: posts,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── MY POSTS (Vendor) ────────────────────────────────────────────
export const getMyPosts = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { page = 1, limit = 12, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const vendorRepo = AppDataSource.getRepository(Vendor);
    const vendor = await vendorRepo.findOne({
      where: { user: { id: req.user!.id } },
    });
    if (!vendor) {
      res
        .status(403)
        .json({ success: false, message: "Vendor profile required" });
      return;
    }

    const postRepo = AppDataSource.getRepository(Post);
    const qb = postRepo
      .createQueryBuilder("post")
      .leftJoinAndSelect("post.media", "media")
      .leftJoinAndSelect("post.product", "product")
      .where("post.vendor = :vendorId", { vendorId: vendor.id });

    if (status) qb.andWhere("post.status = :status", { status });

    const [posts, total] = await qb
      .orderBy("post.createdAt", "DESC")
      .skip(skip)
      .take(Number(limit))
      .getManyAndCount();

    res.json({
      success: true,
      data: posts,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET SINGLE POST ──────────────────────────────────────────────
export const getPostById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const postRepo = AppDataSource.getRepository(Post);
    const post = await postRepo.findOne({
      where: { id: String(req.params.id), status: PostStatus.PUBLISHED },
      relations: ["media", "vendor", "author", "product"],
    });
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }
    // Increment views
    await postRepo.update(post.id, { viewsCount: () => "viewsCount + 1" });
    post.viewsCount += 1;

    res.json({ success: true, data: post });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── UPDATE POST ──────────────────────────────────────────────────
export const updatePost = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const postRepo = AppDataSource.getRepository(Post);
    const post = await postRepo.findOne({
      where: { id: String(req.params.id) },
      relations: ["vendor", "vendor.user"],
    });
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }
    if (post.vendor.user.id !== req.user!.id && req.user!.role !== "admin") {
      res.status(403).json({ success: false, message: "Not authorized" });
      return;
    }

    const {
      caption,
      type,
      status,
      tags,
      location,
      allowComments,
      scheduledAt,
    } = req.body;
    Object.assign(post, {
      caption: caption?.trim() ?? post.caption,
      type: type ?? post.type,
      status: status ?? post.status,
      tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : post.tags,
      location: location?.trim() ?? post.location,
      allowComments:
        allowComments !== undefined
          ? allowComments !== "false"
          : post.allowComments,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : post.scheduledAt,
    });

    await postRepo.save(post);
    res.json({ success: true, message: "Post updated", data: post });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE (soft) ────────────────────────────────────────────────
export const deletePost = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const postRepo = AppDataSource.getRepository(Post);
    const post = await postRepo.findOne({
      where: { id: String(req.params.id) },
      relations: ["vendor", "vendor.user"],
    });
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }
    if (post.vendor.user.id !== req.user!.id && req.user!.role !== "admin") {
      res.status(403).json({ success: false, message: "Not authorized" });
      return;
    }
    // Soft delete — set status to deleted
    post.status = PostStatus.DELETED;
    await postRepo.save(post);
    res.json({ success: true, message: "Post deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── LIKE / UNLIKE ────────────────────────────────────────────────
export const toggleLike = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const postRepo = AppDataSource.getRepository(Post);
    const likeRepo = AppDataSource.getRepository(PostLike);

    const post = await postRepo.findOne({
      where: { id: String(req.params.id), status: PostStatus.PUBLISHED },
      relations: ["vendor", "vendor.user"],
    });
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    const existing = await likeRepo.findOne({
      where: { user: { id: req.user!.id }, post: { id: post.id } },
    });

    if (existing) {
      await likeRepo.remove(existing);
      await postRepo.update(post.id, {
        likesCount: () => "GREATEST(likesCount - 1, 0)",
      });
      res.json({
        success: true,
        liked: false,
        likesCount: Math.max(post.likesCount - 1, 0),
      });
    } else {
      const like = likeRepo.create({ user: req.user, post });
      await likeRepo.save(like);
      await postRepo.update(post.id, { likesCount: () => "likesCount + 1" });

      // Notify post author (vendor owner) if different user
      if (post.vendor.user.id !== req.user!.id) {
        await pushNotification(
          post.vendor.user.id,
          "Someone liked your post ❤️",
          `${req.user!.firstName} liked your post`,
          NotificationType.NEW_POST_LIKE,
          post.id,
        );
        emitPostLike(post.vendor.user.id, {
          postId: post.id,
          userId: req.user!.id,
          firstName: req.user!.firstName,
        });
      }

      res.json({ success: true, liked: true, likesCount: post.likesCount + 1 });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── CHECK LIKE STATUS ────────────────────────────────────────────
export const getLikeStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const likeRepo = AppDataSource.getRepository(PostLike);
    const postRepo = AppDataSource.getRepository(Post);

    const post = await postRepo.findOne({
      where: { id: String(req.params.id) },
    });
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    const liked = !!(await likeRepo.findOne({
      where: {
        user: { id: req.user!.id },
        post: { id: String(req.params.id) },
      },
    }));

    res.json({ success: true, data: { liked, likesCount: post.likesCount } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── COMMENTS ─────────────────────────────────────────────────────
export const addComment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const postRepo = AppDataSource.getRepository(Post);
    const commentRepo = AppDataSource.getRepository(PostComment);

    const post = await postRepo.findOne({
      where: { id: String(req.params.id), status: PostStatus.PUBLISHED },
      relations: ["vendor", "vendor.user"],
    });
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }
    if (!post.allowComments) {
      res.status(400).json({
        success: false,
        message: "Comments are disabled for this post",
      });
      return;
    }

    const { content, parentId } = req.body;
    const comment = commentRepo.create({
      content: content.trim(),
      user: req.user,
      post,
    });

    if (parentId) {
      const parent = await commentRepo.findOne({
        where: { id: parentId, post: { id: post.id } },
      });
      if (parent) comment.parent = parent;
    }

    await commentRepo.save(comment);
    await postRepo.update(post.id, {
      commentsCount: () => "commentsCount + 1",
    });

    // Notify vendor
    if (post.vendor.user.id !== req.user!.id) {
      await pushNotification(
        post.vendor.user.id,
        "New comment on your post 💬",
        `${req.user!.firstName}: ${content.substring(0, 60)}`,
        NotificationType.NEW_POST_COMMENT,
        post.id,
      );
      emitPostComment(post.vendor.user.id, {
        postId: post.id,
        comment: {
          ...comment,
          user: { id: req.user!.id, firstName: req.user!.firstName },
        },
      });
    }

    const full = await commentRepo.findOne({
      where: { id: comment.id },
      relations: ["user", "parent"],
    });

    res
      .status(201)
      .json({ success: true, message: "Comment added", data: full });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getComments = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const commentRepo = AppDataSource.getRepository(PostComment);
    const [comments, total] = await commentRepo.findAndCount({
      where: {
        post: { id: String(req.params.id) },
        parent: undefined,
        isDeleted: false,
      },
      relations: ["user", "replies", "replies.user"],
      order: { createdAt: "DESC" },
      skip,
      take: Number(limit),
    });

    const sanitized = comments.map((c) => ({
      ...c,
      user: {
        id: c.user.id,
        firstName: c.user.firstName,
        lastName: c.user.lastName,
        avatar: c.user.avatar,
      },
      replies: (c.replies || [])
        .filter((r) => !r.isDeleted)
        .map((r) => ({
          ...r,
          user: {
            id: r.user.id,
            firstName: r.user.firstName,
            lastName: r.user.lastName,
            avatar: r.user.avatar,
          },
        })),
    }));

    res.json({
      success: true,
      data: sanitized,
      meta: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteComment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const commentRepo = AppDataSource.getRepository(PostComment);
    const comment = await commentRepo.findOne({
      where: { id: req.params.commentId as string },
      relations: ["user", "post", "post.vendor", "post.vendor.user"],
    });
    if (!comment) {
      res.status(404).json({ success: false, message: "Comment not found" });
      return;
    }

    const isOwner = comment.user.id === req.user!.id;
    const isVendor = comment.post.vendor.user.id === req.user!.id;
    const isAdmin = req.user!.role === "admin";

    if (!isOwner && !isVendor && !isAdmin) {
      res.status(403).json({ success: false, message: "Not authorized" });
      return;
    }

    comment.isDeleted = true;
    comment.content = "[deleted]";
    await commentRepo.save(comment);

    const postRepo = AppDataSource.getRepository(Post);
    await postRepo.update(comment.post.id, {
      commentsCount: () => "GREATEST(commentsCount - 1, 0)",
    });

    res.json({ success: true, message: "Comment deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── SAVE / UNSAVE POST ────────────────────────────────────────────
export const toggleSave = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const savedRepo = AppDataSource.getRepository(SavedPost);
    const postRepo = AppDataSource.getRepository(Post);

    const post = await postRepo.findOne({
      where: { id: String(req.params.id) },
    });
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    const existing = await savedRepo.findOne({
      where: { user: { id: req.user!.id }, post: { id: post.id } },
    });

    if (existing) {
      await savedRepo.remove(existing);
      res.json({
        success: true,
        saved: false,
        message: "Post removed from saved",
      });
    } else {
      const saved = savedRepo.create({ user: req.user, post });
      await savedRepo.save(saved);
      res.json({ success: true, saved: true, message: "Post saved" });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getSavedPosts = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const savedRepo = AppDataSource.getRepository(SavedPost);
    const [saved, total] = await savedRepo.findAndCount({
      where: { user: { id: req.user!.id } },
      relations: ["post", "post.media", "post.vendor"],
      order: { createdAt: "DESC" },
      skip,
      take: Number(limit),
    });

    res.json({
      success: true,
      data: saved.map((s) => s.post),
      meta: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

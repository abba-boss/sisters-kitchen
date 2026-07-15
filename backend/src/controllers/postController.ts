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
import { emitToUser } from "../config/socket";
import { MoreThan } from "typeorm";

async function notify(userId: string, title: string, message: string, type: NotificationType, refId: string) {
  try {
    const { User } = await import("../entities/User");
    const userRepo  = AppDataSource.getRepository(User);
    const notifRepo = AppDataSource.getRepository(Notification);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) return;
    const n = notifRepo.create({ user, title, message, type, referenceId: refId });
    await notifRepo.save(n);
    emitToUser(userId, "notification:new", n);
  } catch {}
}

// ── Public feed ──────────────────────────────────────────────
export const getPublicFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page=1, limit=12, type, vendorId, search, tag } = req.query;
    const skip = (Number(page)-1)*Number(limit);
    const qb = AppDataSource.getRepository(Post)
      .createQueryBuilder("post")
      .leftJoinAndSelect("post.vendor","vendor")
      .leftJoinAndSelect("post.author","author")
      .leftJoinAndSelect("post.product","product")
      .leftJoinAndSelect("post.media","media")
      .where("post.status = :s",{s:PostStatus.PUBLISHED})
      .andWhere("vendor.status = 'approved'");
    if (type)     qb.andWhere("post.type = :type",{type});
    if (vendorId) qb.andWhere("vendor.id = :vendorId",{vendorId});
    if (search)   qb.andWhere("post.caption LIKE :q",{q:`%${search}%`});
    if (tag)      qb.andWhere("post.tags LIKE :tag",{tag:`%${tag}%`});
    const [posts,total] = await qb.orderBy("post.createdAt","DESC").skip(skip).take(Number(limit)).getManyAndCount();
    const safe = posts.map(p=>({...p, author: p.author ? {id:p.author.id,firstName:p.author.firstName,lastName:p.author.lastName,avatar:p.author.avatar} : null }));
    res.json({success:true,data:safe,meta:{total,page:Number(page),limit:Number(limit),pages:Math.ceil(total/Number(limit))}});
  } catch(e:any){res.status(500).json({success:false,message:e.message});}
};

// ── Vendor posts (public) ────────────────────────────────────
export const getVendorPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page=1, limit=12, status } = req.query;
    const skip = (Number(page)-1)*Number(limit);
    const qb = AppDataSource.getRepository(Post)
      .createQueryBuilder("post")
      .leftJoinAndSelect("post.media","media")
      .leftJoinAndSelect("post.vendor","vendor")
      .leftJoinAndSelect("post.product","product")
      .where("vendor.id = :id",{id:req.params.vendorId as string});
    qb.andWhere("post.status = :s",{s: status || PostStatus.PUBLISHED});
    const [posts,total] = await qb.orderBy("post.createdAt","DESC").skip(skip).take(Number(limit)).getManyAndCount();
    res.json({success:true,data:posts,meta:{total,page:Number(page),limit:Number(limit),pages:Math.ceil(total/Number(limit))}});
  } catch(e:any){res.status(500).json({success:false,message:e.message});}
};

// ── My posts (vendor) ────────────────────────────────────────
export const getMyPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page=1, limit=12, status } = req.query;
    const skip = (Number(page)-1)*Number(limit);
    const vendor = await AppDataSource.getRepository(Vendor).findOne({where:{user:{id:req.user!.id}}});
    if (!vendor){res.status(403).json({success:false,message:"Vendor required"});return;}
    const qb = AppDataSource.getRepository(Post)
      .createQueryBuilder("post")
      .leftJoinAndSelect("post.media","media")
      .leftJoinAndSelect("post.product","product")
      .where("post.vendor = :vid",{vid:vendor.id});
    if (status) qb.andWhere("post.status = :s",{s:status});
    const [posts,total] = await qb.orderBy("post.createdAt","DESC").skip(skip).take(Number(limit)).getManyAndCount();
    res.json({success:true,data:posts,meta:{total,page:Number(page),limit:Number(limit)}});
  } catch(e:any){res.status(500).json({success:false,message:e.message});}
};

// ── Get single post ──────────────────────────────────────────
export const getPostById = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await AppDataSource.getRepository(Post).findOne({
      where:{id:req.params.id as string,status:PostStatus.PUBLISHED},
      relations:["media","vendor","author","product"],
    });
    if (!post){res.status(404).json({success:false,message:"Post not found"});return;}
    await AppDataSource.getRepository(Post).update(post.id,{viewsCount:()=>"viewsCount+1"});
    res.json({success:true,data:post});
  } catch(e:any){res.status(500).json({success:false,message:e.message});}
};

// ── Create post ──────────────────────────────────────────────
export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await AppDataSource.getRepository(Vendor).findOne({where:{user:{id:req.user!.id}},relations:["user"]});
    if (!vendor){res.status(403).json({success:false,message:"Vendor required"});return;}
    const {caption,type=PostType.IMAGE,status=PostStatus.PUBLISHED,tags,location,productId,allowComments=true,mediaUrls,scheduledAt} = req.body;
    const postRepo = AppDataSource.getRepository(Post);
    const post = postRepo.create({
      caption:caption?.trim(), type, status,
      allowComments:allowComments!=="false",
      tags:tags?(Array.isArray(tags)?tags:JSON.parse(tags)):[],
      location:location?.trim(),
      vendor, author:req.user,
      scheduledAt:scheduledAt?new Date(scheduledAt):undefined,
    });
    if (productId){
      const product = await AppDataSource.getRepository(Product).findOne({where:{id:productId,vendor:{id:vendor.id}}});
      if (product) post.product = product;
    }
    await postRepo.save(post);
    // Media
    const mediaRepo = AppDataSource.getRepository(PostMedia);
    const files = req.files as Express.Multer.File[]|undefined;
    if (files?.length){
      for(let i=0;i<files.length;i++){
        const url = await uploadToCloudinary(files[i].path,`sisters-kitchen/posts/${vendor.id}`);
        await mediaRepo.save(mediaRepo.create({url,type:files[i].mimetype.startsWith("video/")?MediaType.VIDEO:MediaType.IMAGE,sortOrder:i,post}));
      }
    }
    const urls:string[] = mediaUrls?(Array.isArray(mediaUrls)?mediaUrls:JSON.parse(mediaUrls)):[];
    for(let i=0;i<urls.length;i++) await mediaRepo.save(mediaRepo.create({url:urls[i],type:MediaType.IMAGE,sortOrder:i,post}));
    const full = await postRepo.findOne({where:{id:post.id},relations:["media","vendor","author","product"]});
    res.status(201).json({success:true,message:"Post created",data:full});
  } catch(e:any){console.error(e);res.status(500).json({success:false,message:e.message});}
};

// ── Update post ──────────────────────────────────────────────
export const updatePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postRepo = AppDataSource.getRepository(Post);
    const post = await postRepo.findOne({where:{id:req.params.id as string},relations:["vendor","vendor.user"]});
    if (!post){res.status(404).json({success:false,message:"Not found"});return;}
    if (post.vendor.user.id!==req.user!.id&&req.user!.role!=="admin"){res.status(403).json({success:false,message:"Forbidden"});return;}
    const {caption,type,status,tags,location,allowComments,scheduledAt}=req.body;
    Object.assign(post,{
      caption:caption?.trim()??post.caption,type:type??post.type,status:status??post.status,
      tags:tags?(Array.isArray(tags)?tags:JSON.parse(tags)):post.tags,
      location:location?.trim()??post.location,
      allowComments:allowComments!==undefined?allowComments!=="false":post.allowComments,
      scheduledAt:scheduledAt?new Date(scheduledAt):post.scheduledAt,
    });
    await postRepo.save(post);
    res.json({success:true,message:"Updated",data:post});
  } catch(e:any){res.status(500).json({success:false,message:e.message});}
};

// ── Delete (soft) ────────────────────────────────────────────
export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postRepo = AppDataSource.getRepository(Post);
    const post = await postRepo.findOne({where:{id:req.params.id as string},relations:["vendor","vendor.user"]});
    if (!post){res.status(404).json({success:false,message:"Not found"});return;}
    if (post.vendor.user.id!==req.user!.id&&req.user!.role!=="admin"){res.status(403).json({success:false,message:"Forbidden"});return;}
    post.status = "deleted" as any;
    await postRepo.save(post);
    res.json({success:true,message:"Deleted"});
  } catch(e:any){res.status(500).json({success:false,message:e.message});}
};

// ── Toggle like ──────────────────────────────────────────────
export const toggleLike = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postRepo = AppDataSource.getRepository(Post);
    const likeRepo = AppDataSource.getRepository(PostLike);
    const post = await postRepo.findOne({where:{id:req.params.id as string,status:PostStatus.PUBLISHED},relations:["vendor","vendor.user"]});
    if (!post){res.status(404).json({success:false,message:"Not found"});return;}
    const existing = await likeRepo.findOne({where:{user:{id:req.user!.id},post:{id:post.id}}});
    if (existing){
      await likeRepo.remove(existing);
      await postRepo.update(post.id,{likesCount:()=>"GREATEST(likesCount-1,0)"});
      res.json({success:true,liked:false,likesCount:Math.max(post.likesCount-1,0)});
    } else {
      await likeRepo.save(likeRepo.create({user:req.user,post}));
      await postRepo.update(post.id,{likesCount:()=>"likesCount+1"});
      if (post.vendor.user.id!==req.user!.id)
        await notify(post.vendor.user.id,"Someone liked your post ❤️",`${req.user!.firstName} liked your post`,NotificationType.NEW_POST_LIKE,post.id);
      res.json({success:true,liked:true,likesCount:post.likesCount+1});
    }
  } catch(e:any){res.status(500).json({success:false,message:e.message});}
};

// ── Like status ──────────────────────────────────────────────
export const getLikeStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const post = await AppDataSource.getRepository(Post).findOne({where:{id:req.params.id as string}});
    if (!post){res.status(404).json({success:false,message:"Not found"});return;}
    const liked = !!(await AppDataSource.getRepository(PostLike).findOne({where:{user:{id:req.user!.id},post:{id:post.id}}}));
    res.json({success:true,data:{liked,likesCount:post.likesCount}});
  } catch(e:any){res.status(500).json({success:false,message:e.message});}
};

// ── Add comment ──────────────────────────────────────────────
export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postRepo    = AppDataSource.getRepository(Post);
    const commentRepo = AppDataSource.getRepository(PostComment);
    const post = await postRepo.findOne({where:{id:req.params.id as string,status:PostStatus.PUBLISHED},relations:["vendor","vendor.user"]});
    if (!post){res.status(404).json({success:false,message:"Not found"});return;}
    if (!post.allowComments){res.status(400).json({success:false,message:"Comments disabled"});return;}
    const {content,parentId}=req.body;
    const comment = commentRepo.create({content:content.trim(),user:req.user,post});
    if (parentId){const parent=await commentRepo.findOne({where:{id:parentId,post:{id:post.id}}});if(parent)comment.parent=parent;}
    await commentRepo.save(comment);
    await postRepo.update(post.id,{commentsCount:()=>"commentsCount+1"});
    if (post.vendor.user.id!==req.user!.id)
      await notify(post.vendor.user.id,"New comment 💬",`${req.user!.firstName}: ${content.substring(0,60)}`,NotificationType.NEW_POST_COMMENT,post.id);
    const full = await commentRepo.findOne({where:{id:comment.id},relations:["user","parent"]});
    res.status(201).json({success:true,data:full});
  } catch(e:any){res.status(500).json({success:false,message:e.message});}
};

// ── Get comments ─────────────────────────────────────────────
export const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const {page=1,limit=20}=req.query;
    const skip=(Number(page)-1)*Number(limit);
    const commentRepo=AppDataSource.getRepository(PostComment);
    const [comments,total]=await commentRepo.findAndCount({
      where:{post:{id:req.params.id as string},parent:undefined as any,isDeleted:false},
      relations:["user","replies","replies.user"],
      order:{createdAt:"DESC"},skip,take:Number(limit),
    });
    const safe=comments.map(c=>({...c,
      user:{id:c.user.id,firstName:c.user.firstName,lastName:c.user.lastName,avatar:c.user.avatar},
      replies:(c.replies||[]).filter(r=>!r.isDeleted).map(r=>({...r,
        user:{id:r.user.id,firstName:r.user.firstName,lastName:r.user.lastName,avatar:r.user.avatar}
      })),
    }));
    res.json({success:true,data:safe,meta:{total,page:Number(page),limit:Number(limit)}});
  } catch(e:any){res.status(500).json({success:false,message:e.message});}
};

// ── Delete comment ────────────────────────────────────────────
export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const commentRepo=AppDataSource.getRepository(PostComment);
    const comment=await commentRepo.findOne({where:{id:req.params.commentId as string},relations:["user","post","post.vendor","post.vendor.user"]});
    if (!comment){res.status(404).json({success:false,message:"Not found"});return;}
    if (comment.user.id!==req.user!.id&&comment.post.vendor.user.id!==req.user!.id&&req.user!.role!=="admin"){res.status(403).json({success:false,message:"Forbidden"});return;}
    comment.isDeleted=true; comment.content="[deleted]";
    await commentRepo.save(comment);
    await AppDataSource.getRepository(Post).update(comment.post.id,{commentsCount:()=>"GREATEST(commentsCount-1,0)"});
    res.json({success:true,message:"Deleted"});
  } catch(e:any){res.status(500).json({success:false,message:e.message});}
};

// ── Save/unsave ──────────────────────────────────────────────
export const toggleSave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const savedRepo=AppDataSource.getRepository(SavedPost);
    const post=await AppDataSource.getRepository(Post).findOne({where:{id:req.params.id as string}});
    if (!post){res.status(404).json({success:false,message:"Not found"});return;}
    const existing=await savedRepo.findOne({where:{user:{id:req.user!.id},post:{id:post.id}}});
    if (existing){await savedRepo.remove(existing);res.json({success:true,saved:false,message:"Removed"});}
    else{await savedRepo.save(savedRepo.create({user:req.user,post}));res.json({success:true,saved:true,message:"Saved"});}
  } catch(e:any){res.status(500).json({success:false,message:e.message});}
};

// ── Saved list ────────────────────────────────────────────────
export const getSavedPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {page=1,limit=12}=req.query;
    const skip=(Number(page)-1)*Number(limit);
    const [saved,total]=await AppDataSource.getRepository(SavedPost).findAndCount({
      where:{user:{id:req.user!.id}},relations:["post","post.media","post.vendor"],
      order:{createdAt:"DESC"},skip,take:Number(limit),
    });
    res.json({success:true,data:saved.map(s=>s.post),meta:{total,page:Number(page),limit:Number(limit)}});
  } catch(e:any){res.status(500).json({success:false,message:e.message});}
};

import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Follower } from "../entities/Follower";
import { Vendor }   from "../entities/Vendor";
import { Notification, NotificationType } from "../entities/Notification";
import { AuthRequest } from "../middleware/auth";
import { emitToUser }  from "../config/socket";

export const toggleFollow = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendorId = req.params.vendorId as string;
    const vendor = await AppDataSource.getRepository(Vendor).findOne({where:{id:vendorId},relations:["user"]});
    if (!vendor){res.status(404).json({success:false,message:"Vendor not found"});return;}
    if (vendor.user.id===req.user!.id){res.status(400).json({success:false,message:"Cannot follow own store"});return;}
    const followerRepo=AppDataSource.getRepository(Follower);
    const existing=await followerRepo.findOne({where:{follower:{id:req.user!.id},vendor:{id:vendorId}}});
    if (existing){
      await followerRepo.remove(existing);
      res.json({success:true,following:false,message:"Unfollowed"});
    } else {
      await followerRepo.save(followerRepo.create({follower:req.user,vendor}));
      const notifRepo=AppDataSource.getRepository(Notification);
      const n=notifRepo.create({user:vendor.user,title:"New Follower! 🎉",message:`${req.user!.firstName} started following ${vendor.businessName}`,type:NotificationType.NEW_FOLLOWER,referenceId:vendor.id});
      await notifRepo.save(n);
      emitToUser(vendor.user.id,"notification:new",n);
      emitToUser(vendor.user.id,"vendor:new_follower",{vendorId:vendor.id,follower:{id:req.user!.id,firstName:req.user!.firstName,lastName:req.user!.lastName,avatar:req.user!.avatar}});
      res.json({success:true,following:true,message:"Now following"});
    }
  } catch(e:any){res.status(500).json({success:false,message:e.message});}
};

export const getVendorFollowers = async (req: Request, res: Response): Promise<void> => {
  try {
    const vendorId=req.params.vendorId as string;
    const {page=1,limit=20}=req.query;
    const skip=(Number(page)-1)*Number(limit);
    const [rows,total]=await AppDataSource.getRepository(Follower).findAndCount({
      where:{vendor:{id:vendorId}},relations:["follower"],order:{createdAt:"DESC"},skip,take:Number(limit),
    });
    res.json({success:true,data:rows.map(f=>({id:f.id,createdAt:f.createdAt,user:{id:f.follower.id,firstName:f.follower.firstName,lastName:f.follower.lastName,avatar:f.follower.avatar}})),meta:{total,page:Number(page),limit:Number(limit)}});
  } catch(e:any){res.status(500).json({success:false,message:e.message});}
};

export const getFollowing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rows=await AppDataSource.getRepository(Follower).find({where:{follower:{id:req.user!.id}},relations:["vendor"],order:{createdAt:"DESC"}});
    res.json({success:true,data:rows.map(f=>f.vendor)});
  } catch(e:any){res.status(500).json({success:false,message:e.message});}
};

export const checkFollowStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendorId=req.params.vendorId as string;
    const [following,count]=await Promise.all([
      AppDataSource.getRepository(Follower).findOne({where:{follower:{id:req.user!.id},vendor:{id:vendorId}}}),
      AppDataSource.getRepository(Follower).count({where:{vendor:{id:vendorId}}}),
    ]);
    res.json({success:true,data:{following:!!following,followersCount:count}});
  } catch(e:any){res.status(500).json({success:false,message:e.message});}
};

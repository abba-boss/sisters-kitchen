import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Notification } from "../entities/Notification";
import { AuthRequest } from "../middleware/auth";

export const getMyNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifRepo = AppDataSource.getRepository(Notification);
    const notifications = await notifRepo.find({
      where: { user: { id: req.user!.id } },
      order: { createdAt: "DESC" },
      take: 50,
    });
    res.json({ success: true, data: notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifRepo = AppDataSource.getRepository(Notification);
    await notifRepo.update(
      { id: String(req.params.id), user: { id: req.user!.id } },
      { isRead: true }
    );
    res.json({ success: true, message: "Marked as read" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifRepo = AppDataSource.getRepository(Notification);
    await notifRepo.update({ user: { id: req.user!.id }, isRead: false }, { isRead: true });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifRepo = AppDataSource.getRepository(Notification);
    await notifRepo.delete({ id: String(req.params.id), user: { id: req.user!.id } });
    res.json({ success: true, message: "Notification deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

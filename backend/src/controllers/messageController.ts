import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Message, MessageType } from "../entities/Message";
import { User, UserRole } from "../entities/User";
import { Vendor } from "../entities/Vendor";
import { AuthRequest } from "../middleware/auth";
import { emitMessage, emitUnreadCount } from "../config/socket";

// ─── Send Message ────────────────────────────────────────────────
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { receiverId, content, vendorId } = req.body;
    const senderId = req.user!.id;

    if (!receiverId || !content?.trim()) {
      res.status(400).json({ success: false, message: "Receiver and content are required" });
      return;
    }

    const userRepo = AppDataSource.getRepository(User);
    const messageRepo = AppDataSource.getRepository(Message);

    // Get sender and receiver
    const sender = await userRepo.findOne({ where: { id: senderId } });
    const receiver = await userRepo.findOne({ where: { id: receiverId } });

    if (!sender || !receiver) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Only allow messaging between vendors and admins
    if (sender.role === UserRole.CUSTOMER || receiver.role === UserRole.CUSTOMER) {
      res.status(403).json({ 
        success: false, 
        message: "Customer messaging is not supported. Messages are only allowed between vendors and admins." 
      });
      return;
    }

    // Determine message type based on roles
    let messageType: MessageType;
    let messageVendorId: string | null = null;

    if (sender.role === UserRole.VENDOR && receiver.role === UserRole.ADMIN) {
      messageType = MessageType.VENDOR_TO_ADMIN;
      // Get vendor ID for the sender
      const vendorRepo = AppDataSource.getRepository(Vendor);
      const vendor = await vendorRepo.findOne({ where: { user: { id: senderId } } });
      if (vendor) {
        messageVendorId = vendor.id;
      }
    } else if (sender.role === UserRole.ADMIN && receiver.role === UserRole.VENDOR) {
      messageType = MessageType.ADMIN_TO_VENDOR;
      messageVendorId = vendorId || null;
    } else {
      res.status(403).json({ 
        success: false, 
        message: "Messages are only allowed between vendors and admins" 
      });
      return;
    }

    // Create message
    const message = messageRepo.create({
      type: messageType,
      content: content.trim(),
      sender,
      senderId,
      receiver,
      receiverId,
      vendorId: messageVendorId,
      isRead: false,
    });

    await messageRepo.save(message);

    // Load relations for response
    const savedMessage = await messageRepo.findOne({
      where: { id: message.id },
      relations: ["sender", "receiver", "vendor"],
    });

    // Send real-time notification via Socket.IO
    emitMessage(receiverId, savedMessage);

    // Also emit unread count update
    const unreadCount = await messageRepo.count({
      where: { receiverId, isRead: false },
    });
    emitUnreadCount(receiverId, unreadCount);

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: savedMessage,
    });
  } catch (error: any) {
    console.error("Send message error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Conversations ───────────────────────────────────────────
export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const messageRepo = AppDataSource.getRepository(Message);

    let conversations: any[] = [];

    if (userRole === UserRole.ADMIN) {
      // Admin: Get all vendors they've messaged with
      const messages = await messageRepo
        .createQueryBuilder("message")
        .leftJoinAndSelect("message.sender", "sender")
        .leftJoinAndSelect("message.receiver", "receiver")
        .leftJoinAndSelect("message.vendor", "vendor")
        .leftJoinAndSelect("vendor.user", "vendorUser")
        .where("message.senderId = :userId OR message.receiverId = :userId", { userId })
        .orderBy("message.createdAt", "DESC")
        .getMany();

      // Group by vendor
      const vendorMap = new Map();
      
      for (const msg of messages) {
        const vendorId = msg.vendorId;
        if (!vendorId) continue;

        if (!vendorMap.has(vendorId)) {
          const unreadCount = await messageRepo.count({
            where: {
              receiverId: userId,
              vendorId,
              isRead: false,
            },
          });

          vendorMap.set(vendorId, {
            vendorId,
            vendor: msg.vendor,
            lastMessage: msg,
            unreadCount,
          });
        }
      }

      conversations = Array.from(vendorMap.values());
    } else if (userRole === UserRole.VENDOR) {
      // Vendor: Get conversation with admin
      const vendorRepo = AppDataSource.getRepository(Vendor);
      const vendor = await vendorRepo.findOne({ where: { user: { id: userId } } });

      if (!vendor) {
        res.status(404).json({ success: false, message: "Vendor not found" });
        return;
      }

      // Get admin users
      const userRepo = AppDataSource.getRepository(User);
      const admins = await userRepo.find({ where: { role: UserRole.ADMIN } });

      // For now, get the first admin as the default admin
      const admin = admins[0];

      if (admin) {
        // Get last message with this admin
        const lastMessage = await messageRepo
          .createQueryBuilder("message")
          .leftJoinAndSelect("message.sender", "sender")
          .leftJoinAndSelect("message.receiver", "receiver")
          .where(
            "(message.senderId = :userId AND message.receiverId = :adminId) OR (message.senderId = :adminId AND message.receiverId = :userId)",
            { userId, adminId: admin.id }
          )
          .orderBy("message.createdAt", "DESC")
          .getOne();

        // Get unread count
        const unreadCount = await messageRepo.count({
          where: {
            receiverId: userId,
            senderId: admin.id,
            isRead: false,
          },
        });

        conversations = [
          {
            adminId: admin.id,
            admin,
            lastMessage,
            unreadCount,
          },
        ];
      }
    }

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error: any) {
    console.error("Get conversations error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Messages with User ──────────────────────────────────────
export const getMessagesWithUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const otherUserId = req.params.otherUserId as string;
    const { page = 1, limit = 50 } = req.query;

    const messageRepo = AppDataSource.getRepository(Message);

    const messages = await messageRepo
      .createQueryBuilder("message")
      .leftJoinAndSelect("message.sender", "sender")
      .leftJoinAndSelect("message.receiver", "receiver")
      .where(
        "(message.senderId = :userId AND message.receiverId = :otherUserId) OR (message.senderId = :otherUserId AND message.receiverId = :userId)",
        { userId, otherUserId }
      )
      .orderBy("message.createdAt", "ASC")
      .skip((Number(page) - 1) * Number(limit))
      .take(Number(limit))
      .getMany();

    res.json({
      success: true,
      data: messages,
    });
  } catch (error: any) {
    console.error("Get messages error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Mark Messages as Read ───────────────────────────────────────
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      res.status(400).json({ success: false, message: "Other user ID is required" });
      return;
    }

    const messageRepo = AppDataSource.getRepository(Message);

    // Mark all unread messages from otherUserId to userId as read
    await messageRepo
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where("receiverId = :userId AND senderId = :otherUserId AND isRead = false", {
        userId,
        otherUserId,
      })
      .execute();

    // Get updated unread count
    const unreadCount = await messageRepo.count({
      where: { receiverId: userId, isRead: false },
    });

    // Emit unread count update via socket
    emitUnreadCount(userId, unreadCount);

    res.json({
      success: true,
      message: "Messages marked as read",
      data: { unreadCount },
    });
  } catch (error: any) {
    console.error("Mark as read error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Unread Count ────────────────────────────────────────────
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const messageRepo = AppDataSource.getRepository(Message);

    const count = await messageRepo.count({
      where: { receiverId: userId, isRead: false },
    });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error: any) {
    console.error("Get unread count error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Delete Message ──────────────────────────────────────────────
export const deleteMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const messageId = parseInt(req.params.messageId as string);

    const messageRepo = AppDataSource.getRepository(Message);

    const message = await messageRepo.findOne({
      where: { id: messageId },
    });

    if (!message) {
      res.status(404).json({ success: false, message: "Message not found" });
      return;
    }

    // Only sender can delete their own messages
    if (message.senderId !== userId) {
      res.status(403).json({ success: false, message: "Not authorized to delete this message" });
      return;
    }

    await messageRepo.remove(message);

    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete message error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

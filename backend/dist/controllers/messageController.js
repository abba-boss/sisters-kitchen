"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessage = exports.getUnreadCount = exports.markAsRead = exports.getMessagesWithUser = exports.getConversations = exports.sendMessage = void 0;
const database_1 = require("../config/database");
const Message_1 = require("../entities/Message");
const User_1 = require("../entities/User");
const Vendor_1 = require("../entities/Vendor");
const socket_1 = require("../config/socket");
// ─── Send Message ────────────────────────────────────────────────
const sendMessage = async (req, res) => {
    try {
        const { receiverId, content, vendorId } = req.body;
        const senderId = req.user.id;
        if (!receiverId || !content?.trim()) {
            res.status(400).json({ success: false, message: "Receiver and content are required" });
            return;
        }
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const messageRepo = database_1.AppDataSource.getRepository(Message_1.Message);
        // Get sender and receiver
        const sender = await userRepo.findOne({ where: { id: senderId } });
        const receiver = await userRepo.findOne({ where: { id: receiverId } });
        if (!sender || !receiver) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        // Only allow messaging between vendors and admins
        if (sender.role === User_1.UserRole.CUSTOMER || receiver.role === User_1.UserRole.CUSTOMER) {
            res.status(403).json({
                success: false,
                message: "Customer messaging is not supported. Messages are only allowed between vendors and admins."
            });
            return;
        }
        // Determine message type based on roles
        let messageType;
        let messageVendorId = null;
        if (sender.role === User_1.UserRole.VENDOR && receiver.role === User_1.UserRole.ADMIN) {
            messageType = Message_1.MessageType.VENDOR_TO_ADMIN;
            // Get vendor ID for the sender
            const vendorRepo = database_1.AppDataSource.getRepository(Vendor_1.Vendor);
            const vendor = await vendorRepo.findOne({ where: { user: { id: senderId } } });
            if (vendor) {
                messageVendorId = vendor.id;
            }
        }
        else if (sender.role === User_1.UserRole.ADMIN && receiver.role === User_1.UserRole.VENDOR) {
            messageType = Message_1.MessageType.ADMIN_TO_VENDOR;
            messageVendorId = vendorId || null;
        }
        else {
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
        (0, socket_1.emitMessage)(receiverId, savedMessage);
        // Also emit unread count update
        const unreadCount = await messageRepo.count({
            where: { receiverId, isRead: false },
        });
        (0, socket_1.emitUnreadCount)(receiverId, unreadCount);
        res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: savedMessage,
        });
    }
    catch (error) {
        console.error("Send message error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.sendMessage = sendMessage;
// ─── Get Conversations ───────────────────────────────────────────
const getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const messageRepo = database_1.AppDataSource.getRepository(Message_1.Message);
        let conversations = [];
        if (userRole === User_1.UserRole.ADMIN) {
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
                if (!vendorId)
                    continue;
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
        }
        else if (userRole === User_1.UserRole.VENDOR) {
            // Vendor: Get conversation with admin
            const vendorRepo = database_1.AppDataSource.getRepository(Vendor_1.Vendor);
            const vendor = await vendorRepo.findOne({ where: { user: { id: userId } } });
            if (!vendor) {
                res.status(404).json({ success: false, message: "Vendor not found" });
                return;
            }
            // Get admin users
            const userRepo = database_1.AppDataSource.getRepository(User_1.User);
            const admins = await userRepo.find({ where: { role: User_1.UserRole.ADMIN } });
            // For now, get the first admin as the default admin
            const admin = admins[0];
            if (admin) {
                // Get last message with this admin
                const lastMessage = await messageRepo
                    .createQueryBuilder("message")
                    .leftJoinAndSelect("message.sender", "sender")
                    .leftJoinAndSelect("message.receiver", "receiver")
                    .where("(message.senderId = :userId AND message.receiverId = :adminId) OR (message.senderId = :adminId AND message.receiverId = :userId)", { userId, adminId: admin.id })
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
    }
    catch (error) {
        console.error("Get conversations error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getConversations = getConversations;
// ─── Get Messages with User ──────────────────────────────────────
const getMessagesWithUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const otherUserId = req.params.otherUserId;
        const { page = 1, limit = 50 } = req.query;
        const messageRepo = database_1.AppDataSource.getRepository(Message_1.Message);
        const messages = await messageRepo
            .createQueryBuilder("message")
            .leftJoinAndSelect("message.sender", "sender")
            .leftJoinAndSelect("message.receiver", "receiver")
            .where("(message.senderId = :userId AND message.receiverId = :otherUserId) OR (message.senderId = :otherUserId AND message.receiverId = :userId)", { userId, otherUserId })
            .orderBy("message.createdAt", "ASC")
            .skip((Number(page) - 1) * Number(limit))
            .take(Number(limit))
            .getMany();
        res.json({
            success: true,
            data: messages,
        });
    }
    catch (error) {
        console.error("Get messages error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMessagesWithUser = getMessagesWithUser;
// ─── Mark Messages as Read ───────────────────────────────────────
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherUserId } = req.body;
        if (!otherUserId) {
            res.status(400).json({ success: false, message: "Other user ID is required" });
            return;
        }
        const messageRepo = database_1.AppDataSource.getRepository(Message_1.Message);
        // Mark all unread messages from otherUserId to userId as read
        await messageRepo
            .createQueryBuilder()
            .update(Message_1.Message)
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
        (0, socket_1.emitUnreadCount)(userId, unreadCount);
        res.json({
            success: true,
            message: "Messages marked as read",
            data: { unreadCount },
        });
    }
    catch (error) {
        console.error("Mark as read error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.markAsRead = markAsRead;
// ─── Get Unread Count ────────────────────────────────────────────
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const messageRepo = database_1.AppDataSource.getRepository(Message_1.Message);
        const count = await messageRepo.count({
            where: { receiverId: userId, isRead: false },
        });
        res.json({
            success: true,
            data: { count },
        });
    }
    catch (error) {
        console.error("Get unread count error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getUnreadCount = getUnreadCount;
// ─── Delete Message ──────────────────────────────────────────────
const deleteMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const messageId = parseInt(req.params.messageId);
        const messageRepo = database_1.AppDataSource.getRepository(Message_1.Message);
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
    }
    catch (error) {
        console.error("Delete message error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteMessage = deleteMessage;
//# sourceMappingURL=messageController.js.map
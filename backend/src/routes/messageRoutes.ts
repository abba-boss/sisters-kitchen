import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  sendMessage,
  getConversations,
  getMessagesWithUser,
  markAsRead,
  getUnreadCount,
  deleteMessage,
} from "../controllers/messageController";

const router = Router();

// All message routes require authentication
router.use(authenticate);

// Send a message
router.post("/", sendMessage);

// Get all conversations
router.get("/conversations", getConversations);

// Get messages with a specific user
router.get("/:otherUserId", getMessagesWithUser);

// Mark messages as read
router.post("/read", markAsRead);

// Get unread message count
router.get("/unread/count", getUnreadCount);

// Delete a message
router.delete("/:messageId", deleteMessage);

export default router;

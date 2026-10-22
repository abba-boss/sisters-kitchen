"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const messageController_1 = require("../controllers/messageController");
const router = (0, express_1.Router)();
// All message routes require authentication
router.use(auth_1.authenticate);
// Send a message
router.post("/", messageController_1.sendMessage);
// Get all conversations
router.get("/conversations", messageController_1.getConversations);
// Get messages with a specific user
router.get("/:otherUserId", messageController_1.getMessagesWithUser);
// Mark messages as read
router.post("/read", messageController_1.markAsRead);
// Get unread message count
router.get("/unread/count", messageController_1.getUnreadCount);
// Delete a message
router.delete("/:messageId", messageController_1.deleteMessage);
exports.default = router;
//# sourceMappingURL=messageRoutes.js.map
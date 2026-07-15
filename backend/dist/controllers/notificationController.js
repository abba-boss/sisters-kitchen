"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getMyNotifications = void 0;
const database_1 = require("../config/database");
const Notification_1 = require("../entities/Notification");
const getMyNotifications = async (req, res) => {
    try {
        const notifRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
        const notifications = await notifRepo.find({
            where: { user: { id: req.user.id } },
            order: { createdAt: "DESC" },
            take: 50,
        });
        res.json({ success: true, data: notifications });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMyNotifications = getMyNotifications;
const markAsRead = async (req, res) => {
    try {
        const notifRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
        await notifRepo.update({ id: req.params.id, user: { id: req.user.id } }, { isRead: true });
        res.json({ success: true, message: "Marked as read" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    try {
        const notifRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
        await notifRepo.update({ user: { id: req.user.id }, isRead: false }, { isRead: true });
        res.json({ success: true, message: "All notifications marked as read" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.markAllAsRead = markAllAsRead;
const deleteNotification = async (req, res) => {
    try {
        const notifRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
        await notifRepo.delete({ id: req.params.id, user: { id: req.user.id } });
        res.json({ success: true, message: "Notification deleted" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteNotification = deleteNotification;
//# sourceMappingURL=notificationController.js.map
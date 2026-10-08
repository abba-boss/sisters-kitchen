"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_1 = require("../controllers/notificationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get("/", auth_1.authenticate, notificationController_1.getMyNotifications);
// read-all MUST come before /:id/read to avoid route conflict
router.patch("/read-all", auth_1.authenticate, notificationController_1.markAllAsRead);
router.patch("/:id/read", auth_1.authenticate, notificationController_1.markAsRead);
router.delete("/:id", auth_1.authenticate, notificationController_1.deleteNotification);
exports.default = router;
//# sourceMappingURL=notificationRoutes.js.map
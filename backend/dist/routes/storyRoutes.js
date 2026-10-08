"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const storyController_1 = require("../controllers/storyController");
const router = (0, express_1.Router)();
router.get("/feed", auth_1.optionalAuth, storyController_1.getStoryFeed);
router.get("/vendor/:vendorId", auth_1.optionalAuth, storyController_1.getVendorStories);
router.get("/my", auth_1.authenticate, storyController_1.getMyStories);
router.post("/", auth_1.authenticate, upload_1.upload.single("media"), storyController_1.createStory);
router.post("/:id/view", auth_1.optionalAuth, storyController_1.viewStory);
router.delete("/:id", auth_1.authenticate, storyController_1.deleteStory);
exports.default = router;
//# sourceMappingURL=storyRoutes.js.map
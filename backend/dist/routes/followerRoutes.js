"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const followerController_1 = require("../controllers/followerController");
const router = (0, express_1.Router)();
router.post("/:vendorId/follow", auth_1.authenticate, followerController_1.toggleFollow);
router.get("/:vendorId/count", auth_1.optionalAuth, followerController_1.getFollowStatus);
router.get("/:vendorId/list", auth_1.optionalAuth, followerController_1.getFollowers);
router.get("/my/following", auth_1.authenticate, followerController_1.getMyFollowing);
exports.default = router;
//# sourceMappingURL=followerRoutes.js.map
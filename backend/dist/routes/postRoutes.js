"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const postController_1 = require("../controllers/postController");
const router = (0, express_1.Router)();
// Feed & discovery (optional auth for personalisation)
router.get("/feed", auth_1.optionalAuth, postController_1.getFeed);
router.get("/vendor/:vendorId", auth_1.optionalAuth, postController_1.getVendorPosts);
router.get("/saved/list", auth_1.authenticate, postController_1.getSavedPosts);
router.get("/my/posts", auth_1.authenticate, postController_1.getMyPosts);
router.get("/:id", auth_1.optionalAuth, postController_1.getPost);
// Mutations
router.post("/", auth_1.authenticate, upload_1.upload.array("media", 5), postController_1.createPost);
router.put("/:id", auth_1.authenticate, postController_1.updatePost);
router.delete("/:id", auth_1.authenticate, postController_1.deletePost);
// Social actions
router.post("/:id/like", auth_1.authenticate, postController_1.toggleLike);
router.post("/:id/save", auth_1.authenticate, postController_1.toggleSave);
// Comments
router.get("/:id/comments", auth_1.optionalAuth, postController_1.getComments);
router.post("/:id/comments", auth_1.authenticate, postController_1.addComment);
router.delete("/:id/comments/:commentId", auth_1.authenticate, postController_1.deleteComment);
exports.default = router;
//# sourceMappingURL=postRoutes.js.map
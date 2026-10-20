"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedPost = exports.PostComment = exports.PostLike = exports.PostMedia = exports.Post = exports.PostStatus = exports.PostType = void 0;
const typeorm_1 = require("typeorm");
const Vendor_1 = require("./Vendor");
const User_1 = require("./User");
const Product_1 = require("./Product");
var PostType;
(function (PostType) {
    PostType["IMAGE"] = "image";
    PostType["VIDEO"] = "video";
    PostType["TEXT"] = "text";
    PostType["PROMOTION"] = "promotion";
    PostType["AVAILABILITY"] = "availability";
    PostType["ANNOUNCEMENT"] = "announcement";
    PostType["BEHIND_SCENES"] = "behind_scenes";
    PostType["RECIPE"] = "recipe";
    PostType["CUSTOMER_HIGHLIGHT"] = "customer_highlight";
})(PostType || (exports.PostType = PostType = {}));
var PostStatus;
(function (PostStatus) {
    PostStatus["DRAFT"] = "draft";
    PostStatus["PUBLISHED"] = "published";
    PostStatus["ARCHIVED"] = "archived";
    PostStatus["DELETED"] = "deleted";
})(PostStatus || (exports.PostStatus = PostStatus = {}));
let Post = class Post {
};
exports.Post = Post;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Post.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Post.prototype, "caption", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 30, default: PostType.IMAGE }),
    __metadata("design:type", String)
], Post.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 30, default: PostStatus.PUBLISHED }),
    __metadata("design:type", String)
], Post.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Post.prototype, "likesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Post.prototype, "commentsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Post.prototype, "viewsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Post.prototype, "sharesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Post.prototype, "allowComments", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Post.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Post.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Date)
], Post.prototype, "scheduledAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Vendor_1.Vendor, { nullable: true, onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", Vendor_1.Vendor)
], Post.prototype, "vendor", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: true, onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", User_1.User)
], Post.prototype, "author", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Product_1.Product, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", Product_1.Product)
], Post.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PostMedia, (m) => m.post, { cascade: true, eager: true }),
    __metadata("design:type", Array)
], Post.prototype, "media", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PostLike, (l) => l.post),
    __metadata("design:type", Array)
], Post.prototype, "likes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PostComment, (c) => c.post),
    __metadata("design:type", Array)
], Post.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => SavedPost, (s) => s.post),
    __metadata("design:type", Array)
], Post.prototype, "saves", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Post.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Post.prototype, "updatedAt", void 0);
exports.Post = Post = __decorate([
    (0, typeorm_1.Entity)("posts")
], Post);
let PostMedia = class PostMedia {
};
exports.PostMedia = PostMedia;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], PostMedia.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PostMedia.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PostMedia.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10, default: "image" }),
    __metadata("design:type", String)
], PostMedia.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], PostMedia.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PostMedia.prototype, "altText", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], PostMedia.prototype, "width", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], PostMedia.prototype, "height", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], PostMedia.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Post, (p) => p.media, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", Post)
], PostMedia.prototype, "post", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PostMedia.prototype, "createdAt", void 0);
exports.PostMedia = PostMedia = __decorate([
    (0, typeorm_1.Entity)("post_media")
], PostMedia);
let PostLike = class PostLike {
};
exports.PostLike = PostLike;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], PostLike.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", User_1.User)
], PostLike.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Post, (p) => p.likes, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", Post)
], PostLike.prototype, "post", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PostLike.prototype, "createdAt", void 0);
exports.PostLike = PostLike = __decorate([
    (0, typeorm_1.Entity)("post_likes")
], PostLike);
let PostComment = class PostComment {
};
exports.PostComment = PostComment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], PostComment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], PostComment.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], PostComment.prototype, "isDeleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], PostComment.prototype, "likesCount", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: true, onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", User_1.User)
], PostComment.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Post, (p) => p.comments, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", Post)
], PostComment.prototype, "post", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PostComment, { nullable: true, onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", PostComment)
], PostComment.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PostComment, (c) => c.parent),
    __metadata("design:type", Array)
], PostComment.prototype, "replies", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PostComment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PostComment.prototype, "updatedAt", void 0);
exports.PostComment = PostComment = __decorate([
    (0, typeorm_1.Entity)("post_comments")
], PostComment);
let SavedPost = class SavedPost {
};
exports.SavedPost = SavedPost;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], SavedPost.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", User_1.User)
], SavedPost.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Post, (p) => p.saves, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", Post)
], SavedPost.prototype, "post", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SavedPost.prototype, "createdAt", void 0);
exports.SavedPost = SavedPost = __decorate([
    (0, typeorm_1.Entity)("saved_posts")
], SavedPost);
//# sourceMappingURL=Post.js.map
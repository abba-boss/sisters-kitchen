"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
// V1 entities
const User_1 = require("../entities/User");
const Vendor_1 = require("../entities/Vendor");
const Product_1 = require("../entities/Product");
const Category_1 = require("../entities/Category");
const Order_1 = require("../entities/Order");
const OrderItem_1 = require("../entities/OrderItem");
const Review_1 = require("../entities/Review");
const Favorite_1 = require("../entities/Favorite");
const Payment_1 = require("../entities/Payment");
const Notification_1 = require("../entities/Notification");
// V2 social entities
const Post_1 = require("../entities/Post");
const Follower_1 = require("../entities/Follower");
const Story_1 = require("../entities/Story");
const RewardWallet_1 = require("../entities/RewardWallet");
dotenv_1.default.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "sisters_kitchen",
    synchronize: false, // ✅ Back to false for safety
    logging: false,
    entities: [
        // V1
        User_1.User, Vendor_1.Vendor, Product_1.Product, Category_1.Category, Order_1.Order, OrderItem_1.OrderItem,
        Review_1.Review, Favorite_1.Favorite, Payment_1.Payment, Notification_1.Notification,
        // V2
        Post_1.Post, Post_1.PostMedia, Post_1.PostLike, Post_1.PostComment, Post_1.SavedPost,
        Follower_1.Follower, Story_1.Story, Story_1.StoryView,
        RewardWallet_1.RewardWallet, RewardWallet_1.RewardTransaction,
    ],
    migrations: [],
    subscribers: [],
});
//# sourceMappingURL=database.js.map
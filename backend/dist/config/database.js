"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
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
dotenv_1.default.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "sisters_kitchen",
    synchronize: true,
    logging: true, // turn off verbose SQL logging — it causes memory pressure
    entities: [
        User_1.User,
        Vendor_1.Vendor,
        Product_1.Product,
        Category_1.Category,
        Order_1.Order,
        OrderItem_1.OrderItem,
        Review_1.Review,
        Favorite_1.Favorite,
        Payment_1.Payment,
        Notification_1.Notification,
    ],
    migrations: [],
    subscribers: [],
});
//# sourceMappingURL=database.js.map
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrders = exports.updateOrderStatus = exports.getVendorOrders = exports.getOrderById = exports.getMyOrders = exports.createOrder = void 0;
const database_1 = require("../config/database");
const Order_1 = require("../entities/Order");
const Product_1 = require("../entities/Product");
const Vendor_1 = require("../entities/Vendor");
const Notification_1 = require("../entities/Notification");
const helpers_1 = require("../utils/helpers");
const User_1 = require("../entities/User");
const socket_1 = require("../config/socket");
// ─── Notification helper ──────────────────────────────────────
async function createAndEmitNotification(userId, title, message, type, referenceId) {
    const notifRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
    const { User: UserEntity } = await Promise.resolve().then(() => __importStar(require("../entities/User")));
    const userRepo = database_1.AppDataSource.getRepository(UserEntity);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user)
        return;
    const notif = notifRepo.create({ user, title, message, type, referenceId });
    await notifRepo.save(notif);
    (0, socket_1.emitNotification)(userId, notif);
    return notif;
}
const createOrder = async (req, res) => {
    try {
        const { items, deliveryAddress, deliveryPhone, notes, vendorId } = req.body;
        const vendorRepo = database_1.AppDataSource.getRepository(Vendor_1.Vendor);
        const vendor = await vendorRepo.findOne({ where: { id: vendorId }, relations: ["user"] });
        if (!vendor) {
            res.status(404).json({ success: false, message: "Vendor not found" });
            return;
        }
        const productRepo = database_1.AppDataSource.getRepository(Product_1.Product);
        let subtotal = 0;
        const orderItems = [];
        for (const item of items) {
            const product = await productRepo.findOne({ where: { id: item.productId } });
            if (!product) {
                res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
                return;
            }
            const price = Number(product.discountPrice) || Number(product.price);
            const itemSubtotal = price * item.quantity;
            subtotal += itemSubtotal;
            orderItems.push({ product, quantity: item.quantity, price, subtotal: itemSubtotal, notes: item.notes });
        }
        const deliveryFee = 500;
        const total = subtotal + deliveryFee;
        const orderRepo = database_1.AppDataSource.getRepository(Order_1.Order);
        const order = orderRepo.create({
            orderNumber: (0, helpers_1.generateOrderNumber)(),
            user: req.user,
            vendor,
            items: orderItems,
            subtotal,
            deliveryFee,
            total,
            deliveryAddress,
            deliveryPhone,
            notes,
            status: Order_1.OrderStatus.PENDING,
        });
        await orderRepo.save(order);
        // Reload with relations for socket payload
        const fullOrder = await orderRepo.findOne({
            where: { id: order.id },
            relations: ["user", "vendor", "vendor.user", "items", "items.product"],
        });
        // Notify vendor via socket + DB notification
        (0, socket_1.emitToAdmins)("order:new", { order: fullOrder });
        await createAndEmitNotification(vendor.user.id, "New Order Received! 🛎️", `Order #${order.orderNumber} just came in!`, Notification_1.NotificationType.NEW_ORDER, order.id);
        res.status(201).json({ success: true, message: "Order placed successfully", data: fullOrder });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createOrder = createOrder;
const getMyOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const orderRepo = database_1.AppDataSource.getRepository(Order_1.Order);
        const qb = orderRepo
            .createQueryBuilder("order")
            .leftJoinAndSelect("order.vendor", "vendor")
            .leftJoinAndSelect("order.items", "items")
            .leftJoinAndSelect("items.product", "product")
            .where("order.user = :userId", { userId: req.user.id });
        if (status)
            qb.andWhere("order.status = :status", { status });
        const [orders, total] = await qb
            .skip(skip).take(Number(limit)).orderBy("order.createdAt", "DESC").getManyAndCount();
        res.json({ success: true, data: orders, meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMyOrders = getMyOrders;
const getOrderById = async (req, res) => {
    try {
        const orderRepo = database_1.AppDataSource.getRepository(Order_1.Order);
        const order = await orderRepo.findOne({
            where: { id: req.params.id },
            relations: ["user", "vendor", "vendor.user", "items", "items.product", "payments"],
        });
        if (!order) {
            res.status(404).json({ success: false, message: "Order not found" });
            return;
        }
        const isOwner = order.user.id === req.user.id;
        const isVendorOwner = order.vendor?.user?.id === req.user.id;
        const isAdmin = req.user.role === User_1.UserRole.ADMIN;
        if (!isOwner && !isVendorOwner && !isAdmin) {
            res.status(403).json({ success: false, message: "Not authorized" });
            return;
        }
        res.json({ success: true, data: order });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getOrderById = getOrderById;
const getVendorOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const vendorRepo = database_1.AppDataSource.getRepository(Vendor_1.Vendor);
        const vendor = await vendorRepo.findOne({ where: { user: { id: req.user.id } } });
        if (!vendor) {
            res.status(404).json({ success: false, message: "Vendor not found" });
            return;
        }
        const orderRepo = database_1.AppDataSource.getRepository(Order_1.Order);
        const qb = orderRepo
            .createQueryBuilder("order")
            .leftJoinAndSelect("order.user", "user")
            .leftJoinAndSelect("order.items", "items")
            .leftJoinAndSelect("items.product", "product")
            .where("order.vendor = :vendorId", { vendorId: vendor.id });
        if (status)
            qb.andWhere("order.status = :status", { status });
        const [orders, total] = await qb
            .skip(skip).take(Number(limit)).orderBy("order.createdAt", "DESC").getManyAndCount();
        res.json({ success: true, data: orders, meta: { total, page: Number(page), limit: Number(limit) } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getVendorOrders = getVendorOrders;
const updateOrderStatus = async (req, res) => {
    try {
        const { status, rejectionReason, estimatedDeliveryTime } = req.body;
        const orderRepo = database_1.AppDataSource.getRepository(Order_1.Order);
        const order = await orderRepo.findOne({
            where: { id: req.params.id },
            relations: ["user", "vendor", "vendor.user", "items", "items.product"],
        });
        if (!order) {
            res.status(404).json({ success: false, message: "Order not found" });
            return;
        }
        const prevStatus = order.status;
        order.status = status;
        if (rejectionReason)
            order.rejectionReason = rejectionReason;
        if (estimatedDeliveryTime)
            order.estimatedDeliveryTime = estimatedDeliveryTime;
        await orderRepo.save(order);
        // Update vendor earnings on delivery
        if (status === Order_1.OrderStatus.DELIVERED) {
            const vendorRepo = database_1.AppDataSource.getRepository(Vendor_1.Vendor);
            const vendor = await vendorRepo.findOne({ where: { id: order.vendor.id } });
            if (vendor) {
                vendor.totalOrders += 1;
                vendor.totalEarnings = Number(vendor.totalEarnings) + Number(order.total);
                await vendorRepo.save(vendor);
            }
        }
        // ── Emit real-time socket event ──────────────────────────
        (0, socket_1.emitOrderUpdate)(order);
        // ── Customer notification ────────────────────────────────
        const statusMessages = {
            confirmed: { title: "Order Confirmed ✅", msg: `Your order #${order.orderNumber} has been confirmed!`, type: Notification_1.NotificationType.ORDER_CONFIRMED },
            preparing: { title: "Order Being Prepared 👩‍🍳", msg: `#${order.orderNumber} is being freshly prepared.`, type: Notification_1.NotificationType.ORDER_PREPARING },
            ready: { title: "Order Ready! 🎉", msg: `#${order.orderNumber} is ready for delivery.`, type: Notification_1.NotificationType.ORDER_READY },
            out_for_delivery: { title: "On the Way 🛵", msg: `#${order.orderNumber} is out for delivery!`, type: Notification_1.NotificationType.ORDER_DELIVERED },
            delivered: { title: "Order Delivered! 🍽️", msg: `#${order.orderNumber} has been delivered. Enjoy your meal!`, type: Notification_1.NotificationType.ORDER_DELIVERED },
            cancelled: { title: "Order Cancelled", msg: `#${order.orderNumber} was cancelled. ${rejectionReason || ""}`, type: Notification_1.NotificationType.ORDER_CANCELLED },
        };
        const notifData = statusMessages[status];
        if (notifData) {
            await createAndEmitNotification(order.user.id, notifData.title, notifData.msg, notifData.type, order.id);
        }
        // Emit to admin room
        (0, socket_1.emitToAdmins)("order:status_changed", { orderId: order.id, newStatus: status, prevStatus, order });
        res.json({ success: true, message: "Order status updated", data: order });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateOrderStatus = updateOrderStatus;
const getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const orderRepo = database_1.AppDataSource.getRepository(Order_1.Order);
        const qb = orderRepo
            .createQueryBuilder("order")
            .leftJoinAndSelect("order.user", "user")
            .leftJoinAndSelect("order.vendor", "vendor")
            .leftJoinAndSelect("order.items", "items");
        if (status)
            qb.where("order.status = :status", { status });
        const [orders, total] = await qb
            .skip(skip).take(Number(limit)).orderBy("order.createdAt", "DESC").getManyAndCount();
        res.json({ success: true, data: orders, meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllOrders = getAllOrders;
//# sourceMappingURL=orderController.js.map
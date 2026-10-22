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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPickup = exports.getAllOrders = exports.updateOrderStatus = exports.getVendorOrders = exports.getOrderById = exports.getMyOrders = exports.createOrder = void 0;
const database_1 = require("../config/database");
const Order_1 = require("../entities/Order");
const Product_1 = require("../entities/Product");
const Vendor_1 = require("../entities/Vendor");
const Notification_1 = require("../entities/Notification");
const helpers_1 = require("../utils/helpers");
const User_1 = require("../entities/User");
const socket_1 = require("../config/socket");
const commissionService_1 = require("../services/commissionService");
const email_1 = require("../config/email");
const crypto_1 = __importDefault(require("crypto"));
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
        const { items, deliveryAddress, deliveryPhone, notes, vendorId, fulfillmentType = Order_1.FulfillmentType.DELIVERY } = req.body;
        const vendorRepo = database_1.AppDataSource.getRepository(Vendor_1.Vendor);
        const vendor = await vendorRepo.findOne({ where: { id: vendorId }, relations: ["user"] });
        if (!vendor) {
            res.status(404).json({ success: false, message: "Vendor not found" });
            return;
        }
        // ── Validate pickup location if pickup order ──────────────
        if (fulfillmentType === Order_1.FulfillmentType.PICKUP) {
            if (!vendor.pickupLatitude || !vendor.pickupLongitude) {
                res.status(400).json({
                    success: false,
                    message: "This vendor does not offer pickup service yet. Please choose delivery or contact the vendor."
                });
                return;
            }
        }
        // ── Validate delivery address if delivery order ───────────
        if (fulfillmentType === Order_1.FulfillmentType.DELIVERY && !deliveryAddress) {
            res.status(400).json({
                success: false,
                message: "Delivery address is required for delivery orders"
            });
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
            // ── Stock Validation ──────────────────────────────────────
            if (product.stock < item.quantity) {
                res.status(400).json({
                    success: false,
                    message: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
                });
                return;
            }
            // ── Decrement Stock ───────────────────────────────────────
            product.stock -= item.quantity;
            await productRepo.save(product);
            const price = Number(product.discountPrice) || Number(product.price);
            const itemSubtotal = price * item.quantity;
            subtotal += itemSubtotal;
            orderItems.push({ product, quantity: item.quantity, price, subtotal: itemSubtotal, notes: item.notes });
        }
        // ── Calculate delivery fee based on fulfillment type ──────
        const deliveryFee = fulfillmentType === Order_1.FulfillmentType.PICKUP ? 0 : 500;
        const total = subtotal + deliveryFee;
        // ── Generate pickup token and PIN if pickup order ─────────────────
        // Token: Long secure string for QR code
        // PIN: Short 6-digit code for manual entry
        const pickupToken = fulfillmentType === Order_1.FulfillmentType.PICKUP
            ? crypto_1.default.randomBytes(32).toString('hex')
            : null;
        const pickupPin = fulfillmentType === Order_1.FulfillmentType.PICKUP
            ? Math.floor(100000 + Math.random() * 900000).toString() // 6-digit number
            : null;
        const orderRepo = database_1.AppDataSource.getRepository(Order_1.Order);
        const order = orderRepo.create({
            orderNumber: (0, helpers_1.generateOrderNumber)(),
            user: req.user,
            vendor,
            items: orderItems,
            subtotal,
            deliveryFee,
            total,
            deliveryAddress: fulfillmentType === Order_1.FulfillmentType.DELIVERY ? deliveryAddress : null,
            deliveryPhone,
            notes,
            status: Order_1.OrderStatus.PENDING,
            fulfillmentType,
            pickupToken,
            pickupPin,
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
        // Send confirmation emails
        await (0, email_1.sendEmail)(req.user.email, email_1.emailTemplates.orderConfirmation(order.orderNumber, req.user.firstName, Number(order.total)));
        await (0, email_1.sendEmail)(vendor.user.email, email_1.emailTemplates.newOrderVendor(order.orderNumber, vendor.businessName, items.length, Number(order.total)));
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
        const { page = 1, limit = 10, status, startDate, endDate } = req.query;
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
        // Date range filtering
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            qb.andWhere("order.createdAt >= :start", { start })
                .andWhere("order.createdAt <= :end", { end });
        }
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
        // ── Restore Stock on Cancellation ─────────────────────────
        if (status === Order_1.OrderStatus.CANCELLED && prevStatus !== Order_1.OrderStatus.CANCELLED) {
            const productRepo = database_1.AppDataSource.getRepository(Product_1.Product);
            for (const item of order.items) {
                const product = await productRepo.findOne({ where: { id: item.product.id } });
                if (product) {
                    product.stock += item.quantity;
                    await productRepo.save(product);
                }
            }
        }
        // Update vendor earnings on delivery with commission deduction
        if (status === Order_1.OrderStatus.DELIVERED) {
            const result = await (0, commissionService_1.updateVendorEarnings)(order.vendor.id, Number(order.total), order.id);
            if (!result.success) {
                console.error('Failed to update vendor earnings:', result.error);
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
            // Send email notification for status update
            await (0, email_1.sendEmail)(order.user.email, email_1.emailTemplates.orderStatusUpdate(order.orderNumber, order.user.firstName, status, notifData.msg));
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
const verifyPickup = async (req, res) => {
    try {
        const { token } = req.body;
        const { id: orderId } = req.params;
        if (!token) {
            res.status(400).json({ success: false, message: "Pickup token is required" });
            return;
        }
        const orderRepo = database_1.AppDataSource.getRepository(Order_1.Order);
        const order = await orderRepo.findOne({
            where: { id: orderId },
            relations: ["user", "vendor", "vendor.user", "items", "items.product", "payments"],
        });
        if (!order) {
            res.status(404).json({ success: false, message: "Order not found" });
            return;
        }
        // ── Validate vendor ownership ─────────────────────────────
        if (order.vendor?.user?.id !== req.user.id) {
            res.status(403).json({ success: false, message: "You are not authorized to verify this order" });
            return;
        }
        // ── Validate fulfillment type ─────────────────────────────
        if (order.fulfillmentType !== Order_1.FulfillmentType.PICKUP) {
            res.status(400).json({ success: false, message: "This is not a pickup order" });
            return;
        }
        // ── Validate token or PIN ────────────────────────────────────────
        // Accept either: long token (from QR scan) OR short PIN (manual entry)
        const tokenMatches = order.pickupToken === token;
        const pinMatches = order.pickupPin === token;
        if (!tokenMatches && !pinMatches) {
            res.status(400).json({ success: false, message: "Invalid pickup code" });
            return;
        }
        // ── Check if already verified ─────────────────────────────
        if (order.pickupVerifiedAt) {
            res.status(400).json({
                success: false,
                message: "This order has already been picked up",
                data: { verifiedAt: order.pickupVerifiedAt }
            });
            return;
        }
        // ── Validate order status ─────────────────────────────────
        if (order.status !== Order_1.OrderStatus.READY) {
            res.status(400).json({
                success: false,
                message: `Order must be in 'ready' status. Current status: ${order.status}`
            });
            return;
        }
        // ── Validate payment ──────────────────────────────────────
        // For pickup orders: Allow COD (pay on pickup) or already paid orders
        const hasPaidPayment = order.payments?.some(p => p.status === 'success');
        const hasCODPayment = order.payments?.some(p => p.method === 'cash_on_delivery');
        if (!hasPaidPayment && !hasCODPayment) {
            res.status(400).json({
                success: false,
                message: "Order must have a payment method before pickup"
            });
            return;
        }
        // ── Mark as verified and delivered ────────────────────────
        order.pickupVerifiedAt = new Date();
        order.pickupVerifiedBy = req.user.id;
        order.status = Order_1.OrderStatus.DELIVERED;
        await orderRepo.save(order);
        // ── Mark COD payment as success on pickup ─────────────────
        if (hasCODPayment && !hasPaidPayment) {
            const Payment = database_1.AppDataSource.getRepository(await Promise.resolve().then(() => __importStar(require("../entities/Payment"))).then(m => m.Payment));
            const codPayment = order.payments?.find(p => p.method === 'cash_on_delivery');
            if (codPayment) {
                codPayment.status = 'success';
                await Payment.save(codPayment);
            }
        }
        // Update vendor stats
        const vendorRepo = database_1.AppDataSource.getRepository(Vendor_1.Vendor);
        const vendor = await vendorRepo.findOne({ where: { id: order.vendor.id } });
        if (vendor) {
            vendor.totalOrders += 1;
            vendor.totalEarnings = Number(vendor.totalEarnings) + Number(order.total);
            await vendorRepo.save(vendor);
        }
        // Emit real-time update
        (0, socket_1.emitOrderUpdate)(order);
        // Notify customer
        await createAndEmitNotification(order.user.id, "Order Picked Up! 🎉", `Your order #${order.orderNumber} has been picked up. Enjoy your meal!`, Notification_1.NotificationType.ORDER_DELIVERED, order.id);
        res.json({
            success: true,
            message: "Pickup verified successfully! Order marked as delivered.",
            data: order
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.verifyPickup = verifyPickup;
//# sourceMappingURL=orderController.js.map
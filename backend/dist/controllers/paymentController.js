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
exports.getPaymentReceipt = exports.getMyPayments = exports.verifyPayment = exports.initializePayment = void 0;
const database_1 = require("../config/database");
const Payment_1 = require("../entities/Payment");
const Order_1 = require("../entities/Order");
const Notification_1 = require("../entities/Notification");
const socket_1 = require("../config/socket");
const uuid_1 = require("uuid");
const https_1 = __importDefault(require("https"));
// ─── Helper: create notification ──────────────────────────────
async function notify(userId, title, message, type, refId) {
    const notifRepo = database_1.AppDataSource.getRepository(Notification_1.Notification);
    const { User } = await Promise.resolve().then(() => __importStar(require("../entities/User")));
    const userRepo = database_1.AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user)
        return;
    const notif = notifRepo.create({ user, title, message, type, referenceId: refId });
    await notifRepo.save(notif);
    (0, socket_1.emitNotification)(userId, notif);
}
const initializePayment = async (req, res) => {
    try {
        const { orderId, method } = req.body;
        const orderRepo = database_1.AppDataSource.getRepository(Order_1.Order);
        const order = await orderRepo.findOne({
            where: { id: orderId, user: { id: req.user.id } },
            relations: ["vendor", "vendor.user"],
        });
        if (!order) {
            res.status(404).json({ success: false, message: "Order not found" });
            return;
        }
        const reference = `SK-${(0, uuid_1.v4)().replace(/-/g, "").substring(0, 12).toUpperCase()}`;
        const paymentRepo = database_1.AppDataSource.getRepository(Payment_1.Payment);
        const payment = paymentRepo.create({
            reference,
            amount: order.total,
            method: method || Payment_1.PaymentMethod.PAYSTACK,
            order,
            user: req.user,
            status: Payment_1.PaymentStatus.PENDING,
        });
        await paymentRepo.save(payment);
        if (method === Payment_1.PaymentMethod.CASH_ON_DELIVERY) {
            order.status = Order_1.OrderStatus.CONFIRMED;
            await orderRepo.save(order);
            (0, socket_1.emitOrderUpdate)(order);
            await notify(req.user.id, "Order Confirmed ✅", `Your cash-on-delivery order #${order.orderNumber} is confirmed!`, Notification_1.NotificationType.ORDER_CONFIRMED, order.id);
            res.json({ success: true, message: "Cash on delivery order confirmed", data: { reference, orderId: order.id } });
            return;
        }
        // Paystack initialization
        const params = JSON.stringify({
            email: req.user.email,
            amount: Math.round(Number(order.total) * 100),
            reference,
            callback_url: `${process.env.FRONTEND_URL}/payment/verify?reference=${reference}`,
            metadata: { orderId: order.id, userId: req.user.id, orderNumber: order.orderNumber },
        });
        const options = {
            hostname: "api.paystack.co",
            port: 443,
            path: "/transaction/initialize",
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
        };
        const paystackReq = https_1.default.request(options, (paystackRes) => {
            let data = "";
            paystackRes.on("data", (chunk) => (data += chunk));
            paystackRes.on("end", () => {
                const response = JSON.parse(data);
                if (response.status) {
                    res.json({
                        success: true,
                        data: {
                            authorizationUrl: response.data.authorization_url,
                            reference,
                            accessCode: response.data.access_code,
                            orderId: order.id,
                        },
                    });
                }
                else {
                    res.status(400).json({ success: false, message: "Payment initialization failed" });
                }
            });
        });
        paystackReq.on("error", () => res.status(500).json({ success: false, message: "Payment service error" }));
        paystackReq.write(params);
        paystackReq.end();
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.initializePayment = initializePayment;
const verifyPayment = async (req, res) => {
    try {
        const reference = req.params.reference;
        const options = {
            hostname: "api.paystack.co",
            port: 443,
            path: `/transaction/verify/${encodeURIComponent(reference)}`,
            method: "GET",
            headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
        };
        https_1.default.get(options, (paystackRes) => {
            let data = "";
            paystackRes.on("data", (chunk) => (data += chunk));
            paystackRes.on("end", async () => {
                const response = JSON.parse(data);
                const paymentRepo = database_1.AppDataSource.getRepository(Payment_1.Payment);
                const payment = await paymentRepo.findOne({
                    where: { reference },
                    relations: ["order", "order.vendor", "order.vendor.user", "user"],
                });
                if (!payment) {
                    res.status(404).json({ success: false, message: "Payment not found" });
                    return;
                }
                if (response.data?.status === "success") {
                    payment.status = Payment_1.PaymentStatus.SUCCESS;
                    payment.paystackReference = response.data.reference;
                    payment.metadata = response.data;
                    await paymentRepo.save(payment);
                    const orderRepo = database_1.AppDataSource.getRepository(Order_1.Order);
                    const order = await orderRepo.findOne({
                        where: { id: payment.order.id },
                        relations: ["user", "vendor", "vendor.user"],
                    });
                    if (order) {
                        order.status = Order_1.OrderStatus.CONFIRMED;
                        await orderRepo.save(order);
                        (0, socket_1.emitOrderUpdate)(order);
                    }
                    await notify(payment.user.id, "Payment Successful 💳", `Payment of ₦${payment.amount} confirmed for order #${payment.order.orderNumber || ""}`, Notification_1.NotificationType.PAYMENT_SUCCESS, payment.order.id);
                    res.json({ success: true, message: "Payment verified", data: { payment, orderId: payment.order.id } });
                }
                else {
                    payment.status = Payment_1.PaymentStatus.FAILED;
                    await paymentRepo.save(payment);
                    await notify(payment.user.id, "Payment Failed ❌", "Your payment could not be processed. Please try again.", Notification_1.NotificationType.PAYMENT_FAILED, payment.order.id);
                    res.status(400).json({ success: false, message: "Payment verification failed" });
                }
            });
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.verifyPayment = verifyPayment;
const getMyPayments = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const paymentRepo = database_1.AppDataSource.getRepository(Payment_1.Payment);
        const [payments, total] = await paymentRepo.findAndCount({
            where: { user: { id: req.user.id } },
            relations: ["order"],
            order: { createdAt: "DESC" },
            skip,
            take: Number(limit),
        });
        res.json({ success: true, data: payments, meta: { total, page: Number(page), limit: Number(limit) } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMyPayments = getMyPayments;
const getPaymentReceipt = async (req, res) => {
    try {
        const paymentRepo = database_1.AppDataSource.getRepository(Payment_1.Payment);
        const payment = await paymentRepo.findOne({
            where: { id: req.params.id, user: { id: req.user.id } },
            relations: ["order", "order.items", "order.items.product", "order.vendor", "user"],
        });
        if (!payment) {
            res.status(404).json({ success: false, message: "Payment not found" });
            return;
        }
        res.json({ success: true, data: payment });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPaymentReceipt = getPaymentReceipt;
//# sourceMappingURL=paymentController.js.map
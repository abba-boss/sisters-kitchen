import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Payment, PaymentStatus, PaymentMethod } from "../entities/Payment";
import { Order, OrderStatus } from "../entities/Order";
import { Notification, NotificationType } from "../entities/Notification";
import { AuthRequest } from "../middleware/auth";
import { emitOrderUpdate, emitNotification } from "../config/socket";
import { v4 as uuidv4 } from "uuid";
import https from "https";
import crypto from "crypto";
import { cancelOrderAndRestoreStock, stripSensitiveUserFields } from "../utils/orderHelpers";
import { logger } from "../utils/logger";

const PAYSTACK_TIMEOUT_MS = 20000;

interface PaystackResponse {
  status: boolean;
  message?: string;
  data?: any;
}

/** Talk to Paystack with a hard timeout so a slow provider can't hang the request. */
function paystackRequest(
  path: string,
  method: "GET" | "POST",
  body?: Record<string, any>
): Promise<PaystackResponse> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;

    const options = {
      hostname: "api.paystack.co",
      port: 443,
      path,
      method,
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        ...(payload
          ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
          : {}),
      },
    };

    const paystackReq = https.request(options, (paystackRes) => {
      let raw = "";
      paystackRes.on("data", (chunk) => (raw += chunk));
      paystackRes.on("end", () => {
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error("Unexpected response from the payment provider"));
        }
      });
    });

    paystackReq.setTimeout(PAYSTACK_TIMEOUT_MS, () => {
      paystackReq.destroy(new Error("The payment provider took too long to respond"));
    });
    paystackReq.on("error", reject);

    if (payload) paystackReq.write(payload);
    paystackReq.end();
  });
}

const hasPaystackKey = (): boolean => {
  const key = process.env.PAYSTACK_SECRET_KEY;
  return Boolean(key && key.startsWith("sk_") && key.length > 20);
};

// ─── Helper: create notification ──────────────────────────────
async function notify(userId: string, title: string, message: string, type: NotificationType, refId: string) {
  const notifRepo = AppDataSource.getRepository(Notification);
  const { User } = await import("../entities/User");
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) return;
  const notif = notifRepo.create({ user, title, message, type, referenceId: refId });
  await notifRepo.save(notif);
  emitNotification(userId, notif);
}

export const initializePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, method } = req.body ?? {};

    if (!orderId) {
      res.status(400).json({ success: false, message: "Order is required" });
      return;
    }

    const orderRepo = AppDataSource.getRepository(Order);
    // NOTE: never load `payments` here. Saving an Order whose payments collection is
    // loaded makes TypeORM sync that stale collection and null the FK on the rows,
    // orphaning every payment from its order. Payments are queried separately below.
    const order = await orderRepo.findOne({
      where: { id: orderId, user: { id: req.user!.id } },
      relations: ["user", "vendor", "vendor.user", "items", "items.product"],
    });

    if (!order) { res.status(404).json({ success: false, message: "Order not found" }); return; }

    if (order.status === OrderStatus.CANCELLED) {
      res.status(400).json({ success: false, message: "This order was cancelled" });
      return;
    }

    if (order.status === OrderStatus.DELIVERED) {
      res.status(400).json({ success: false, message: "This order has already been completed" });
      return;
    }

    const paymentMethod = (method || PaymentMethod.PAYSTACK) as PaymentMethod;
    if (paymentMethod !== PaymentMethod.PAYSTACK && paymentMethod !== PaymentMethod.CASH_ON_DELIVERY) {
      res.status(400).json({
        success: false,
        message: "This payment method is not available yet. Please choose Pay Online or Cash on Delivery.",
      });
      return;
    }

    const paymentRepo = AppDataSource.getRepository(Payment);
    const orderPayments = await paymentRepo.find({ where: { order: { id: order.id } } });

    if (orderPayments.some((p) => p.status === PaymentStatus.SUCCESS)) {
      res.status(400).json({ success: false, message: "This order has already been paid" });
      return;
    }

    const reference = `SK-${uuidv4().replace(/-/g, "").substring(0, 12).toUpperCase()}`;

    // ── Cash on delivery ─────────────────────────────────────
    if (paymentMethod === PaymentMethod.CASH_ON_DELIVERY) {
      let payment = orderPayments.find(
        (p) => p.method === PaymentMethod.CASH_ON_DELIVERY && p.status !== PaymentStatus.FAILED
      );

      if (!payment) {
        payment = paymentRepo.create({
          reference,
          amount: order.total,
          method: PaymentMethod.CASH_ON_DELIVERY,
          order,
          user: req.user,
          status: PaymentStatus.PENDING,
        });
        await paymentRepo.save(payment);
      }

      if (order.status === OrderStatus.PENDING) {
        order.status = OrderStatus.CONFIRMED;
        await orderRepo.save(order);
        emitOrderUpdate(order);
        await notify(
          order.user.id,
          "Order Confirmed ✅",
          `Your cash-on-delivery order #${order.orderNumber} is confirmed!`,
          NotificationType.ORDER_CONFIRMED,
          order.id
        );
      }

      res.json({
        success: true,
        message: "Cash on delivery order confirmed",
        data: { reference: payment.reference, orderId: order.id },
      });
      return;
    }

    // ── Online payment (Paystack) ────────────────────────────
    if (!hasPaystackKey()) {
      // Nothing was charged and the order is untouched — the customer can pay on delivery.
      res.status(503).json({
        success: false,
        message: "Online payment is not available right now. Please choose Cash on Delivery.",
      });
      return;
    }

    const payment = paymentRepo.create({
      reference,
      amount: order.total,
      method: PaymentMethod.PAYSTACK,
      order,
      user: req.user,
      status: PaymentStatus.PENDING,
    });
    await paymentRepo.save(payment);

    let response: PaystackResponse;
    try {
      response = await paystackRequest("/transaction/initialize", "POST", {
        email: req.user!.email,
        amount: Math.round(Number(order.total) * 100),
        reference,
        callback_url: `${process.env.FRONTEND_URL}/payment/verify?reference=${reference}`,
        metadata: { orderId: order.id, userId: req.user!.id, orderNumber: order.orderNumber },
      });
    } catch (providerError: any) {
      await failPaymentAndCancelOrder(order, payment, req.user!.id);
      res.status(502).json({
        success: false,
        message:
          "We couldn't reach the payment provider, so your order was cancelled. Please try again or choose Cash on Delivery.",
        data: { orderId: order.id, cancelled: true, reason: providerError?.message },
      });
      return;
    }

    if (!response?.status || !response.data?.authorization_url) {
      await failPaymentAndCancelOrder(order, payment, req.user!.id);
      res.status(400).json({
        success: false,
        message: `Online payment could not be started${
          response?.message ? `: ${response.message}` : ""
        }. Your order was cancelled — please try again or choose Cash on Delivery.`,
        data: { orderId: order.id, cancelled: true },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        authorizationUrl: response.data.authorization_url,
        reference,
        accessCode: response.data.access_code,
        orderId: order.id,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** Mark the payment failed, cancel the order, release its stock and tell the customer. */
async function failPaymentAndCancelOrder(order: Order, payment: Payment, customerId: string) {
  try {
    payment.status = PaymentStatus.FAILED;
    await AppDataSource.getRepository(Payment).save(payment);

    await cancelOrderAndRestoreStock(order, "Online payment could not be started");
    emitOrderUpdate(order);

    await notify(
      customerId,
      "Payment Not Started ❌",
      `We couldn't start the online payment for order #${order.orderNumber}, so it was cancelled. Your items are still in your cart.`,
      NotificationType.PAYMENT_FAILED,
      order.id
    );
  } catch (error) {
    console.error("Failed to cancel unpaid order:", error);
  }
}

export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reference = req.params.reference as string;

    const paymentRepo = AppDataSource.getRepository(Payment);
    const payment = await paymentRepo.findOne({
      where: { reference },
      relations: ["order", "order.user", "order.vendor", "order.vendor.user", "user"],
    });

    if (!payment) { res.status(404).json({ success: false, message: "Payment not found" }); return; }

    let response: PaystackResponse;
    try {
      response = await paystackRequest(
        `/transaction/verify/${encodeURIComponent(reference)}`,
        "GET"
      );
    } catch {
      res.status(502).json({
        success: false,
        message: "We couldn't confirm your payment with the provider. Please try again in a moment.",
      });
      return;
    }

    if (response?.data?.status === "success") {
      payment.status = PaymentStatus.SUCCESS;
      payment.paystackReference = response.data.reference;
      payment.metadata = response.data;
      await paymentRepo.save(payment);

      if (payment.order) {
        const orderRepo = AppDataSource.getRepository(Order);
        const order = await orderRepo.findOne({
          where: { id: payment.order.id },
          relations: ["user", "vendor", "vendor.user"],
        });

        // Only wake up a pending order — never resurrect a cancelled/completed one.
        if (order && order.status === OrderStatus.PENDING) {
          order.status = OrderStatus.CONFIRMED;
          await orderRepo.save(order);
          emitOrderUpdate(order);
        }
      }

      await notify(
        payment.user.id,
        "Payment Successful 💳",
        `Payment of ₦${payment.amount} confirmed for order #${payment.order?.orderNumber || ""}`,
        NotificationType.PAYMENT_SUCCESS,
        payment.order?.id
      );

      res.json({
        success: true,
        message: "Payment verified",
        data: { payment, orderId: payment.order?.id },
      });
      return;
    }

    payment.status = PaymentStatus.FAILED;
    await paymentRepo.save(payment);
    await notify(
      payment.user.id,
      "Payment Failed ❌",
      "Your payment could not be processed. Please try again.",
      NotificationType.PAYMENT_FAILED,
      payment.order?.id
    );
    res.status(400).json({ success: false, message: "Payment verification failed" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const paymentRepo = AppDataSource.getRepository(Payment);
    const [payments, total] = await paymentRepo.findAndCount({
      where: { user: { id: req.user!.id } },
      relations: ["order"],
      order: { createdAt: "DESC" },
      skip,
      take: Number(limit),
    });

    res.json({ success: true, data: payments, meta: { total, page: Number(page), limit: Number(limit) } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPaymentReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const paymentRepo = AppDataSource.getRepository(Payment);
    const payment = await paymentRepo.findOne({
      where: { id: req.params.id as string, user: { id: req.user!.id } },
      relations: ["order", "order.items", "order.items.product", "order.vendor", "user"],
    });

    if (!payment) { res.status(404).json({ success: false, message: "Payment not found" }); return; }
    res.json({ success: true, data: stripSensitiveUserFields(payment) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Paystack Webhook Handler ─────────────────────────────────
/**
 * Paystack posts the raw JSON body and signs those exact bytes. Anything that
 * re-serializes the body (e.g. JSON.stringify of a parsed object) changes key
 * order/spacing and breaks the signature, so the raw buffer is used here.
 */
export const paystackWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      logger.error("Paystack webhook received but PAYSTACK_SECRET_KEY is not configured");
      res.status(503).json({ success: false, message: "Payment provider not configured" });
      return;
    }

    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {}));
    const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
    const signature = req.headers["x-paystack-signature"];

    const supplied = Buffer.from(typeof signature === "string" ? signature : "");
    const expected = Buffer.from(hash);
    const signatureValid = supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);

    if (!signatureValid) {
      res.status(401).json({ success: false, message: "Invalid signature" });
      return;
    }

    let payload: any;
    try {
      payload = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString("utf8")) : req.body;
    } catch {
      res.status(400).json({ success: false, message: "Malformed payload" });
      return;
    }

    const { event, data } = payload ?? {};

    // Handle successful charge
    if (event === 'charge.success') {
      const paymentRepo = AppDataSource.getRepository(Payment);
      const payment = await paymentRepo.findOne({
        where: { reference: data?.reference },
        relations: ['order', 'order.user', 'order.vendor', 'order.vendor.user', 'user'],
      });

      // Acknowledge unknown references with 200: a 404 makes Paystack retry the
      // same event forever for payments created outside this app.
      if (!payment) {
        logger.warn(`Paystack webhook: no payment found for reference ${data?.reference}`);
        res.status(200).json({ success: true, ignored: true });
        return;
      }

      // Never confirm a payment for a different amount than the order total.
      const expectedKobo = Math.round(Number(payment.amount) * 100);
      if (Number(data?.amount) !== expectedKobo) {
        logger.error(
          `Paystack webhook amount mismatch for ${payment.reference}: expected ${expectedKobo}, got ${data?.amount}`
        );
        res.status(200).json({ success: true, ignored: true });
        return;
      }

      // Only process if payment is still pending
      if (payment.status === PaymentStatus.PENDING) {
        payment.status = PaymentStatus.SUCCESS;
        payment.paystackReference = data.reference;
        payment.metadata = data;
        await paymentRepo.save(payment);
        
        // Update order status (a payment can be orphaned from its order)
        const orderRepo = AppDataSource.getRepository(Order);
        const order = payment.order
          ? await orderRepo.findOne({
              where: { id: payment.order.id },
              relations: ['user', 'vendor', 'vendor.user'],
            })
          : null;
        
        if (order && order.status === OrderStatus.PENDING) {
          order.status = OrderStatus.CONFIRMED;
          await orderRepo.save(order);
          emitOrderUpdate(order);
          
          // Notify customer
          await notify(
            payment.user.id,
            "Payment Successful 💳",
            `Payment of ₦${payment.amount} confirmed for order #${order.orderNumber}`,
            NotificationType.PAYMENT_SUCCESS,
            order.id
          );
        }
      }
    }
    
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

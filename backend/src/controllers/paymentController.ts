import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Payment, PaymentStatus, PaymentMethod } from "../entities/Payment";
import { Order, OrderStatus } from "../entities/Order";
import { Notification, NotificationType } from "../entities/Notification";
import { AuthRequest } from "../middleware/auth";
import { emitOrderUpdate, emitNotification } from "../config/socket";
import { v4 as uuidv4 } from "uuid";
import https from "https";

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
    const { orderId, method } = req.body;

    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOne({
      where: { id: orderId, user: { id: req.user!.id } },
      relations: ["vendor", "vendor.user"],
    });

    if (!order) { res.status(404).json({ success: false, message: "Order not found" }); return; }

    if (order.status !== OrderStatus.PENDING) {
      res.status(400).json({ success: false, message: "This order cannot be paid at its current stage" });
      return;
    }

    const paymentRepo = AppDataSource.getRepository(Payment);
    const existingPaid = await paymentRepo.findOne({
      where: { order: { id: order.id }, status: PaymentStatus.SUCCESS },
    });
    if (existingPaid) {
      res.status(400).json({ success: false, message: "This order has already been paid" });
      return;
    }

    const reference = `SK-${uuidv4().replace(/-/g, "").substring(0, 12).toUpperCase()}`;

    const payment = paymentRepo.create({
      reference,
      amount: order.total,
      method: method || PaymentMethod.PAYSTACK,
      order,
      user: req.user,
      status: PaymentStatus.PENDING,
    });
    await paymentRepo.save(payment);

    if (method === PaymentMethod.CASH_ON_DELIVERY) {
      order.status = OrderStatus.CONFIRMED;
      await orderRepo.save(order);
      emitOrderUpdate(order);
      await notify(req.user!.id, "Order Confirmed ✅", `Your cash-on-delivery order #${order.orderNumber} is confirmed!`, NotificationType.ORDER_CONFIRMED, order.id);
      res.json({ success: true, message: "Cash on delivery order confirmed", data: { reference, orderId: order.id } });
      return;
    }

    // Paystack initialization
    const params = JSON.stringify({
      email: req.user!.email,
      amount: Math.round(Number(order.total) * 100),
      reference,
      callback_url: `${process.env.FRONTEND_URL}/payment/verify?reference=${reference}`,
      metadata: { orderId: order.id, userId: req.user!.id, orderNumber: order.orderNumber },
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

    const paystackReq = https.request(options, (paystackRes) => {
      let data = "";
      paystackRes.on("data", (chunk) => (data += chunk));
      paystackRes.on("end", () => {
        let response: any;
        try {
          response = JSON.parse(data);
        } catch {
          res.status(500).json({ success: false, message: "Invalid payment service response" });
          return;
        }
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
        } else {
          res.status(400).json({ success: false, message: "Payment initialization failed" });
        }
      });
    });

    paystackReq.on("error", () => res.status(500).json({ success: false, message: "Payment service error" }));
    paystackReq.write(params);
    paystackReq.end();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reference = req.params.reference as string;

    const options = {
      hostname: "api.paystack.co",
      port: 443,
      path: `/transaction/verify/${encodeURIComponent(reference)}`,
      method: "GET",
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    };

    const paystackReq = https.get(options, (paystackRes) => {
      let data = "";
      paystackRes.on("data", (chunk) => (data += chunk));
      paystackRes.on("end", async () => {
        let response: any;
        try {
          response = JSON.parse(data);
        } catch {
          res.status(500).json({ success: false, message: "Invalid payment service response" });
          return;
        }

        const paymentRepo = AppDataSource.getRepository(Payment);
        const payment = await paymentRepo.findOne({
          where: { reference },
          relations: ["order", "order.vendor", "order.vendor.user", "user"],
        });

        if (!payment) { res.status(404).json({ success: false, message: "Payment not found" }); return; }

        if (payment.status === PaymentStatus.SUCCESS) {
          res.json({
            success: true,
            message: "Payment already verified",
            data: { payment, orderId: payment.order.id },
          });
          return;
        }

        if (response.data?.status === "success") {
          const paidAmount = Number(response.data.amount) / 100;
          if (Math.abs(paidAmount - Number(payment.amount)) > 0.01) {
            payment.status = PaymentStatus.FAILED;
            await paymentRepo.save(payment);
            res.status(400).json({ success: false, message: "Payment amount mismatch" });
            return;
          }

          payment.status = PaymentStatus.SUCCESS;
          payment.paystackReference = response.data.reference;
          payment.metadata = response.data;
          await paymentRepo.save(payment);

          const orderRepo = AppDataSource.getRepository(Order);
          const order = await orderRepo.findOne({
            where: { id: payment.order.id },
            relations: ["user", "vendor", "vendor.user"],
          });
          if (order) {
            order.status = OrderStatus.CONFIRMED;
            await orderRepo.save(order);
            emitOrderUpdate(order);
          }

          await notify(payment.user.id, "Payment Successful 💳", `Payment of ₦${payment.amount} confirmed for order #${payment.order.orderNumber || ""}`, NotificationType.PAYMENT_SUCCESS, payment.order.id);

          res.json({ success: true, message: "Payment verified", data: { payment, orderId: payment.order.id } });
        } else {
          payment.status = PaymentStatus.FAILED;
          await paymentRepo.save(payment);
          await notify(payment.user.id, "Payment Failed ❌", "Your payment could not be processed. Please try again.", NotificationType.PAYMENT_FAILED, payment.order.id);
          res.status(400).json({ success: false, message: "Payment verification failed" });
        }
      });
    });

    paystackReq.on("error", () => res.status(500).json({ success: false, message: "Payment verification failed" }));
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
      where: { id: String(req.params.id), user: { id: req.user!.id } },
      relations: ["order", "order.items", "order.items.product", "order.vendor", "user"],
    });

    if (!payment) { res.status(404).json({ success: false, message: "Payment not found" }); return; }
    res.json({ success: true, data: payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

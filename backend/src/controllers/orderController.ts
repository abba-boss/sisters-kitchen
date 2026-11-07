import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Order, OrderStatus, FulfillmentType } from "../entities/Order";
import { OrderItem } from "../entities/OrderItem";
import { Product } from "../entities/Product";
import { Vendor, VendorStatus } from "../entities/Vendor";
import { Notification, NotificationType } from "../entities/Notification";
import { AuthRequest } from "../middleware/auth";
import { generateOrderNumber } from "../utils/helpers";
import { UserRole } from "../entities/User";
import {
  emitOrderUpdate,
  emitNotification,
  emitToAdmins,
  emitToUser,
} from "../config/socket";
import { updateVendorEarnings } from "../services/commissionService";
import { sendEmail, emailTemplates } from "../config/email";
import {
  DELIVERY_FEE,
  OrderError,
  restoreOrderStock,
  sanitizeOrders,
  stripSensitiveUserFields,
} from "../utils/orderHelpers";
import crypto from "crypto";

// ─── Notification helper ──────────────────────────────────────
async function createAndEmitNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  referenceId: string
) {
  const notifRepo = AppDataSource.getRepository(Notification);
  const { User: UserEntity } = await import("../entities/User");
  const userRepo = AppDataSource.getRepository(UserEntity);
  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) return;

  const notif = notifRepo.create({ user, title, message, type, referenceId });
  await notifRepo.save(notif);
  emitNotification(userId, notif);
  return notif;
}

/** Allowed status changes. Anything else is rejected instead of silently applied. */
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

const STATUS_MESSAGES: Record<string, { title: string; msg: string; type: NotificationType }> = {
  confirmed: { title: "Order Confirmed ✅", msg: "has been confirmed!", type: NotificationType.ORDER_CONFIRMED },
  preparing: { title: "Order Being Prepared 👩‍🍳", msg: "is being freshly prepared.", type: NotificationType.ORDER_PREPARING },
  ready: { title: "Order Ready! 🎉", msg: "is ready for delivery.", type: NotificationType.ORDER_READY },
  out_for_delivery: { title: "On the Way 🛵", msg: "is out for delivery!", type: NotificationType.ORDER_DELIVERED },
  delivered: { title: "Order Delivered! 🍽️", msg: "has been delivered. Enjoy your meal!", type: NotificationType.ORDER_DELIVERED },
  cancelled: { title: "Order Cancelled", msg: "was cancelled.", type: NotificationType.ORDER_CANCELLED },
};

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      items,
      deliveryAddress,
      deliveryPhone,
      notes,
      vendorId,
      fulfillmentType = FulfillmentType.DELIVERY,
    } = req.body ?? {};

    // ── Request validation (route validators run too, this keeps the controller safe) ──
    if (!vendorId) {
      res.status(400).json({ success: false, message: "Vendor is required" });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: "Your cart is empty" });
      return;
    }

    if (
      fulfillmentType !== FulfillmentType.DELIVERY &&
      fulfillmentType !== FulfillmentType.PICKUP
    ) {
      res.status(400).json({ success: false, message: "Invalid fulfillment type" });
      return;
    }

    const vendorRepo = AppDataSource.getRepository(Vendor);
    const vendor = await vendorRepo.findOne({ where: { id: vendorId }, relations: ["user"] });

    if (!vendor) {
      res.status(404).json({ success: false, message: "Vendor not found" });
      return;
    }

    if (vendor.status !== VendorStatus.APPROVED) {
      res.status(400).json({
        success: false,
        message: "This vendor is not accepting orders right now",
      });
      return;
    }

    // ── Pickup / delivery requirements ────────────────────────
    if (fulfillmentType === FulfillmentType.PICKUP) {
      if (vendor.pickupLatitude == null || vendor.pickupLongitude == null) {
        res.status(400).json({
          success: false,
          message:
            "This vendor does not offer pickup service yet. Please choose delivery or contact the vendor.",
        });
        return;
      }
    } else if (!deliveryAddress || !String(deliveryAddress).trim()) {
      res.status(400).json({
        success: false,
        message: "Delivery address is required for delivery orders",
      });
      return;
    }

    // ── Normalise the cart lines (same product twice → one line) ──
    const quantityByProduct = new Map<string, number>();
    for (const raw of items) {
      const productId = raw?.productId;
      const quantity = Number(raw?.quantity);
      if (!productId || !Number.isInteger(quantity) || quantity < 1) {
        res.status(400).json({
          success: false,
          message: "Every item needs a valid product and a quantity of at least 1",
        });
        return;
      }
      quantityByProduct.set(productId, (quantityByProduct.get(productId) ?? 0) + quantity);
    }

    const deliveryFee = fulfillmentType === FulfillmentType.PICKUP ? 0 : DELIVERY_FEE;
    const pickupToken =
      fulfillmentType === FulfillmentType.PICKUP ? crypto.randomBytes(32).toString("hex") : null;
    const pickupPin =
      fulfillmentType === FulfillmentType.PICKUP
        ? Math.floor(100000 + Math.random() * 900000).toString()
        : null;

    // ── Stock reservation + order creation happen in one transaction ──
    const orderId = await AppDataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const orderItemRepo = manager.getRepository(OrderItem);
      const orderRepo = manager.getRepository(Order);

      let subtotal = 0;
      const orderItems: OrderItem[] = [];

      for (const [productId, quantity] of quantityByProduct) {
        const product = await productRepo.findOne({
          where: { id: productId },
          relations: ["vendor"],
        });

        if (!product) {
          throw new OrderError(404, "One or more products in your cart no longer exist");
        }

        if (!product.vendor || product.vendor.id !== vendor.id) {
          throw new OrderError(
            400,
            `"${product.name}" is not sold by ${vendor.businessName}. Please order each vendor separately.`
          );
        }

        if (!product.isAvailable) {
          throw new OrderError(400, `"${product.name}" is no longer available`);
        }

        // Conditional decrement: never sell more than is in stock, even under concurrency.
        const stockUpdate = await productRepo
          .createQueryBuilder()
          .update(Product)
          .set({ stock: () => `stock - ${quantity}` })
          .where("id = :productId", { productId })
          .andWhere("stock >= :quantity", { quantity })
          .execute();

        if (!stockUpdate.affected) {
          throw new OrderError(
            400,
            `Insufficient stock for "${product.name}". Please lower the quantity or remove it from your cart.`
          );
        }

        const unitPrice = Number(product.discountPrice) || Number(product.price);
        const itemSubtotal = unitPrice * quantity;
        subtotal += itemSubtotal;

        orderItems.push(
          orderItemRepo.create({ product, quantity, price: unitPrice, subtotal: itemSubtotal })
        );
      }

      const order = orderRepo.create({
        orderNumber: generateOrderNumber(),
        user: req.user,
        vendor,
        items: orderItems,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        deliveryAddress:
          fulfillmentType === FulfillmentType.DELIVERY ? String(deliveryAddress).trim() : null,
        deliveryPhone,
        notes,
        status: OrderStatus.PENDING,
        fulfillmentType,
        pickupToken,
        pickupPin,
      });

      const saved = await orderRepo.save(order);
      return saved.id;
    });

    // ── Post-commit side effects (never fail the order) ────────
    const orderRepo = AppDataSource.getRepository(Order);
    const fullOrder = await orderRepo.findOne({
      where: { id: orderId },
      relations: ["user", "vendor", "vendor.user", "items", "items.product"],
    });

    if (fullOrder) {
      // Vendors listen for "order:new" on their dashboard.
      if (vendor.user) emitToUser(vendor.user.id, "order:new", { order: fullOrder });
      emitToAdmins("order:new", { order: fullOrder });

      await createAndEmitNotification(
        vendor.user.id,
        "New Order Received! 🛎️",
        `Order #${fullOrder.orderNumber} just came in!`,
        NotificationType.NEW_ORDER,
        fullOrder.id
      );

      // Fire-and-forget: slow SMTP must not delay or fail the order response.
      sendEmail(
        req.user!.email,
        emailTemplates.orderConfirmation(
          fullOrder.orderNumber,
          req.user!.firstName,
          Number(fullOrder.total)
        )
      ).catch(() => undefined);
      sendEmail(
        vendor.user.email,
        emailTemplates.newOrderVendor(
          fullOrder.orderNumber,
          vendor.businessName,
          quantityByProduct.size,
          Number(fullOrder.total)
        )
      ).catch(() => undefined);
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: fullOrder ? stripSensitiveUserFields(fullOrder) : null,
    });
  } catch (error: any) {
    if (error instanceof OrderError) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const orderRepo = AppDataSource.getRepository(Order);
    const qb = orderRepo
      .createQueryBuilder("order")
      .leftJoinAndSelect("order.vendor", "vendor")
      .leftJoinAndSelect("order.items", "items")
      .leftJoinAndSelect("items.product", "product")
      .where("order.user = :userId", { userId: req.user!.id });

    if (status) qb.andWhere("order.status = :status", { status });

    const [orders, total] = await qb
      .skip(skip).take(Number(limit)).orderBy("order.createdAt", "DESC").getManyAndCount();

    res.json({ success: true, data: sanitizeOrders(orders), meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOne({
      where: { id: req.params.id as string },
      relations: ["user", "vendor", "vendor.user", "items", "items.product", "payments"],
    });

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    const isOwner = order.user.id === req.user!.id;
    const isVendorOwner = order.vendor?.user?.id === req.user!.id;
    const isAdmin = req.user!.role === UserRole.ADMIN;

    if (!isOwner && !isVendorOwner && !isAdmin) {
      res.status(403).json({ success: false, message: "Not authorized" });
      return;
    }

    res.json({ success: true, data: stripSensitiveUserFields(order) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVendorOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const vendorRepo = AppDataSource.getRepository(Vendor);
    const vendor = await vendorRepo.findOne({ where: { user: { id: req.user!.id } } });
    if (!vendor) { res.status(404).json({ success: false, message: "Vendor not found" }); return; }

    const orderRepo = AppDataSource.getRepository(Order);
    const qb = orderRepo
      .createQueryBuilder("order")
      .leftJoinAndSelect("order.user", "user")
      .leftJoinAndSelect("order.items", "items")
      .leftJoinAndSelect("items.product", "product")
      .where("order.vendor = :vendorId", { vendorId: vendor.id });

    if (status) qb.andWhere("order.status = :status", { status });

    // Date range filtering
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      qb.andWhere("order.createdAt >= :start", { start })
        .andWhere("order.createdAt <= :end", { end });
    }

    const [orders, total] = await qb
      .skip(skip).take(Number(limit)).orderBy("order.createdAt", "DESC").getManyAndCount();

    res.json({ success: true, data: sanitizeOrders(orders), meta: { total, page: Number(page), limit: Number(limit) } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, rejectionReason, estimatedDeliveryTime } = req.body ?? {};

    if (!status || !Object.values(OrderStatus).includes(status)) {
      res.status(400).json({ success: false, message: "Invalid order status" });
      return;
    }

    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOne({
      where: { id: req.params.id as string },
      relations: ["user", "vendor", "vendor.user", "items", "items.product"],
    });

    if (!order) { res.status(404).json({ success: false, message: "Order not found" }); return; }

    const isAdmin = req.user!.role === UserRole.ADMIN;
    const isVendorOwner = order.vendor?.user?.id === req.user!.id;

    // A vendor may only manage its own orders.
    if (!isAdmin && !isVendorOwner) {
      res.status(403).json({ success: false, message: "Not authorized to update this order" });
      return;
    }

    const prevStatus = order.status;

    if (status === prevStatus) {
      res.status(400).json({
        success: false,
        message: `Order is already ${prevStatus.replace(/_/g, " ")}`,
      });
      return;
    }

    if (!isAdmin && !STATUS_TRANSITIONS[prevStatus]?.includes(status as OrderStatus)) {
      res.status(400).json({
        success: false,
        message: `Cannot change order from "${prevStatus}" to "${status}"`,
      });
      return;
    }

    // Pickup orders must be completed by scanning the pickup code, not by a status tap.
    if (
      status === OrderStatus.DELIVERED &&
      order.fulfillmentType === FulfillmentType.PICKUP &&
      !order.pickupVerifiedAt
    ) {
      res.status(400).json({
        success: false,
        message: "Use the pickup verification (QR code or PIN) to complete this order",
      });
      return;
    }

    order.status = status as OrderStatus;
    if (rejectionReason) order.rejectionReason = rejectionReason;
    if (status === OrderStatus.CANCELLED && !rejectionReason) order.rejectionReason = "Order cancelled";
    if (estimatedDeliveryTime) order.estimatedDeliveryTime = estimatedDeliveryTime;

    await orderRepo.save(order);

    // ── Restore stock on cancellation ─────────────────────────
    if (status === OrderStatus.CANCELLED) {
      await restoreOrderStock(order);
    }

    // Update vendor earnings once, when the order is actually delivered.
    if (status === OrderStatus.DELIVERED) {
      const result = await updateVendorEarnings(order.vendor.id, Number(order.total), order.id);
      if (!result.success) {
        console.error("Failed to update vendor earnings:", result.error);
      }
    }

    emitOrderUpdate(order);

    const notifData = STATUS_MESSAGES[status];
    if (notifData && order.user) {
      await createAndEmitNotification(
        order.user.id,
        notifData.title,
        `#${order.orderNumber} ${notifData.msg}${status === OrderStatus.CANCELLED && order.rejectionReason ? ` Reason: ${order.rejectionReason}` : ""}`,
        notifData.type,
        order.id
      );

      sendEmail(
        order.user.email,
        emailTemplates.orderStatusUpdate(
          order.orderNumber,
          order.user.firstName,
          status,
          `${notifData.title} — #${order.orderNumber} ${notifData.msg}`
        )
      ).catch(() => undefined);
    }

    emitToAdmins("order:status_changed", { orderId: order.id, newStatus: status, prevStatus, order });

    res.json({
      success: true,
      message: "Order status updated",
      data: stripSensitiveUserFields(order),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const orderRepo = AppDataSource.getRepository(Order);
    const qb = orderRepo
      .createQueryBuilder("order")
      .leftJoinAndSelect("order.user", "user")
      .leftJoinAndSelect("order.vendor", "vendor")
      .leftJoinAndSelect("order.items", "items");

    if (status) qb.where("order.status = :status", { status });

    const [orders, total] = await qb
      .skip(skip).take(Number(limit)).orderBy("order.createdAt", "DESC").getManyAndCount();

    res.json({ success: true, data: sanitizeOrders(orders), meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyPickup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body ?? {};
    const { id: orderId } = req.params;

    if (!token) {
      res.status(400).json({ success: false, message: "Pickup token is required" });
      return;
    }

    const orderRepo = AppDataSource.getRepository(Order);
    // `payments` is loaded separately: saving an Order with its payments collection
    // loaded makes TypeORM rewrite those rows and detach them (orderId = NULL).
    const order = await orderRepo.findOne({
      where: { id: orderId as string },
      relations: ["user", "vendor", "vendor.user", "items", "items.product"],
    });

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    // ── Validate vendor ownership ─────────────────────────────
    if (order.vendor?.user?.id !== req.user!.id) {
      res.status(403).json({ success: false, message: "You are not authorized to verify this order" });
      return;
    }

    // ── Validate fulfillment type ─────────────────────────────
    if (order.fulfillmentType !== FulfillmentType.PICKUP) {
      res.status(400).json({ success: false, message: "This is not a pickup order" });
      return;
    }

    // ── Validate token or PIN ─────────────────────────────────
    const tokenMatches = order.pickupToken === token;
    const pinMatches = order.pickupPin === token;

    if (!tokenMatches && !pinMatches) {
      res.status(400).json({ success: false, message: "Invalid pickup code" });
      return;
    }

    if (order.pickupVerifiedAt) {
      res.status(400).json({
        success: false,
        message: "This order has already been picked up",
        data: { verifiedAt: order.pickupVerifiedAt },
      });
      return;
    }

    if (order.status !== OrderStatus.READY) {
      res.status(400).json({
        success: false,
        message: `Order must be in 'ready' status. Current status: ${order.status}`,
      });
      return;
    }

    // For pickup orders: allow COD (pay on pickup) or already paid orders
    const paymentRepo = AppDataSource.getRepository(
      (await import("../entities/Payment")).Payment
    );
    const orderPayments = await paymentRepo.find({ where: { order: { id: order.id } } });
    const hasPaidPayment = orderPayments.some((p) => p.status === "success");
    const codPayment = orderPayments.find((p) => p.method === "cash_on_delivery");

    if (!hasPaidPayment && !codPayment) {
      res.status(400).json({
        success: false,
        message: "Order must have a payment method before pickup",
      });
      return;
    }

    // ── Mark as verified and delivered ────────────────────────
    order.pickupVerifiedAt = new Date();
    order.pickupVerifiedBy = req.user!.id;
    order.status = OrderStatus.DELIVERED;
    await orderRepo.save(order);

    // ── Collect cash on pickup ────────────────────────────────
    if (!hasPaidPayment && codPayment) {
      codPayment.status = "success" as any;
      await paymentRepo.save(codPayment);
    }

    // Vendor earnings (with platform commission) — same rule as delivery.
    const earnings = await updateVendorEarnings(order.vendor.id, Number(order.total), order.id);
    if (!earnings.success) {
      console.error("Failed to update vendor earnings:", earnings.error);
    }

    emitOrderUpdate(order);

    await createAndEmitNotification(
      order.user.id,
      "Order Picked Up! 🎉",
      `Your order #${order.orderNumber} has been picked up. Enjoy your meal!`,
      NotificationType.ORDER_DELIVERED,
      order.id
    );

    res.json({
      success: true,
      message: "Pickup verified successfully! Order marked as delivered.",
      data: stripSensitiveUserFields(order),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

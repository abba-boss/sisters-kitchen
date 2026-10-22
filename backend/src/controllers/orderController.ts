import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Order, OrderStatus, FulfillmentType } from "../entities/Order";
import { OrderItem } from "../entities/OrderItem";
import { Product } from "../entities/Product";
import { Vendor } from "../entities/Vendor";
import { Notification, NotificationType } from "../entities/Notification";
import { AuthRequest } from "../middleware/auth";
import { generateOrderNumber } from "../utils/helpers";
import { UserRole } from "../entities/User";
import { emitOrderUpdate, emitNotification, emitToAdmins } from "../config/socket";
import { updateVendorEarnings } from "../services/commissionService";
import { sendEmail, emailTemplates } from "../config/email";
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

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items, deliveryAddress, deliveryPhone, notes, vendorId, fulfillmentType = FulfillmentType.DELIVERY } = req.body;

    const vendorRepo = AppDataSource.getRepository(Vendor);
    const vendor = await vendorRepo.findOne({ where: { id: vendorId }, relations: ["user"] });

    if (!vendor) {
      res.status(404).json({ success: false, message: "Vendor not found" });
      return;
    }

    // ── Validate pickup location if pickup order ──────────────
    if (fulfillmentType === FulfillmentType.PICKUP) {
      if (!vendor.pickupLatitude || !vendor.pickupLongitude) {
        res.status(400).json({ 
          success: false, 
          message: "This vendor does not offer pickup service yet. Please choose delivery or contact the vendor." 
        });
        return;
      }
    }

    // ── Validate delivery address if delivery order ───────────
    if (fulfillmentType === FulfillmentType.DELIVERY && !deliveryAddress) {
      res.status(400).json({ 
        success: false, 
        message: "Delivery address is required for delivery orders" 
      });
      return;
    }

    const productRepo = AppDataSource.getRepository(Product);
    let subtotal = 0;
    const orderItems: Partial<OrderItem>[] = [];

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
    const deliveryFee = fulfillmentType === FulfillmentType.PICKUP ? 0 : 500;
    const total = subtotal + deliveryFee;

    // ── Generate pickup token and PIN if pickup order ─────────────────
    // Token: Long secure string for QR code
    // PIN: Short 6-digit code for manual entry
    const pickupToken = fulfillmentType === FulfillmentType.PICKUP 
      ? crypto.randomBytes(32).toString('hex')
      : null;
    
    const pickupPin = fulfillmentType === FulfillmentType.PICKUP
      ? Math.floor(100000 + Math.random() * 900000).toString() // 6-digit number
      : null;

    const orderRepo = AppDataSource.getRepository(Order);
    const order = orderRepo.create({
      orderNumber: generateOrderNumber(),
      user: req.user,
      vendor,
      items: orderItems as OrderItem[],
      subtotal,
      deliveryFee,
      total,
      deliveryAddress: fulfillmentType === FulfillmentType.DELIVERY ? deliveryAddress : null,
      deliveryPhone,
      notes,
      status: OrderStatus.PENDING,
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
    emitToAdmins("order:new", { order: fullOrder });
    await createAndEmitNotification(
      vendor.user.id,
      "New Order Received! 🛎️",
      `Order #${order.orderNumber} just came in!`,
      NotificationType.NEW_ORDER,
      order.id
    );

    // Send confirmation emails
    await sendEmail(
      req.user!.email,
      emailTemplates.orderConfirmation(order.orderNumber, req.user!.firstName, Number(order.total))
    );
    await sendEmail(
      vendor.user.email,
      emailTemplates.newOrderVendor(order.orderNumber, vendor.businessName, items.length, Number(order.total))
    );

    res.status(201).json({ success: true, message: "Order placed successfully", data: fullOrder });
  } catch (error: any) {
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

    res.json({ success: true, data: orders, meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } });
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

    res.json({ success: true, data: order });
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

    res.json({ success: true, data: orders, meta: { total, page: Number(page), limit: Number(limit) } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, rejectionReason, estimatedDeliveryTime } = req.body;
    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOne({
      where: { id: req.params.id as string },
      relations: ["user", "vendor", "vendor.user", "items", "items.product"],
    });

    if (!order) { res.status(404).json({ success: false, message: "Order not found" }); return; }

    const prevStatus = order.status;
    order.status = status;
    if (rejectionReason) order.rejectionReason = rejectionReason;
    if (estimatedDeliveryTime) order.estimatedDeliveryTime = estimatedDeliveryTime;

    await orderRepo.save(order);

    // ── Restore Stock on Cancellation ─────────────────────────
    if (status === OrderStatus.CANCELLED && prevStatus !== OrderStatus.CANCELLED) {
      const productRepo = AppDataSource.getRepository(Product);
      for (const item of order.items) {
        const product = await productRepo.findOne({ where: { id: item.product.id } });
        if (product) {
          product.stock += item.quantity;
          await productRepo.save(product);
        }
      }
    }

    // Update vendor earnings on delivery with commission deduction
    if (status === OrderStatus.DELIVERED) {
      const result = await updateVendorEarnings(order.vendor.id, Number(order.total), order.id);
      if (!result.success) {
        console.error('Failed to update vendor earnings:', result.error);
      }
    }

    // ── Emit real-time socket event ──────────────────────────
    emitOrderUpdate(order);

    // ── Customer notification ────────────────────────────────
    const statusMessages: Record<string, { title: string; msg: string; type: NotificationType }> = {
      confirmed: { title: "Order Confirmed ✅", msg: `Your order #${order.orderNumber} has been confirmed!`, type: NotificationType.ORDER_CONFIRMED },
      preparing: { title: "Order Being Prepared 👩‍🍳", msg: `#${order.orderNumber} is being freshly prepared.`, type: NotificationType.ORDER_PREPARING },
      ready: { title: "Order Ready! 🎉", msg: `#${order.orderNumber} is ready for delivery.`, type: NotificationType.ORDER_READY },
      out_for_delivery: { title: "On the Way 🛵", msg: `#${order.orderNumber} is out for delivery!`, type: NotificationType.ORDER_DELIVERED },
      delivered: { title: "Order Delivered! 🍽️", msg: `#${order.orderNumber} has been delivered. Enjoy your meal!`, type: NotificationType.ORDER_DELIVERED },
      cancelled: { title: "Order Cancelled", msg: `#${order.orderNumber} was cancelled. ${rejectionReason || ""}`, type: NotificationType.ORDER_CANCELLED },
    };

    const notifData = statusMessages[status];
    if (notifData) {
      await createAndEmitNotification(order.user.id, notifData.title, notifData.msg, notifData.type, order.id);
      
      // Send email notification for status update
      await sendEmail(
        order.user.email,
        emailTemplates.orderStatusUpdate(order.orderNumber, order.user.firstName, status, notifData.msg)
      );
    }

    // Emit to admin room
    emitToAdmins("order:status_changed", { orderId: order.id, newStatus: status, prevStatus, order });

    res.json({ success: true, message: "Order status updated", data: order });
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

    res.json({ success: true, data: orders, meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const verifyPickup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    const { id: orderId } = req.params;

    if (!token) {
      res.status(400).json({ success: false, message: "Pickup token is required" });
      return;
    }

    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOne({
      where: { id: orderId as string },
      relations: ["user", "vendor", "vendor.user", "items", "items.product", "payments"],
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
    if (order.status !== OrderStatus.READY) {
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
    order.pickupVerifiedBy = req.user!.id;
    order.status = OrderStatus.DELIVERED;
    await orderRepo.save(order);

    // ── Mark COD payment as success on pickup ─────────────────
    if (hasCODPayment && !hasPaidPayment) {
      const Payment = AppDataSource.getRepository(await import("../entities/Payment").then(m => m.Payment));
      const codPayment = order.payments?.find(p => p.method === 'cash_on_delivery');
      if (codPayment) {
        codPayment.status = 'success' as any;
        await Payment.save(codPayment);
      }
    }

    // Update vendor stats
    const vendorRepo = AppDataSource.getRepository(Vendor);
    const vendor = await vendorRepo.findOne({ where: { id: order.vendor.id } });
    if (vendor) {
      vendor.totalOrders += 1;
      vendor.totalEarnings = Number(vendor.totalEarnings) + Number(order.total);
      await vendorRepo.save(vendor);
    }

    // Emit real-time update
    emitOrderUpdate(order);

    // Notify customer
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
      data: order 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

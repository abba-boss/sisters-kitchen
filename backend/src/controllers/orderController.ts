import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Order, OrderStatus } from "../entities/Order";
import { OrderItem } from "../entities/OrderItem";
import { Product } from "../entities/Product";
import { Vendor } from "../entities/Vendor";
import { Notification, NotificationType } from "../entities/Notification";
import { AuthRequest } from "../middleware/auth";
import { generateOrderNumber } from "../utils/helpers";
import { UserRole } from "../entities/User";
import { emitOrderUpdate, emitNotification, emitToAdmins } from "../config/socket";

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
    const { items, deliveryAddress, deliveryPhone, notes, vendorId } = req.body;

    const vendorRepo = AppDataSource.getRepository(Vendor);
    const vendor = await vendorRepo.findOne({ where: { id: vendorId }, relations: ["user"] });

    if (!vendor) {
      res.status(404).json({ success: false, message: "Vendor not found" });
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
      const price = Number(product.discountPrice) || Number(product.price);
      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;
      orderItems.push({ product, quantity: item.quantity, price, subtotal: itemSubtotal, notes: item.notes });
    }

    const deliveryFee = 500;
    const total = subtotal + deliveryFee;

    const orderRepo = AppDataSource.getRepository(Order);
    const order = orderRepo.create({
      orderNumber: generateOrderNumber(),
      user: req.user,
      vendor,
      items: orderItems as OrderItem[],
      subtotal,
      deliveryFee,
      total,
      deliveryAddress,
      deliveryPhone,
      notes,
      status: OrderStatus.PENDING,
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
    const { page = 1, limit = 10, status } = req.query;
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

    // Update vendor earnings on delivery
    if (status === OrderStatus.DELIVERED) {
      const vendorRepo = AppDataSource.getRepository(Vendor);
      const vendor = await vendorRepo.findOne({ where: { id: order.vendor.id } });
      if (vendor) {
        vendor.totalOrders += 1;
        vendor.totalEarnings = Number(vendor.totalEarnings) + Number(order.total);
        await vendorRepo.save(vendor);
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

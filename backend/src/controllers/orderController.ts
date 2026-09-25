import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Order, OrderStatus } from "../entities/Order";
import { OrderItem } from "../entities/OrderItem";
import { Product } from "../entities/Product";
import { Vendor, VendorStatus } from "../entities/Vendor";
import { Notification, NotificationType } from "../entities/Notification";
import { AuthRequest } from "../middleware/auth";
import { generateOrderNumber } from "../utils/helpers";
import { publicOrder } from "../utils/serializers";
import { UserRole } from "../entities/User";
import { emitOrderUpdate, emitNotification, emitToAdmins, emitToUser } from "../config/socket";
import { creditCoins, REWARD_RATES } from "./rewardController";
import { RewardTxType } from "../entities/RewardTransaction";

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

/** Give back stock that was reserved when the order was created. */
async function restoreReservedStock(order: Order): Promise<void> {
  const productRepo = AppDataSource.getRepository(Product);
  for (const item of order.items || []) {
    if (item.stockBefore == null || !item.product) continue;
    await productRepo
      .createQueryBuilder()
      .update(Product)
      .set({ stock: () => `stock + ${item.quantity}` })
      .where("id = :productId", { productId: item.product.id })
      .execute();
  }
}

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
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: "Your cart is empty" });
      return;
    }

    const vendorRepo = AppDataSource.getRepository(Vendor);
    const vendor = await vendorRepo.findOne({ where: { id: vendorId }, relations: ["user"] });

    if (!vendor) {
      res.status(404).json({ success: false, message: "Vendor not found" });
      return;
    }

    if (!vendor.isOpen) {
      res.status(400).json({ success: false, message: "This kitchen is currently closed and not accepting orders" });
      return;
    }

    if (vendor.status !== VendorStatus.APPROVED) {
      res.status(400).json({ success: false, message: "This vendor is not accepting orders" });
      return;
    }

    const productRepo = AppDataSource.getRepository(Product);
    let subtotal = 0;
    const orderItems: Partial<OrderItem>[] = [];

    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        res.status(400).json({ success: false, message: "Invalid item quantity" });
        return;
      }

      const product = await productRepo.findOne({
        where: { id: item.productId },
        relations: ["vendor"],
      });
      if (!product) {
        res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
        return;
      }
      if (product.vendor.id !== vendorId) {
        res.status(400).json({
          success: false,
          message: `"${product.name}" does not belong to this vendor`,
        });
        return;
      }
      if (!product.isAvailable) {
        res.status(400).json({
          success: false,
          message: `"${product.name}" is no longer available`,
        });
        return;
      }
      if (product.stock > 0 && quantity > product.stock) {
        res.status(400).json({
          success: false,
          message: `Only ${product.stock} of "${product.name}" left in stock`,
        });
        return;
      }
      const price = Number(product.discountPrice) || Number(product.price);
      const itemSubtotal = price * quantity;
      subtotal += itemSubtotal;
      orderItems.push({
        product,
        quantity,
        price,
        subtotal: itemSubtotal,
        notes: item.notes,
        stockBefore: product.stock > 0 ? product.stock : null,
      });
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

    // Reserve stock atomically after the order exists. A conditional update
    // prevents two concurrent checkouts from claiming the last portions.
    const reservedStock: Array<{ productId: string; quantity: number }> = [];
    for (const item of orderItems) {
      const quantity = Number(item.quantity);
      if (item.product && item.product.stock > 0) {
        const stockUpdate = await productRepo
          .createQueryBuilder()
          .update(Product)
          .set({ stock: () => `stock - ${quantity}` })
          .where("id = :productId AND stock >= :quantity", {
            productId: item.product.id,
            quantity,
          })
          .execute();

        if (stockUpdate.affected !== 1) {
          for (const reserved of reservedStock) {
            await productRepo
              .createQueryBuilder()
              .update(Product)
              .set({ stock: () => `stock + ${reserved.quantity}` })
              .where("id = :productId", { productId: reserved.productId })
              .execute();
          }
          await orderRepo.remove(order);
          res.status(409).json({
            success: false,
            message: `"${item.product.name}" just sold out. Your cart was not charged.`,
          });
          return;
        }
        reservedStock.push({ productId: item.product.id, quantity });
      }
    }

    // Reload with relations for socket payload
    const fullOrder = await orderRepo.findOne({
      where: { id: order.id },
      relations: ["user", "vendor", "vendor.user", "items", "items.product"],
    });

    const orderDto = publicOrder(fullOrder);
    emitToUser(vendor.user.id, "order:new", { order: orderDto });
    emitToAdmins("order:new", { order: orderDto });
    await createAndEmitNotification(
      vendor.user.id,
      "New Order Received! 🛎️",
      `Order #${order.orderNumber} just came in!`,
      NotificationType.NEW_ORDER,
      order.id
    );

    res.status(201).json({ success: true, message: "Order placed successfully", data: orderDto });
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

    res.json({ success: true, data: orders.map(publicOrder), meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } });
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

    res.json({ success: true, data: publicOrder(order) });
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

    res.json({ success: true, data: orders.map(publicOrder), meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelMyOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOne({
      where: { id: req.params.id as string, user: { id: req.user!.id } },
      relations: ["user", "vendor", "vendor.user", "items", "items.product"],
    });

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }
    if (order.status === OrderStatus.CANCELLED) {
      res.json({ success: true, message: "Order already cancelled", data: publicOrder(order) });
      return;
    }
    if (!ORDER_TRANSITIONS[order.status]?.includes(OrderStatus.CANCELLED)) {
      res.status(400).json({
        success: false,
        message: "This order can no longer be cancelled. Please contact the kitchen.",
      });
      return;
    }

    order.status = OrderStatus.CANCELLED;
    order.rejectionReason = "Cancelled by customer";
    await orderRepo.save(order);
    await restoreReservedStock(order);

    emitOrderUpdate(order);
    await createAndEmitNotification(
      order.vendor?.user?.id || order.user.id,
      "Order Cancelled",
      `#${order.orderNumber} was cancelled by the customer.`,
      NotificationType.ORDER_CANCELLED,
      order.id
    );

    res.json({ success: true, message: "Order cancelled", data: publicOrder(order) });
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

    const isAdmin = req.user!.role === UserRole.ADMIN;
    if (!isAdmin) {
      const vendorRepo = AppDataSource.getRepository(Vendor);
      const vendor = await vendorRepo.findOne({ where: { user: { id: req.user!.id } } });
      if (!vendor || order.vendor.id !== vendor.id) {
        res.status(403).json({ success: false, message: "Not authorized to update this order" });
        return;
      }
    }

    if (!Object.values(OrderStatus).includes(status)) {
      res.status(400).json({ success: false, message: "Invalid order status" });
      return;
    }

    const prevStatus = order.status;
    if (!isAdmin && !ORDER_TRANSITIONS[prevStatus]?.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Order cannot move from ${prevStatus} to ${status}`,
      });
      return;
    }
    order.status = status;
    if (rejectionReason) order.rejectionReason = rejectionReason;
    if (estimatedDeliveryTime) order.estimatedDeliveryTime = estimatedDeliveryTime;

    await orderRepo.save(order);

    // Restore finite inventory exactly once when an order is cancelled.
    if (prevStatus !== OrderStatus.CANCELLED && status === OrderStatus.CANCELLED) {
      await restoreReservedStock(order);
    }

    // Update vendor earnings on delivery (once only)
    if (prevStatus !== OrderStatus.DELIVERED && status === OrderStatus.DELIVERED) {
      const vendorRepo = AppDataSource.getRepository(Vendor);
      const vendor = await vendorRepo.findOne({ where: { id: order.vendor.id } });
      if (vendor) {
        vendor.totalOrders += 1;
        vendor.totalEarnings = Number(vendor.totalEarnings) + Number(order.subtotal);
        await vendorRepo.save(vendor);
      }

      // Keep "sold" counts honest for ranking and product cards.
      const productRepo = AppDataSource.getRepository(Product);
      for (const item of order.items || []) {
        if (!item.product) continue;
        await productRepo
          .createQueryBuilder()
          .update(Product)
          .set({ totalOrders: () => `totalOrders + ${item.quantity}` })
          .where("id = :productId", { productId: item.product.id })
          .execute();
      }

      // ── Reward customer with Kitchen Coins ────────────────────
      try {
        const coins = Math.floor(Number(order.total) / 100) * REWARD_RATES.ORDER_PER_100_NAIRA;
        if (coins > 0) {
          await creditCoins(
            order.user.id,
            coins,
            RewardTxType.EARN_ORDER,
            `Earned ${coins} coins for order #${order.orderNumber}`,
            order.id
          );
        }
      } catch (rewardErr) {
        console.error("Reward credit failed (non-fatal):", rewardErr);
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
    const updatedOrderDto = publicOrder(order);
    emitToAdmins("order:status_changed", { orderId: order.id, newStatus: status, prevStatus, order: updatedOrderDto });

    res.json({ success: true, message: "Order status updated", data: updatedOrderDto });
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

    res.json({ success: true, data: orders.map(publicOrder), meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

import { EntityManager } from "typeorm";
import { AppDataSource } from "../config/database";
import { Order, OrderStatus } from "../entities/Order";
import { Product } from "../entities/Product";

/** Flat delivery fee charged per vendor order. */
export const DELIVERY_FEE = 500;

/** Error that carries the HTTP status the API should respond with. */
export class OrderError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "OrderError";
  }
}

/**
 * Orders are loaded with their customer and vendor user relations, and a User
 * entity includes the password hash and refresh token. Never send those to the
 * client.
 */
export function stripSensitiveUserFields<T = any>(payload: T): T {
  const scrub = (entity: any) => {
    if (!entity || typeof entity !== "object") return;
    delete entity.password;
    delete entity.refreshToken;
  };

  const order = payload as any;
  if (!order || typeof order !== "object") return payload;

  scrub(order.user);
  scrub(order.vendor?.user);

  if (Array.isArray(order.items)) {
    order.items.forEach((item: any) => scrub(item?.product?.vendor?.user));
  }

  if (Array.isArray(order.payments)) {
    order.payments.forEach((payment: any) => {
      scrub(payment?.user);
      scrub(payment?.order?.user);
      scrub(payment?.order?.vendor?.user);
    });
  }

  return payload;
}

const scrubList = <T>(orders: T[]): T[] => orders.map((order) => stripSensitiveUserFields(order));

export const sanitizeOrders = scrubList;

/** Put the ordered quantities back into product stock (atomic increment). */
export async function restoreOrderStock(order: Order, manager?: EntityManager): Promise<void> {
  const productRepo = (manager ?? AppDataSource.manager).getRepository(Product);

  for (const item of order.items ?? []) {
    const productId = item.product?.id;
    if (!productId) continue;
    await productRepo.increment({ id: productId }, "stock", item.quantity);
  }
}

/**
 * Cancel an order and release its reserved stock. Used when a payment cannot be
 * started, so a failed checkout never leaves a phantom order holding stock.
 */
export async function cancelOrderAndRestoreStock(
  order: Order,
  reason: string,
  manager?: EntityManager
): Promise<Order> {
  const orderRepo = (manager ?? AppDataSource.manager).getRepository(Order);

  order.status = OrderStatus.CANCELLED;
  order.rejectionReason = reason;
  await orderRepo.save(order);
  await restoreOrderStock(order, manager);

  return order;
}

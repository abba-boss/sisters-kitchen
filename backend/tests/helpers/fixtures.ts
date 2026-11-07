import jwt from "jsonwebtoken";
import { testDataSource } from "../setup";
import { User, UserRole } from "../../src/entities/User";
import { Vendor, VendorStatus } from "../../src/entities/Vendor";
import { Product } from "../../src/entities/Product";
import { Order, OrderStatus, FulfillmentType } from "../../src/entities/Order";
import { OrderItem } from "../../src/entities/OrderItem";
import { Payment, PaymentMethod, PaymentStatus } from "../../src/entities/Payment";

let counter = 0;
const unique = (prefix: string) => `${prefix}.${Date.now().toString(36)}.${++counter}`;

/** Access token the API's authenticate middleware accepts. */
export function tokenFor(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
}

export function authHeader(userOrId: User | string): string {
  return `Bearer ${tokenFor(typeof userOrId === "string" ? userOrId : userOrId.id)}`;
}

export async function makeUser(overrides: Partial<User> = {}): Promise<User> {
  const repo = testDataSource.getRepository(User);
  return repo.save(
    repo.create({
      firstName: "Test",
      lastName: "User",
      email: `${unique("user")}@test.local`,
      // Never compared in these tests; the column just has to be populated.
      password: "not-a-real-hash",
      phone: "+2348000000000",
      role: UserRole.CUSTOMER,
      isActive: true,
      ...overrides,
    })
  );
}

export async function makeVendor(
  user: User,
  overrides: Partial<Vendor> = {}
): Promise<Vendor> {
  const repo = testDataSource.getRepository(Vendor);
  return repo.save(
    repo.create({
      businessName: `Kitchen ${unique("vendor")}`,
      description: "Test kitchen",
      address: "1 Test Street, Lagos",
      user,
      status: VendorStatus.APPROVED,
      isOpen: true,
      ...overrides,
    })
  );
}

export async function makeProduct(
  vendor: Vendor,
  overrides: Partial<Product> = {}
): Promise<Product> {
  const repo = testDataSource.getRepository(Product);
  return repo.save(
    repo.create({
      name: `Dish ${unique("product")}`,
      description: "Test dish",
      price: 1000,
      stock: 10,
      isAvailable: true,
      vendor,
      ...overrides,
    })
  );
}

interface MakeOrderOptions {
  customer: User;
  vendor: Vendor;
  product?: Product;
  status?: OrderStatus;
  total?: number;
  orderNumber?: string;
}

export async function makeOrder(options: MakeOrderOptions): Promise<Order> {
  const { customer, vendor, product, status = OrderStatus.PENDING, total = 1000 } = options;

  const orderRepo = testDataSource.getRepository(Order);
  const itemRepo = testDataSource.getRepository(OrderItem);

  const order = orderRepo.create({
    orderNumber: options.orderNumber ?? `TEST-${unique("order")}`.toUpperCase(),
    status,
    fulfillmentType: FulfillmentType.DELIVERY,
    subtotal: total,
    deliveryFee: 0,
    discount: 0,
    total,
    deliveryAddress: "1 Test Street, Lagos",
    deliveryPhone: "+2348000000000",
    user: customer,
    vendor,
    items: product
      ? [
          itemRepo.create({
            quantity: 1,
            price: total,
            subtotal: total,
            product,
            order: undefined as any,
          }),
        ]
      : [],
  });

  return orderRepo.save(order);
}

interface MakePaymentOptions {
  order: Order;
  customer: User;
  reference?: string;
  amount?: number;
  status?: PaymentStatus;
  method?: PaymentMethod;
}

export async function makePayment(options: MakePaymentOptions): Promise<Payment> {
  const {
    order,
    customer,
    reference = `SK-TEST-${unique("ref")}`.toUpperCase(),
    amount = Number(order.total),
    status = PaymentStatus.PENDING,
    method = PaymentMethod.PAYSTACK,
  } = options;

  const repo = testDataSource.getRepository(Payment);
  return repo.save(
    repo.create({
      reference,
      amount,
      status,
      method,
      order,
      user: customer,
    })
  );
}

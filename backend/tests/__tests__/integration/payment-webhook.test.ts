jest.mock("../../../src/config/database", () => ({
  AppDataSource: require("../../setup").testDataSource,
}));

import crypto from "crypto";
import request from "supertest";
import { testDataSource } from "../../setup";
import { buildApp } from "../../helpers/testApp";
import { makeOrder, makePayment, makeUser, makeVendor, makeProduct } from "../../helpers/fixtures";
import paymentRoutes from "../../../src/routes/paymentRoutes";
import { Payment, PaymentStatus } from "../../../src/entities/Payment";
import { Order, OrderStatus } from "../../../src/entities/Order";
import { Notification } from "../../../src/entities/Notification";
import { UserRole } from "../../../src/entities/User";

const SECRET = "sk_test_webhook_signing_secret_1234567890";

const app = buildApp([["/api/payments", paymentRoutes]], { rawWebhook: true });

const sign = (raw: string, secret = SECRET) =>
  crypto.createHmac("sha512", secret).update(raw).digest("hex");

function chargePayload(reference: string, amountKobo: number) {
  return {
    event: "charge.success",
    data: {
      reference,
      amount: amountKobo,
      status: "success",
      currency: "NGN",
      customer: { email: "ignored@test.local" },
    },
  };
}

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test_refresh_secret";
  process.env.PAYSTACK_SECRET_KEY = SECRET;
});

async function setupPendingPayment(total = 2500) {
  const owner = await makeUser({ role: UserRole.VENDOR });
  const vendor = await makeVendor(owner);
  const product = await makeProduct(vendor, { price: total });
  const customer = await makeUser();
  const order = await makeOrder({ customer, vendor, product, total });
  const payment = await makePayment({ order, customer, amount: total });

  return { customer, vendor, product, order, payment };
}

const postWebhook = (raw: string, signature?: string) => {
  const req = request(app)
    .post("/api/payments/webhook/paystack")
    .set("Content-Type", "application/json");
  if (signature) req.set("x-paystack-signature", signature);
  return req.send(raw);
};

describe("Paystack webhook", () => {
  it("rejects a request with no signature", async () => {
    const { payment } = await setupPendingPayment();
    const raw = JSON.stringify(chargePayload(payment.reference, 250000));

    await postWebhook(raw).expect(401);

    const stored = await testDataSource.getRepository(Payment).findOneByOrFail({ id: payment.id });
    expect(stored.status).toBe(PaymentStatus.PENDING);
  });

  it("rejects a forged signature", async () => {
    const { payment } = await setupPendingPayment();
    const raw = JSON.stringify(chargePayload(payment.reference, 250000));

    await postWebhook(raw, sign(raw, "not-the-real-secret")).expect(401);

    const stored = await testDataSource.getRepository(Payment).findOneByOrFail({ id: payment.id });
    expect(stored.status).toBe(PaymentStatus.PENDING);
  });

  it("rejects a body that was tampered with after signing", async () => {
    const { payment } = await setupPendingPayment();
    const original = JSON.stringify(chargePayload(payment.reference, 250000));
    const tampered = original.replace('"amount":250000', '"amount":2500000');

    await postWebhook(tampered, sign(original)).expect(401);

    const stored = await testDataSource.getRepository(Payment).findOneByOrFail({ id: payment.id });
    expect(stored.status).toBe(PaymentStatus.PENDING);
  });

  it("verifies the signature over the raw bytes, not a re-serialized body", async () => {
    const { payment, order } = await setupPendingPayment();
    // Pretty-printed JSON would fail if the handler signed JSON.stringify(req.body).
    const raw = JSON.stringify(chargePayload(payment.reference, 250000), null, 2);

    const res = await postWebhook(raw, sign(raw)).expect(200);
    expect(res.body.success).toBe(true);

    const stored = await testDataSource.getRepository(Payment).findOneByOrFail({ id: payment.id });
    expect(stored.status).toBe(PaymentStatus.SUCCESS);

    const updatedOrder = await testDataSource.getRepository(Order).findOneByOrFail({ id: order.id });
    expect(updatedOrder.status).toBe(OrderStatus.CONFIRMED);
  });

  it("confirms the payment and the order exactly once for a repeated delivery", async () => {
    const { payment, order, customer } = await setupPendingPayment();
    const raw = JSON.stringify(chargePayload(payment.reference, 250000));
    const header = sign(raw);

    await postWebhook(raw, header).expect(200);
    await postWebhook(raw, header).expect(200);

    const stored = await testDataSource.getRepository(Payment).findOneByOrFail({ id: payment.id });
    expect(stored.status).toBe(PaymentStatus.SUCCESS);
    expect(stored.paystackReference).toBe(payment.reference);

    const updatedOrder = await testDataSource.getRepository(Order).findOneByOrFail({ id: order.id });
    expect(updatedOrder.status).toBe(OrderStatus.CONFIRMED);

    const notifications = await testDataSource
      .getRepository(Notification)
      .find({ where: { user: { id: customer.id }, referenceId: order.id } });
    expect(notifications).toHaveLength(1);
  });

  it("acknowledges an unknown reference with 200 so Paystack stops retrying", async () => {
    const raw = JSON.stringify(chargePayload("SK-THIS-REFERENCE-DOES-NOT-EXIST", 250000));

    const res = await postWebhook(raw, sign(raw)).expect(200);
    expect(res.body).toMatchObject({ success: true, ignored: true });
  });

  it("ignores a charge whose amount does not match the order total", async () => {
    const { payment, order } = await setupPendingPayment(2500);
    // ₦10 instead of ₦2,500
    const raw = JSON.stringify(chargePayload(payment.reference, 1000));

    const res = await postWebhook(raw, sign(raw)).expect(200);
    expect(res.body.ignored).toBe(true);

    const stored = await testDataSource.getRepository(Payment).findOneByOrFail({ id: payment.id });
    expect(stored.status).toBe(PaymentStatus.PENDING);

    const updatedOrder = await testDataSource.getRepository(Order).findOneByOrFail({ id: order.id });
    expect(updatedOrder.status).toBe(OrderStatus.PENDING);
  });

  it("ignores events other than charge.success", async () => {
    const { payment } = await setupPendingPayment();
    const raw = JSON.stringify({
      event: "transfer.success",
      data: { reference: payment.reference, amount: 250000 },
    });

    await postWebhook(raw, sign(raw)).expect(200);

    const stored = await testDataSource.getRepository(Payment).findOneByOrFail({ id: payment.id });
    expect(stored.status).toBe(PaymentStatus.PENDING);
  });

  it("does not resurrect a cancelled order when a late charge arrives", async () => {
    const { payment, order } = await setupPendingPayment();
    await testDataSource
      .getRepository(Order)
      .update({ id: order.id }, { status: OrderStatus.CANCELLED });

    const raw = JSON.stringify(chargePayload(payment.reference, 250000));
    await postWebhook(raw, sign(raw)).expect(200);

    const stored = await testDataSource.getRepository(Payment).findOneByOrFail({ id: payment.id });
    expect(stored.status).toBe(PaymentStatus.SUCCESS);

    const updatedOrder = await testDataSource.getRepository(Order).findOneByOrFail({ id: order.id });
    expect(updatedOrder.status).toBe(OrderStatus.CANCELLED);
  });
});

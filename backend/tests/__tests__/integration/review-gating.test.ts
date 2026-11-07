jest.mock("../../../src/config/database", () => ({
  AppDataSource: require("../../setup").testDataSource,
}));

import request from "supertest";
import { buildApp } from "../../helpers/testApp";
import { authHeader, makeOrder, makeProduct, makeUser, makeVendor } from "../../helpers/fixtures";
import reviewRoutes from "../../../src/routes/reviewRoutes";
import productRoutes from "../../../src/routes/productRoutes";
import vendorRoutes from "../../../src/routes/vendorRoutes";
import { OrderStatus } from "../../../src/entities/Order";
import { UserRole } from "../../../src/entities/User";

const app = buildApp([
  ["/api/reviews", reviewRoutes],
  ["/api/products", productRoutes],
  ["/api/vendors", vendorRoutes],
]);

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test_refresh_secret";
});

async function setupShop() {
  const owner = await makeUser({ role: UserRole.VENDOR });
  const vendor = await makeVendor(owner);
  const product = await makeProduct(vendor, { price: 1000 });
  const customer = await makeUser();
  return { owner, vendor, product, customer };
}

describe("Review gating", () => {
  it("rejects a review from someone who never ordered", async () => {
    const { product, customer } = await setupShop();

    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", authHeader(customer))
      .send({ productId: product.id, rating: 5, comment: "Never bought it" });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/after a completed order/i);
  });

  it("rejects a review while the order has not been delivered yet", async () => {
    const { vendor, product, customer } = await setupShop();
    await makeOrder({ customer, vendor, product, status: OrderStatus.PREPARING });

    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", authHeader(customer))
      .send({ productId: product.id, rating: 4 });

    expect(res.status).toBe(403);
  });

  it("accepts a review after a delivered order and updates the product aggregates", async () => {
    const { vendor, product, customer } = await setupShop();
    await makeOrder({ customer, vendor, product, status: OrderStatus.DELIVERED });

    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", authHeader(customer))
      .send({ productId: product.id, rating: 5, comment: "Lovely jollof" })
      .expect(201);

    expect(res.body.data.isVerifiedPurchase).toBe(true);
    expect(res.body.data.rating).toBe(5);

    const productRes = await request(app).get(`/api/products/${product.id}`).expect(200);
    expect(productRes.body.data.rating).toBe(5);
    expect(productRes.body.data.totalReviews).toBe(1);
  });

  it("updates the vendor aggregates when reviewing the vendor itself", async () => {
    const { vendor, product, customer } = await setupShop();
    await makeOrder({ customer, vendor, product, status: OrderStatus.DELIVERED });

    await request(app)
      .post("/api/reviews")
      .set("Authorization", authHeader(customer))
      .send({ vendorId: vendor.id, rating: 4, comment: "Good service" })
      .expect(201);

    const vendorRes = await request(app).get(`/api/vendors/${vendor.id}`).expect(200);
    expect(vendorRes.body.data.rating).toBe(4);
    expect(vendorRes.body.data.totalReviews).toBe(1);
  });

  it("prevents the same customer from reviewing a product twice", async () => {
    const { vendor, product, customer } = await setupShop();
    await makeOrder({ customer, vendor, product, status: OrderStatus.DELIVERED });

    await request(app)
      .post("/api/reviews")
      .set("Authorization", authHeader(customer))
      .send({ productId: product.id, rating: 5 })
      .expect(201);

    const duplicate = await request(app)
      .post("/api/reviews")
      .set("Authorization", authHeader(customer))
      .send({ productId: product.id, rating: 1 });

    expect(duplicate.status).toBe(409);
  });

  it("rejects ratings outside 1-5", async () => {
    const { vendor, product, customer } = await setupShop();
    await makeOrder({ customer, vendor, product, status: OrderStatus.DELIVERED });

    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", authHeader(customer))
      .send({ productId: product.id, rating: 9 });

    expect(res.status).toBe(422);
    expect(res.body.errors?.[0]).toMatchObject({ field: "rating" });
  });

  it("recalculates the product rating when a review is deleted", async () => {
    const { vendor, product, customer } = await setupShop();
    await makeOrder({ customer, vendor, product, status: OrderStatus.DELIVERED });

    const created = await request(app)
      .post("/api/reviews")
      .set("Authorization", authHeader(customer))
      .send({ productId: product.id, rating: 3 })
      .expect(201);

    const afterCreate = await request(app).get(`/api/products/${product.id}`).expect(200);
    expect(afterCreate.body.data.rating).toBe(3);
    expect(afterCreate.body.data.totalReviews).toBe(1);

    await request(app)
      .delete(`/api/reviews/${created.body.data.id}`)
      .set("Authorization", authHeader(customer))
      .expect(200);

    const afterDelete = await request(app).get(`/api/products/${product.id}`).expect(200);
    expect(afterDelete.body.data.rating).toBe(0);
    expect(afterDelete.body.data.totalReviews).toBe(0);
  });

  it("only lets the author or an admin delete a review", async () => {
    const { vendor, product, customer } = await setupShop();
    await makeOrder({ customer, vendor, product, status: OrderStatus.DELIVERED });

    const created = await request(app)
      .post("/api/reviews")
      .set("Authorization", authHeader(customer))
      .send({ productId: product.id, rating: 4 })
      .expect(201);

    const stranger = await makeUser();
    await request(app)
      .delete(`/api/reviews/${created.body.data.id}`)
      .set("Authorization", authHeader(stranger))
      .expect(403);

    const admin = await makeUser({ role: UserRole.ADMIN });
    await request(app)
      .delete(`/api/reviews/${created.body.data.id}`)
      .set("Authorization", authHeader(admin))
      .expect(200);
  });

  it("does not expose reviewer emails in public review lists", async () => {
    const { vendor, product, customer } = await setupShop();
    await makeOrder({ customer, vendor, product, status: OrderStatus.DELIVERED });

    await request(app)
      .post("/api/reviews")
      .set("Authorization", authHeader(customer))
      .send({ productId: product.id, rating: 5, comment: "Nice" })
      .expect(201);

    const res = await request(app).get(`/api/reviews/product/${product.id}`).expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].user.email).toBeUndefined();
    expect(res.body.data[0].user.phone).toBeUndefined();
    expect(res.body.data[0].user.firstName).toBe(customer.firstName);
    expect(JSON.stringify(res.body)).not.toContain(customer.email);
  });
});

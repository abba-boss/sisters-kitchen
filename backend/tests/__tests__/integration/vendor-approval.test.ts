jest.mock("../../../src/config/database", () => ({
  AppDataSource: require("../../setup").testDataSource,
}));

import request from "supertest";
import { testDataSource } from "../../setup";
import { buildApp } from "../../helpers/testApp";
import { authHeader, makeUser, makeVendor, makeProduct } from "../../helpers/fixtures";
import authRoutes from "../../../src/routes/authRoutes";
import vendorRoutes from "../../../src/routes/vendorRoutes";
import productRoutes from "../../../src/routes/productRoutes";
import { UserRole } from "../../../src/entities/User";
import { Vendor, VendorStatus } from "../../../src/entities/Vendor";

const app = buildApp([
  ["/api/auth", authRoutes],
  ["/api/vendors", vendorRoutes],
  ["/api/products", productRoutes],
]);

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test_refresh_secret";
});

describe("Vendor approval gate", () => {
  it("registers a new kitchen as pending, closed and unable to publish products", async () => {
    const register = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Ada",
        lastName: "Obi",
        email: `ada.${Date.now()}@test.local`,
        password: "Passw0rd!",
        phone: "+2348011111111",
        role: "vendor",
        businessName: "Ada's Test Kitchen",
      })
      .expect(201);

    const token = register.body.data.accessToken;

    const profile = await request(app)
      .get("/api/vendors/my-profile")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(profile.body.data.status).toBe(VendorStatus.PENDING);
    expect(profile.body.data.isOpen).toBe(false);

    const create = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Jollof Rice", description: "Smoky party jollof", price: 2500, stock: 10 });

    expect(create.status).toBe(403);
    expect(create.body.message).toMatch(/awaiting approval/i);
  });

  it("hides pending vendors from the public list and detail, but not from the owner or an admin", async () => {
    const owner = await makeUser({ role: UserRole.VENDOR });
    const vendor = await makeVendor(owner, {
      status: VendorStatus.PENDING,
      businessName: "Hidden Pending Kitchen",
    });

    const list = await request(app)
      .get("/api/vendors?search=Hidden Pending Kitchen")
      .expect(200);
    expect(list.body.data.map((v: any) => v.id)).not.toContain(vendor.id);

    await request(app).get(`/api/vendors/${vendor.id}`).expect(404);

    const asOwner = await request(app)
      .get(`/api/vendors/${vendor.id}`)
      .set("Authorization", authHeader(owner))
      .expect(200);
    expect(asOwner.body.data.id).toBe(vendor.id);

    const admin = await makeUser({ role: UserRole.ADMIN });
    await request(app)
      .get(`/api/vendors/${vendor.id}`)
      .set("Authorization", authHeader(admin))
      .expect(200);
  });

  it("hides products belonging to a kitchen that is not approved yet", async () => {
    const owner = await makeUser({ role: UserRole.VENDOR });
    const vendor = await makeVendor(owner, { status: VendorStatus.PENDING });
    const product = await makeProduct(vendor, { name: "Ghost Stew" });

    const list = await request(app).get("/api/products?search=Ghost Stew").expect(200);
    expect(list.body.data.map((p: any) => p.id)).not.toContain(product.id);

    await request(app).get(`/api/products/${product.id}`).expect(404);
  });

  it("only lets an admin approve, and rejects unknown statuses", async () => {
    const owner = await makeUser({ role: UserRole.VENDOR });
    const vendor = await makeVendor(owner, { status: VendorStatus.PENDING });

    await request(app)
      .patch(`/api/vendors/${vendor.id}/approval`)
      .set("Authorization", authHeader(owner))
      .send({ status: "approved" })
      .expect(403);

    const admin = await makeUser({ role: UserRole.ADMIN });

    await request(app)
      .patch(`/api/vendors/${vendor.id}/approval`)
      .set("Authorization", authHeader(admin))
      .send({ status: "hacked" })
      .expect(400);

    const approved = await request(app)
      .patch(`/api/vendors/${vendor.id}/approval`)
      .set("Authorization", authHeader(admin))
      .send({ status: "approved" })
      .expect(200);

    expect(approved.body.data.status).toBe(VendorStatus.APPROVED);
  });

  it("publishes a kitchen's products once it is approved", async () => {
    const owner = await makeUser({ role: UserRole.VENDOR });
    const vendor = await makeVendor(owner, { status: VendorStatus.PENDING });
    const admin = await makeUser({ role: UserRole.ADMIN });
    const product = await makeProduct(vendor, { name: "Newly Approved Bowl" });

    await request(app).get(`/api/products/${product.id}`).expect(404);

    await request(app)
      .patch(`/api/vendors/${vendor.id}/approval`)
      .set("Authorization", authHeader(admin))
      .send({ status: "approved" })
      .expect(200);

    await request(app).get(`/api/products/${product.id}`).expect(200);

    const list = await request(app).get("/api/products?search=Newly Approved Bowl").expect(200);
    expect(list.body.data.map((p: any) => p.id)).toContain(product.id);

    const create = await request(app)
      .post("/api/products")
      .set("Authorization", authHeader(owner))
      .send({ name: "Second Dish", description: "Now allowed", price: 1200, stock: 3 })
      .expect(201);

    expect(create.body.data.name).toBe("Second Dish");
  });

  it("removes a suspended kitchen from the public shop again", async () => {
    const owner = await makeUser({ role: UserRole.VENDOR });
    const vendor = await makeVendor(owner);
    const admin = await makeUser({ role: UserRole.ADMIN });
    const product = await makeProduct(vendor, { name: "Suspended Soup" });

    await request(app).get(`/api/products/${product.id}`).expect(200);

    await request(app)
      .patch(`/api/vendors/${vendor.id}/approval`)
      .set("Authorization", authHeader(admin))
      .send({ status: VendorStatus.SUSPENDED })
      .expect(200);

    await request(app).get(`/api/products/${product.id}`).expect(404);
    await request(app).get(`/api/vendors/${vendor.id}`).expect(404);
  });

  it("never exposes payout details or the owner's email on a public profile", async () => {
    const owner = await makeUser({ role: UserRole.VENDOR });
    const vendor = await makeVendor(owner, { businessName: "Public Profile Kitchen" });

    // Payout columns are select:false, so set them through an explicit update.
    await testDataSource
      .getRepository(Vendor)
      .createQueryBuilder()
      .update()
      .set({ bankName: "Test Bank", accountNumber: "0123456789", accountName: "Test Owner" })
      .where("id = :id", { id: vendor.id })
      .execute();

    const res = await request(app).get(`/api/vendors/${vendor.id}`).expect(200);

    expect(res.body.data.bankName).toBeUndefined();
    expect(res.body.data.accountNumber).toBeUndefined();
    expect(res.body.data.accountName).toBeUndefined();
    expect(res.body.data.user.email).toBeUndefined();
    expect(res.body.data.user.firstName).toBe(owner.firstName);
  });
});

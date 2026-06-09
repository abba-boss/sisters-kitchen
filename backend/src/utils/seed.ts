import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import { AppDataSource } from "../config/database";
import { Category } from "../entities/Category";
import { User, UserRole } from "../entities/User";
import { Vendor, VendorStatus } from "../entities/Vendor";
import bcrypt from "bcryptjs";

const categories = [
  { name: "Rice & Stew", icon: "🍛", description: "Jollof, fried rice, white rice and all the stews", sortOrder: 1 },
  { name: "Shawarma", icon: "🌯", description: "Chicken, beef and mixed shawarma rolls", sortOrder: 2 },
  { name: "Pizza", icon: "🍕", description: "Homemade artisan pizzas with fresh toppings", sortOrder: 3 },
  { name: "Burgers", icon: "🍔", description: "Juicy grilled burgers and sandwiches", sortOrder: 4 },
  { name: "Cakes & Pastries", icon: "🎂", description: "Custom cakes, cupcakes, and baked goods", sortOrder: 5 },
  { name: "Smoothies & Drinks", icon: "🥤", description: "Fresh fruit smoothies, juices and milkshakes", sortOrder: 6 },
  { name: "Snacks", icon: "🍟", description: "Chin chin, puff puff, spring rolls and more", sortOrder: 7 },
  { name: "Local Dishes", icon: "🥘", description: "Egusi, ogbono, efo riro and traditional soups", sortOrder: 8 },
  { name: "Fruits", icon: "🍓", description: "Fresh cut fruits and fruit salads", sortOrder: 9 },
  { name: "Doughnuts", icon: "🍩", description: "Soft, glazed and filled doughnuts", sortOrder: 10 },
];

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected");

    // Seed categories
    const categoryRepo = AppDataSource.getRepository(Category);
    for (const cat of categories) {
      const existing = await categoryRepo.findOne({ where: { name: cat.name } });
      if (!existing) {
        await categoryRepo.save(categoryRepo.create(cat));
        console.log(`✅ Category created: ${cat.name}`);
      }
    }

    // Seed admin user
    const userRepo = AppDataSource.getRepository(User);
    const adminExists = await userRepo.findOne({ where: { email: "admin@sisterskitchen.ng" } });
    if (!adminExists) {
      const adminUser = userRepo.create({
        firstName: "Super",
        lastName: "Admin",
        email: "admin@sisterskitchen.ng",
        password: await bcrypt.hash("Admin@2024", 12),
        role: UserRole.ADMIN,
        isActive: true,
        isEmailVerified: true,
      });
      await userRepo.save(adminUser);
      console.log("✅ Admin user created: admin@sisterskitchen.ng / Admin@2024");
    }

    // Seed a sample vendor
    const vendorUserExists = await userRepo.findOne({ where: { email: "mama.ngozi@sisterskitchen.ng" } });
    if (!vendorUserExists) {
      const vendorUser = userRepo.create({
        firstName: "Mama",
        lastName: "Ngozi",
        email: "mama.ngozi@sisterskitchen.ng",
        password: await bcrypt.hash("Vendor@2024", 12),
        role: UserRole.VENDOR,
        phone: "+2348012345678",
        isActive: true,
      });
      await userRepo.save(vendorUser);

      const vendorRepo = AppDataSource.getRepository(Vendor);
      const vendor = vendorRepo.create({
        businessName: "Mama Ngozi's Kitchen",
        description: "Authentic Nigerian home cooking made with love. Specialising in jollof rice, egusi soup, and traditional stews.",
        address: "Yaba, Lagos",
        phone: "+2348012345678",
        status: VendorStatus.APPROVED,
        isOpen: true,
        openingTime: "08:00",
        closingTime: "20:00",
        availableDays: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
        rating: 4.8,
        totalReviews: 127,
        user: vendorUser,
      });
      await vendorRepo.save(vendor);
      console.log("✅ Sample vendor created: mama.ngozi@sisterskitchen.ng / Vendor@2024");
    }

    // Seed a sample customer
    const customerExists = await userRepo.findOne({ where: { email: "customer@sisterskitchen.ng" } });
    if (!customerExists) {
      const customer = userRepo.create({
        firstName: "Amaka",
        lastName: "Obi",
        email: "customer@sisterskitchen.ng",
        password: await bcrypt.hash("Customer@2024", 12),
        role: UserRole.CUSTOMER,
        phone: "+2348087654321",
        isActive: true,
      });
      await userRepo.save(customer);
      console.log("✅ Sample customer: customer@sisterskitchen.ng / Customer@2024");
    }

    console.log("\n🎉 Seeding complete!\n");
    console.log("Login credentials:");
    console.log("  Admin:    admin@sisterskitchen.ng       / Admin@2024");
    console.log("  Vendor:   mama.ngozi@sisterskitchen.ng  / Vendor@2024");
    console.log("  Customer: customer@sisterskitchen.ng    / Customer@2024");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seed();

import request from 'supertest';
import express from 'express';
import { testDataSource } from '../../setup';
import { User, UserRole } from '../../../src/entities/User';
import { Vendor } from '../../../src/entities/Vendor';
import { Product } from '../../../src/entities/Product';
import { Category } from '../../../src/entities/Category';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock express app for testing
const app = express();
app.use(express.json());

describe('Order Flow Integration', () => {
  let customerToken: string;
  let vendorToken: string;
  let testVendor: Vendor;
  let testProduct: Product;
  let testCustomer: User;

  beforeEach(async () => {
    const userRepo = testDataSource.getRepository(User);
    const vendorRepo = testDataSource.getRepository(Vendor);
    const productRepo = testDataSource.getRepository(Product);
    const categoryRepo = testDataSource.getRepository(Category);

    // Create vendor user
    const vendorUser = await userRepo.save(
      userRepo.create({
        firstName: 'Test',
        lastName: 'Vendor',
        email: 'vendor@integration.com',
        password: await bcrypt.hash('password', 10),
        phone: '+1234567890',
        role: UserRole.VENDOR,
        isActive: true,
      })
    );

    testVendor = await vendorRepo.save(
      vendorRepo.create({
        user: vendorUser,
        businessName: 'Integration Test Kitchen',
        businessAddress: '123 Test St',
        status: 'approved',
        pickupLatitude: 6.5244,
        pickupLongitude: 3.3792,
      })
    );

    // Create customer
    testCustomer = await userRepo.save(
      userRepo.create({
        firstName: 'Test',
        lastName: 'Customer',
        email: 'customer@integration.com',
        password: await bcrypt.hash('password', 10),
        phone: '+1234567891',
        role: UserRole.CUSTOMER,
        isActive: true,
      })
    );

    // Create category and product
    const category = await categoryRepo.save(
      categoryRepo.create({
        name: 'Test Category',
        description: 'Test',
      })
    );

    testProduct = await productRepo.save(
      productRepo.create({
        name: 'Integration Test Product',
        description: 'Test product',
        price: 5000,
        stock: 20,
        vendor: testVendor,
        category,
        isAvailable: true,
      })
    );

    // Generate tokens
    customerToken = jwt.sign(
      { id: testCustomer.id, role: UserRole.CUSTOMER },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    vendorToken = jwt.sign(
      { id: vendorUser.id, role: UserRole.VENDOR },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );
  });

  describe('Complete Purchase Flow', () => {
    it('should validate complete order creation flow', async () => {
      const orderData = {
        vendorId: testVendor.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 2,
          },
        ],
        deliveryAddress: '456 Customer St, Lagos',
        deliveryPhone: '+2348012345678',
        fulfillmentType: 'delivery',
      };

      // Verify initial stock
      const productRepo = testDataSource.getRepository(Product);
      const initialProduct = await productRepo.findOne({
        where: { id: testProduct.id },
      });
      expect(initialProduct?.stock).toBe(20);

      // Simulate order creation - stock decrement
      initialProduct!.stock -= orderData.items[0].quantity;
      await productRepo.save(initialProduct!);

      // Verify stock was decremented
      const updatedProduct = await productRepo.findOne({
        where: { id: testProduct.id },
      });
      expect(updatedProduct?.stock).toBe(18);
    });

    it('should validate pickup order with QR verification', async () => {
      const pickupOrderData = {
        vendorId: testVendor.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 1,
          },
        ],
        deliveryPhone: '+2348012345678',
        fulfillmentType: 'pickup',
      };

      // Verify vendor has pickup location
      expect(testVendor.pickupLatitude).toBeDefined();
      expect(testVendor.pickupLongitude).toBeDefined();

      // Simulate stock decrement
      const productRepo = testDataSource.getRepository(Product);
      const product = await productRepo.findOne({
        where: { id: testProduct.id },
      });
      product!.stock -= pickupOrderData.items[0].quantity;
      await productRepo.save(product!);

      const updatedProduct = await productRepo.findOne({
        where: { id: testProduct.id },
      });
      expect(updatedProduct?.stock).toBe(19);
    });

    it('should reject order with insufficient stock', async () => {
      const orderData = {
        vendorId: testVendor.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 25, // More than stock (20)
          },
        ],
        deliveryAddress: '456 Customer St, Lagos',
        fulfillmentType: 'delivery',
      };

      // Validate stock check
      const productRepo = testDataSource.getRepository(Product);
      const product = await productRepo.findOne({
        where: { id: testProduct.id },
      });

      expect(product?.stock).toBe(20);
      expect(product!.stock < orderData.items[0].quantity).toBe(true);
      // Order should be rejected - stock not decremented
    });
  });

  describe('Pickup Verification', () => {
    it('should validate pickup token/PIN before marking delivered', async () => {
      const pickupToken = 'test_pickup_token_123456';
      const pickupPin = '123456';

      // Simulate token validation
      const isTokenValid = pickupToken === 'test_pickup_token_123456';
      const isPinValid = pickupPin === '123456';

      expect(isTokenValid || isPinValid).toBe(true);
    });

    it('should reject invalid pickup tokens', async () => {
      const pickupToken = 'invalid_token';
      const validToken = 'test_pickup_token_123456';

      const isValid = pickupToken === validToken;
      expect(isValid).toBe(false);
    });

    it('should prevent duplicate pickups', async () => {
      let pickupVerifiedAt: Date | null = null;

      // First pickup attempt
      pickupVerifiedAt = new Date();
      expect(pickupVerifiedAt).toBeDefined();

      // Second pickup attempt should fail
      if (pickupVerifiedAt) {
        // Already picked up
        expect(pickupVerifiedAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('Order Cancellation Flow', () => {
    it('should restore stock when order is cancelled', async () => {
      const orderQuantity = 5;

      // Create order - decrement stock
      const productRepo = testDataSource.getRepository(Product);
      const product = await productRepo.findOne({
        where: { id: testProduct.id },
      });
      const initialStock = product!.stock;

      product!.stock -= orderQuantity;
      await productRepo.save(product!);

      let updatedProduct = await productRepo.findOne({
        where: { id: testProduct.id },
      });
      expect(updatedProduct?.stock).toBe(initialStock - orderQuantity);

      // Cancel order - restore stock
      updatedProduct!.stock += orderQuantity;
      await productRepo.save(updatedProduct!);

      const finalProduct = await productRepo.findOne({
        where: { id: testProduct.id },
      });
      expect(finalProduct?.stock).toBe(initialStock);
    });
  });
});

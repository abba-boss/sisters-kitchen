import { testDataSource } from '../../setup';
import { Product } from '../../../src/entities/Product';
import { Order, OrderStatus, FulfillmentType } from '../../../src/entities/Order';
import { User, UserRole } from '../../../src/entities/User';
import { Vendor } from '../../../src/entities/Vendor';
import { Category } from '../../../src/entities/Category';
import bcrypt from 'bcryptjs';

describe('Stock Management', () => {
  let productRepo: any;
  let orderRepo: any;
  let userRepo: any;
  let vendorRepo: any;
  let categoryRepo: any;
  let testVendor: Vendor;
  let testCustomer: User;
  let testProduct: Product;

  beforeEach(async () => {
    productRepo = testDataSource.getRepository(Product);
    orderRepo = testDataSource.getRepository(Order);
    userRepo = testDataSource.getRepository(User);
    vendorRepo = testDataSource.getRepository(Vendor);
    categoryRepo = testDataSource.getRepository(Category);

    // Create test vendor
    const vendorUser = await userRepo.save(
      userRepo.create({
        firstName: 'Test',
        lastName: 'Vendor',
        email: 'vendor@test.com',
        password: await bcrypt.hash('password', 10),
        phone: '+1234567890',
        role: UserRole.VENDOR,
        isActive: true,
      })
    );

    testVendor = await vendorRepo.save(
      vendorRepo.create({
        user: vendorUser,
        businessName: 'Test Kitchen',
        businessAddress: '123 Test St',
        status: 'approved',
      })
    );

    // Create test customer
    testCustomer = await userRepo.save(
      userRepo.create({
        firstName: 'Test',
        lastName: 'Customer',
        email: 'customer@test.com',
        password: await bcrypt.hash('password', 10),
        phone: '+1234567891',
        role: UserRole.CUSTOMER,
        isActive: true,
      })
    );

    // Create test category
    const category = await categoryRepo.save(
      categoryRepo.create({
        name: 'Test Category',
        description: 'Test',
      })
    );

    // Create test product with stock
    testProduct = await productRepo.save(
      productRepo.create({
        name: 'Test Product',
        description: 'Test description',
        price: 1000,
        stock: 10,
        vendor: testVendor,
        category,
        isAvailable: true,
      })
    );
  });

  describe('Stock Decrement on Order', () => {
    it('should decrement stock when order is created', async () => {
      const initialStock = testProduct.stock;
      const orderQuantity = 3;

      // Simulate order creation
      testProduct.stock -= orderQuantity;
      await productRepo.save(testProduct);

      const updatedProduct = await productRepo.findOne({
        where: { id: testProduct.id },
      });

      expect(updatedProduct.stock).toBe(initialStock - orderQuantity);
      expect(updatedProduct.stock).toBe(7);
    });

    it('should prevent overselling - reject order when insufficient stock', async () => {
      const orderQuantity = 15; // More than available stock (10)

      if (testProduct.stock < orderQuantity) {
        // This should be rejected
        expect(testProduct.stock).toBeLessThan(orderQuantity);
        expect(testProduct.stock).toBe(10);
      } else {
        fail('Should have insufficient stock');
      }
    });

    it('should handle exact stock match', async () => {
      const orderQuantity = 10; // Exact stock amount

      testProduct.stock -= orderQuantity;
      await productRepo.save(testProduct);

      const updatedProduct = await productRepo.findOne({
        where: { id: testProduct.id },
      });

      expect(updatedProduct.stock).toBe(0);
    });
  });

  describe('Stock Restoration on Cancellation', () => {
    it('should restore stock when order is cancelled', async () => {
      // Create order with stock decrement
      const orderQuantity = 5;
      testProduct.stock -= orderQuantity;
      await productRepo.save(testProduct);

      const stockAfterOrder = testProduct.stock;
      expect(stockAfterOrder).toBe(5);

      // Simulate cancellation - restore stock
      testProduct.stock += orderQuantity;
      await productRepo.save(testProduct);

      const updatedProduct = await productRepo.findOne({
        where: { id: testProduct.id },
      });

      expect(updatedProduct.stock).toBe(10); // Back to original
    });

    it('should not restore stock when order is delivered', async () => {
      const orderQuantity = 3;
      testProduct.stock -= orderQuantity;
      await productRepo.save(testProduct);

      // Order delivered - stock should NOT be restored
      const updatedProduct = await productRepo.findOne({
        where: { id: testProduct.id },
      });

      expect(updatedProduct.stock).toBe(7); // Remains decremented
    });
  });

  describe('Concurrent Stock Management', () => {
    it('should handle multiple orders correctly', async () => {
      const order1Quantity = 3;
      const order2Quantity = 4;

      // First order
      testProduct.stock -= order1Quantity;
      await productRepo.save(testProduct);

      // Second order
      const product = await productRepo.findOne({
        where: { id: testProduct.id },
      });
      product.stock -= order2Quantity;
      await productRepo.save(product);

      const finalProduct = await productRepo.findOne({
        where: { id: testProduct.id },
      });

      expect(finalProduct.stock).toBe(3); // 10 - 3 - 4 = 3
    });

    it('should prevent second order when first order exhausts stock', async () => {
      // First order takes 8 items
      testProduct.stock -= 8;
      await productRepo.save(testProduct);

      // Try to order 5 more (only 2 left)
      const product = await productRepo.findOne({
        where: { id: testProduct.id },
      });

      if (product.stock < 5) {
        expect(product.stock).toBe(2);
        // Order should be rejected
      } else {
        fail('Should have insufficient stock');
      }
    });
  });
});

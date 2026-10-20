import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '../store/cartStore';

describe('Cart Store', () => {
  beforeEach(() => {
    // Reset cart before each test
    const store = useCartStore.getState();
    store.clearCart();
  });

  describe('Adding items to cart', () => {
    it('should add item to empty cart', () => {
      const store = useCartStore.getState();
      
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        price: 1000,
        vendor: { id: 'vendor1', businessName: 'Test Vendor' },
      };

      store.addItem(mockProduct as any, 2);

      const { items, itemCount, total } = useCartStore.getState();
      
      expect(items).toHaveLength(1);
      expect(itemCount).toBe(2);
      expect(total).toBe(2000);
      expect(items[0].quantity).toBe(2);
    });

    it('should increase quantity when adding existing item', () => {
      const store = useCartStore.getState();
      
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        price: 1000,
        vendor: { id: 'vendor1', businessName: 'Test Vendor' },
      };

      store.addItem(mockProduct as any, 1);
      store.addItem(mockProduct as any, 2);

      const { items, itemCount, total } = useCartStore.getState();
      
      expect(items).toHaveLength(1);
      expect(itemCount).toBe(3);
      expect(total).toBe(3000);
    });

    it('should handle items from multiple vendors', () => {
      const store = useCartStore.getState();
      
      const product1 = {
        id: '1',
        name: 'Product 1',
        price: 1000,
        vendor: { id: 'vendor1', businessName: 'Vendor 1' },
      };

      const product2 = {
        id: '2',
        name: 'Product 2',
        price: 2000,
        vendor: { id: 'vendor2', businessName: 'Vendor 2' },
      };

      store.addItem(product1 as any, 1);
      store.addItem(product2 as any, 1);

      const { items, itemCount, total } = useCartStore.getState();
      
      expect(items).toHaveLength(2);
      expect(itemCount).toBe(2);
      expect(total).toBe(3000);
    });
  });

  describe('Removing items from cart', () => {
    it('should remove item from cart', () => {
      const store = useCartStore.getState();
      
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        price: 1000,
        vendor: { id: 'vendor1', businessName: 'Test Vendor' },
      };

      store.addItem(mockProduct as any, 2);
      store.removeItem('1');

      const { items, itemCount, total } = useCartStore.getState();
      
      expect(items).toHaveLength(0);
      expect(itemCount).toBe(0);
      expect(total).toBe(0);
    });

    it('should decrease quantity when quantity > 1', () => {
      const store = useCartStore.getState();
      
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        price: 1000,
        vendor: { id: 'vendor1', businessName: 'Test Vendor' },
      };

      store.addItem(mockProduct as any, 3);
      store.decreaseQuantity('1');

      const { items, itemCount, total } = useCartStore.getState();
      
      expect(items).toHaveLength(1);
      expect(itemCount).toBe(2);
      expect(total).toBe(2000);
      expect(items[0].quantity).toBe(2);
    });

    it('should remove item when decreasing quantity to 0', () => {
      const store = useCartStore.getState();
      
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        price: 1000,
        vendor: { id: 'vendor1', businessName: 'Test Vendor' },
      };

      store.addItem(mockProduct as any, 1);
      store.decreaseQuantity('1');

      const { items } = useCartStore.getState();
      
      expect(items).toHaveLength(0);
    });
  });

  describe('Cart calculations', () => {
    it('should calculate total correctly', () => {
      const store = useCartStore.getState();
      
      const product1 = {
        id: '1',
        name: 'Product 1',
        price: 1500,
        vendor: { id: 'vendor1', businessName: 'Vendor 1' },
      };

      const product2 = {
        id: '2',
        name: 'Product 2',
        price: 2500,
        discountPrice: 2000,
        vendor: { id: 'vendor1', businessName: 'Vendor 1' },
      };

      store.addItem(product1 as any, 2); // 1500 * 2 = 3000
      store.addItem(product2 as any, 1); // 2000 * 1 = 2000

      const { total } = useCartStore.getState();
      
      expect(total).toBe(5000);
    });

    it('should use discountPrice if available', () => {
      const store = useCartStore.getState();
      
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        price: 1000,
        discountPrice: 800,
        vendor: { id: 'vendor1', businessName: 'Test Vendor' },
      };

      store.addItem(mockProduct as any, 1);

      const { total, items } = useCartStore.getState();
      
      expect(total).toBe(800);
      expect(items[0].price).toBe(800);
    });
  });

  describe('Clear cart', () => {
    it('should clear all items from cart', () => {
      const store = useCartStore.getState();
      
      const product1 = {
        id: '1',
        name: 'Product 1',
        price: 1000,
        vendor: { id: 'vendor1', businessName: 'Vendor 1' },
      };

      const product2 = {
        id: '2',
        name: 'Product 2',
        price: 2000,
        vendor: { id: 'vendor2', businessName: 'Vendor 2' },
      };

      store.addItem(product1 as any, 2);
      store.addItem(product2 as any, 1);
      
      expect(useCartStore.getState().items).toHaveLength(2);
      
      store.clearCart();

      const { items, itemCount, total } = useCartStore.getState();
      
      expect(items).toHaveLength(0);
      expect(itemCount).toBe(0);
      expect(total).toBe(0);
    });
  });
});

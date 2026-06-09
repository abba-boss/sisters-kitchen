import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      vendorId: null,
      vendorName: null,

      addItem: (product, quantity = 1) => {
        const { items, vendorId } = get();

        // Cart can only contain items from one vendor
        if (vendorId && vendorId !== product.vendor?.id) {
          return { conflict: true, vendorName: get().vendorName };
        }

        const existing = items.find((i) => i.id === product.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
            ),
          });
        } else {
          set({
            items: [...items, { ...product, quantity }],
            vendorId: product.vendor?.id,
            vendorName: product.vendor?.businessName,
          });
        }
        return { conflict: false };
      },

      removeItem: (productId) => {
        const newItems = get().items.filter((i) => i.id !== productId);
        set({
          items: newItems,
          vendorId: newItems.length === 0 ? null : get().vendorId,
          vendorName: newItems.length === 0 ? null : get().vendorName,
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === productId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [], vendorId: null, vendorName: null }),

      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((sum, i) => {
          const price = i.discountPrice || i.price;
          return sum + price * i.quantity;
        }, 0),

      getTotal: () => get().getSubtotal() + 500, // +500 delivery fee
    }),
    {
      name: 'sisters-kitchen-cart',
    }
  )
);

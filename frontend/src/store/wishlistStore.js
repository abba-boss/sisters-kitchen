import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],

      toggle: (product) => {
        const exists = get().items.find((i) => i.id === product.id);
        if (exists) {
          set({ items: get().items.filter((i) => i.id !== product.id) });
        } else {
          set({ items: [...get().items, product] });
        }
      },

      isWishlisted: (productId) => !!get().items.find((i) => i.id === productId),

      clear: () => set({ items: [] }),
    }),
    { name: 'sisters-kitchen-wishlist' }
  )
);

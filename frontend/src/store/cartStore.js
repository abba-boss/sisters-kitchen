import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const getLineKey = (item) =>
  item.lineKey || `${item.id}:${JSON.stringify(item._customization || {})}`;

/**
 * Multi-vendor cart.
 * Items are stored flat. At checkout, the user picks one vendor's items
 * to order (or we create one order per vendor group).
 */
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      // Add item while keeping different preparation preferences separate.
      addItem: (product, quantity = 1) => {
        if (product.vendor?.isOpen === false) {
          return { conflict: false, error: 'closed' };
        }

        const lineKey = getLineKey(product);
        const nextItem = { ...product, lineKey, quantity };
        const items = get().items;
        const existing = items.find((item) => getLineKey(item) === lineKey);

        if (existing) {
          set({
            items: items.map((item) =>
              getLineKey(item) === lineKey
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({ items: [...items, nextItem] });
        }
        return { conflict: false };
      },

      removeItem: (productId, lineKey) => {
        set({
          items: get().items.filter((item) =>
            lineKey
              ? getLineKey(item) !== lineKey
              : item.id !== productId
          ),
        });
      },

      updateQuantity: (productId, quantity, lineKey) => {
        if (quantity <= 0) {
          get().removeItem(productId, lineKey);
          return;
        }
        set({
          items: get().items.map((item) =>
            (lineKey ? getLineKey(item) === lineKey : item.id === productId)
              ? { ...item, quantity }
              : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      clearVendorItems: (vendorId) => {
        set({ items: get().items.filter((item) => item.vendor?.id !== vendorId) });
      },

      // Getters
      getTotalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((sum, item) => {
          const price = Number(item.discountPrice) || Number(item.price);
          return sum + price * item.quantity;
        }, 0),

      getTotal: () => {
        const groups = get().getVendorGroups();
        return get().getSubtotal() + 500 * groups.length;
      },

      getVendorGroups: () => {
        const groups = {};
        get().items.forEach((item) => {
          const vendorId = item.vendor?.id || 'unknown';
          if (!groups[vendorId]) {
            groups[vendorId] = {
              vendorId,
              vendorName: item.vendor?.businessName || 'Unknown Vendor',
              vendorLogo: item.vendor?.logo || null,
              items: [],
              subtotal: 0,
              total: 0,
            };
          }
          groups[vendorId].items.push(item);
          const price = Number(item.discountPrice) || Number(item.price);
          groups[vendorId].subtotal += price * item.quantity;
        });
        Object.values(groups).forEach((group) => {
          group.total = group.subtotal + 500;
        });
        return Object.values(groups);
      },

      // For backwards compatibility: first vendor in cart.
      get vendorId() { return get().items[0]?.vendor?.id || null; },
      get vendorName() { return get().items[0]?.vendor?.businessName || null; },
    }),
    { name: 'sisters-kitchen-cart' }
  )
);

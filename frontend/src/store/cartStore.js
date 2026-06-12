import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Multi-vendor cart.
 * Items are stored flat. At checkout, the user picks one vendor's items
 * to order (or we create one order per vendor group).
 *
 * Structure:
 *   items: [{ id, name, price, discountPrice, images, vendor, quantity, ... }]
 *
 * vendorGroups() returns items grouped by vendorId so the UI can show
 * separate sections and the checkout can create one order per vendor.
 */
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      // ── Add item — no single-vendor restriction ──────────────
      addItem: (product, quantity = 1) => {
        const { items } = get();
        const existing = items.find((i) => i.id === product.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.id === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...product, quantity }] });
        }
        return { conflict: false };
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.id !== productId) });
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

      clearCart: () => set({ items: [] }),

      clearVendorItems: (vendorId) => {
        set({ items: get().items.filter((i) => i.vendor?.id !== vendorId) });
      },

      // ── Getters ──────────────────────────────────────────────
      getTotalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((sum, i) => {
          const price = Number(i.discountPrice) || Number(i.price);
          return sum + price * i.quantity;
        }, 0),

      getTotal: () => get().getSubtotal() + 500,

      // Group items by vendor
      getVendorGroups: () => {
        const groups = {};
        get().items.forEach((item) => {
          const vid = item.vendor?.id || 'unknown';
          if (!groups[vid]) {
            groups[vid] = {
              vendorId:     vid,
              vendorName:   item.vendor?.businessName || 'Unknown Vendor',
              vendorLogo:   item.vendor?.logo || null,
              items:        [],
              subtotal:     0,
              total:        0,
            };
          }
          groups[vid].items.push(item);
          const price = Number(item.discountPrice) || Number(item.price);
          groups[vid].subtotal += price * item.quantity;
        });
        // Add delivery fee per vendor group
        Object.values(groups).forEach((g) => { g.total = g.subtotal + 500; });
        return Object.values(groups);
      },

      // For backwards-compat: first vendor in cart
      get vendorId() { return get().items[0]?.vendor?.id || null; },
      get vendorName() { return get().items[0]?.vendor?.businessName || null; },
    }),
    { name: 'sisters-kitchen-cart' }
  )
);

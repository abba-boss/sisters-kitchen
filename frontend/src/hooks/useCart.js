import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';

export const useCart = () => {
  const store = useCartStore();

  const addToCart = (product, quantity = 1) => {
    store.addItem(product, quantity);
    toast.success('Added to cart', { id: `cart-${product.id}` });
    return true;
  };

  const removeFromCart = (productId) => {
    store.removeItem(productId);
    toast.success('Removed from cart');
  };

  // All items flat
  const items    = store.items;
  const subtotal = store.getSubtotal();
  const total    = store.getTotal();

  // Multi-vendor groups for cart UI
  const vendorGroups = store.getVendorGroups();

  // Legacy single-vendor helpers (first vendor)
  const vendorId   = items[0]?.vendor?.id    || null;
  const vendorName = items[0]?.vendor?.businessName || null;

  return {
    items,
    vendorGroups,
    vendorId,
    vendorName,
    totalItems: store.getTotalItems(),
    subtotal,
    total,
    addToCart,
    removeFromCart,
    updateQuantity: store.updateQuantity,
    clearCart:       store.clearCart,
    clearVendorItems: store.clearVendorItems,
  };
};

import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';

export const useCart = () => {
  const store = useCartStore();

  const addToCart = (product, quantity = 1) => {
    const result = store.addItem(product, quantity);
    if (result?.error === 'closed') {
      toast.error('This kitchen is currently closed');
      return false;
    }
    toast.success('Added to cart', { id: `cart-${product.id}` });
    return true;
  };

  const removeFromCart = (productId, lineKey) => {
    store.removeItem(productId, lineKey);
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
    savedItems: store.savedItems,
    vendorGroups,
    vendorId,
    vendorName,
    totalItems: store.getTotalItems(),
    subtotal,
    total,
    addToCart,
    removeFromCart,
    updateQuantity: (productId, quantity, lineKey) => store.updateQuantity(productId, quantity, lineKey),
    setItemNote:   store.setItemNote,
    saveForLater:  store.saveForLater,
    moveToCart:    store.moveToCart,
    removeSavedItem: store.removeSavedItem,
    clearCart:       store.clearCart,
    clearVendorItems: store.clearVendorItems,
  };
};

import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';

export const useCart = () => {
  const store = useCartStore();

  const addToCart = (product, quantity = 1) => {
    const result = store.addItem(product, quantity);
    if (result?.conflict) {
      toast.error(`Your cart has items from ${result.vendorName}. Clear cart to add from a new vendor.`);
      return false;
    }
    toast.success('Added to cart! 🛒');
    return true;
  };

  const removeFromCart = (productId) => {
    store.removeItem(productId);
    toast.success('Removed from cart');
  };

  return {
    items: store.items,
    vendorId: store.vendorId,
    vendorName: store.vendorName,
    totalItems: store.getTotalItems(),
    subtotal: store.getSubtotal(),
    total: store.getTotal(),
    addToCart,
    removeFromCart,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
  };
};

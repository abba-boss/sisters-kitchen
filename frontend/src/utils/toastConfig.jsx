import toast from 'react-hot-toast';
import { 
  CheckCircle, XCircle, AlertCircle, 
  Info, Heart, ShoppingCart, Package 
} from 'lucide-react';

// Enhanced toast configurations with icons and better messaging
export const toastConfig = {
  // Position and styling
  position: 'top-center',
  duration: 4000,
  style: {
    borderRadius: '16px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    maxWidth: '500px',
  },
  // Custom class for animations
  className: 'toast-custom',
};

// Success toasts with contextual messages
export const showSuccessToast = (message, options = {}) => {
  return toast.success(message, {
    ...toastConfig,
    icon: '✅',
    duration: 3000,
    style: {
      ...toastConfig.style,
      background: '#F0FDF4',
      color: '#166534',
      border: '1px solid #BBF7D0',
    },
    ...options,
  });
};

// Error toasts with helpful actions
export const showErrorToast = (message, options = {}) => {
  return toast.error(message, {
    ...toastConfig,
    icon: '❌',
    duration: 5000,
    style: {
      ...toastConfig.style,
      background: '#FEF2F2',
      color: '#991B1B',
      border: '1px solid #FECACA',
    },
    ...options,
  });
};

// Info toasts
export const showInfoToast = (message, options = {}) => {
  return toast(message, {
    ...toastConfig,
    icon: 'ℹ️',
    duration: 4000,
    style: {
      ...toastConfig.style,
      background: '#EFF6FF',
      color: '#1E40AF',
      border: '1px solid #BFDBFE',
    },
    ...options,
  });
};

// Warning toasts
export const showWarningToast = (message, options = {}) => {
  return toast(message, {
    ...toastConfig,
    icon: '⚠️',
    duration: 4500,
    style: {
      ...toastConfig.style,
      background: '#FFFBEB',
      color: '#92400E',
      border: '1px solid #FDE68A',
    },
    ...options,
  });
};

// Contextual success messages
export const successMessages = {
  // Cart & Orders
  addedToCart: (productName) => `${productName} added to cart! 🛒`,
  removedFromCart: 'Item removed from cart',
  cartCleared: 'Cart cleared',
  orderPlaced: '🎉 Order placed successfully! We\'ve notified the vendor.',
  orderCancelled: 'Order cancelled',
  
  // Profile & Auth
  profileUpdated: 'Profile updated successfully',
  passwordChanged: 'Password changed successfully',
  loginSuccess: 'Welcome back! 👋',
  signupSuccess: 'Account created! Welcome to Sisters Kitchen 🎉',
  logoutSuccess: 'Logged out successfully',
  
  // Vendor
  productAdded: 'Product added! It will be visible after admin approval.',
  productUpdated: 'Product updated successfully',
  productDeleted: 'Product deleted',
  storeOpened: '🟢 Your store is now open for orders',
  storeClosed: '🔴 Your store is now closed',
  orderStatusUpdated: (status) => `Order status updated to ${status}`,
  pickupVerified: '✅ Pickup verified! Order completed.',
  
  // Reviews
  reviewSubmitted: 'Thank you for your review! 🌟',
  reviewUpdated: 'Review updated',
  reviewDeleted: 'Review deleted',
  
  // General
  changesSaved: 'Changes saved successfully',
  copied: 'Copied to clipboard!',
};

// Contextual error messages (user-friendly, actionable)
export const errorMessages = {
  // Network
  network: 'Connection issue. Please check your internet and try again.',
  timeout: 'Request timed out. Please try again.',
  serverError: 'Something went wrong on our end. Please try again later.',
  
  // Auth
  loginFailed: 'Invalid email or password. Please try again.',
  signupFailed: 'Could not create account. Please try again.',
  unauthorized: 'Please log in to continue',
  sessionExpired: 'Your session expired. Please log in again.',
  
  // Cart & Orders
  addToCartFailed: 'Could not add item to cart. Please try again.',
  orderFailed: 'Could not place order. Please try again.',
  orderNotFound: 'Order not found',
  
  // Validation
  missingFields: 'Please fill in all required fields',
  invalidEmail: 'Please enter a valid email address',
  invalidPhone: 'Please enter a valid phone number',
  passwordTooShort: 'Password must be at least 6 characters',
  passwordsMismatch: 'Passwords do not match',
  
  // Vendor
  productUploadFailed: 'Could not upload product. Please try again.',
  imageSizeTooLarge: 'Image size too large. Max 5MB per image.',
  imageUploadFailed: 'Could not upload image. Please try again.',
  
  // Payment
  paymentFailed: 'Payment failed. Please try again.',
  paymentCancelled: 'Payment cancelled',
  
  // General
  somethingWentWrong: 'Something went wrong. Please try again.',
  notFound: 'Item not found',
  forbidden: 'You don\'t have permission to do that',
  updateFailed: 'Could not save changes. Please try again.',
  deleteFailed: 'Could not delete item. Please try again.',
};

// Toast with action button
export const showToastWithAction = (message, actionLabel, onAction, options = {}) => {
  return toast.custom(
    (t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
        max-w-md w-full bg-white shadow-lg rounded-2xl pointer-events-auto 
        flex items-center justify-between p-4 border border-orange-100`}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {options.icon || '✅'}
          </div>
          <p className="text-sm font-medium text-brand-dark">{message}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onAction();
              toast.dismiss(t.id);
            }}
            className="text-sm font-semibold text-primary hover:underline"
          >
            {actionLabel}
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-brand-muted hover:text-brand-dark"
          >
            ✕
          </button>
        </div>
      </div>
    ),
    {
      duration: 6000,
      ...options,
    }
  );
};

// Loading toast
export const showLoadingToast = (message = 'Loading...') => {
  return toast.loading(message, {
    style: {
      ...toastConfig.style,
      background: '#F9FAFB',
      color: '#374151',
    },
  });
};

// Promise toast (auto-handles loading, success, error)
export const showPromiseToast = (promise, messages) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || 'Processing...',
      success: messages.success || 'Success!',
      error: messages.error || 'Failed. Please try again.',
    },
    {
      style: toastConfig.style,
      success: {
        duration: 3000,
        icon: '✅',
      },
      error: {
        duration: 5000,
        icon: '❌',
      },
    }
  );
};

// Cart action toasts
export const cartToasts = {
  added: (productName) => showSuccessToast(successMessages.addedToCart(productName)),
  removed: () => showInfoToast(successMessages.removedFromCart),
  cleared: () => showInfoToast(successMessages.cartCleared),
  failed: () => showErrorToast(errorMessages.addToCartFailed),
};

// Order action toasts
export const orderToasts = {
  placed: () => showSuccessToast(successMessages.orderPlaced, { duration: 6000 }),
  failed: () => showErrorToast(errorMessages.orderFailed),
  statusUpdated: (status) => showSuccessToast(successMessages.orderStatusUpdated(status)),
};

// Auth action toasts
export const authToasts = {
  loginSuccess: () => showSuccessToast(successMessages.loginSuccess),
  loginFailed: () => showErrorToast(errorMessages.loginFailed),
  signupSuccess: () => showSuccessToast(successMessages.signupSuccess),
  signupFailed: () => showErrorToast(errorMessages.signupFailed),
  logoutSuccess: () => showInfoToast(successMessages.logoutSuccess),
  unauthorized: () => showWarningToast(errorMessages.unauthorized),
};

// Vendor action toasts
export const vendorToasts = {
  productAdded: () => showSuccessToast(successMessages.productAdded, { duration: 5000 }),
  productUpdated: () => showSuccessToast(successMessages.productUpdated),
  productDeleted: () => showInfoToast(successMessages.productDeleted),
  storeOpened: () => showSuccessToast(successMessages.storeOpened),
  storeClosed: () => showInfoToast(successMessages.storeClosed),
  pickupVerified: () => showSuccessToast(successMessages.pickupVerified),
};

export default {
  success: showSuccessToast,
  error: showErrorToast,
  info: showInfoToast,
  warning: showWarningToast,
  loading: showLoadingToast,
  promise: showPromiseToast,
  withAction: showToastWithAction,
  cart: cartToasts,
  order: orderToasts,
  auth: authToasts,
  vendor: vendorToasts,
};

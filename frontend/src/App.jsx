import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useEffect } from 'react';
import { Bell } from 'lucide-react';

// Socket
import { useSocketConnection, useSocketEvent } from './hooks/useSocket';
import { useNotificationStore } from './store/notificationStore';
import { useAuthStore } from './store/authStore';

// Customer Pages
import HomePage from './pages/customer/HomePage';
import ProductsPage from './pages/customer/ProductsPage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import VendorsPage from './pages/customer/VendorsPage';
import VendorProfilePage from './pages/customer/VendorProfilePage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrdersPage from './pages/customer/OrdersPage';
import OrderDetailPage from './pages/customer/OrderDetailPage';
import WishlistPage from './pages/customer/WishlistPage';
import NotificationsPage from './pages/customer/NotificationsPage';
import LoginPage from './pages/customer/LoginPage';
import RegisterPage from './pages/customer/RegisterPage';
import PaymentVerifyPage from './pages/customer/PaymentVerifyPage';
import PaymentHistoryPage from './pages/customer/PaymentHistoryPage';
import ProfilePage from './pages/customer/ProfilePage';

// Vendor Pages
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorProducts from './pages/vendor/VendorProducts';
import ProductForm from './pages/vendor/ProductForm';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorProfile from './pages/vendor/VendorProfile';
import VendorEarnings from './pages/vendor/VendorEarnings';
import VendorReviews from './pages/vendor/VendorReviews';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVendors from './pages/admin/AdminVendors';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOrders from './pages/admin/AdminOrders';
import AdminAnalytics from './pages/admin/AdminAnalytics';

// Common
import ProtectedRoute from './components/common/ProtectedRoute';
import AuthModal from './components/common/AuthModal';

// ─── Socket + Notification wiring ────────────────────────────
function AppProviders() {
  useSocketConnection();

  const { addNotification } = useNotificationStore();
  const { isAuthenticated } = useAuthStore();

  // Live notification events
  useSocketEvent('notification:new', (notification) => {
    addNotification(notification);
    toast.custom((t) => (
      <div
        className={`flex items-center gap-3 bg-white border border-orange-100 px-4 py-3 rounded-2xl shadow-card-hover max-w-sm ${
          t.visible ? 'animate-enter' : 'animate-leave'
        }`}
      >
        <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <Bell size={16} className="text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-dark truncate">{notification.title}</p>
          <p className="text-xs text-brand-muted truncate">{notification.message}</p>
        </div>
      </div>
    ), { duration: 4500 });
  });

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        gutter={10}
        containerClassName="!top-4"
        toastOptions={{
          className: 'toast-message',
          style: {
            borderRadius: '14px',
            background: '#fff',
            color: '#4A2C2A',
            border: '1px solid #FFE4D6',
            boxShadow: '0 8px 30px rgba(74, 44, 42, 0.12)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 16px',
            maxWidth: '420px',
          },
          success: {
            iconTheme: { primary: '#5FA36A', secondary: '#fff' },
            style: { borderColor: '#C8E6CA' },
          },
          error: {
            iconTheme: { primary: '#FF7A59', secondary: '#fff' },
            style: { borderColor: '#FFD4C8' },
          },
          duration: 3200,
        }}
      />
      <AuthModal />
      <AppProviders />

      <Routes>
        {/* Public — no login needed to browse or add to cart */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/vendors" element={<VendorsPage />} />
        <Route path="/vendors/:id" element={<VendorProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/payment/verify" element={<PaymentVerifyPage />} />

        {/* Cart is public — guests can browse and build a cart */}
        <Route path="/cart" element={<CartPage />} />

        {/* Everything below requires login */}
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><PaymentHistoryPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Vendor */}
        <Route path="/vendor/dashboard" element={<ProtectedRoute roles={['vendor']}><VendorDashboard /></ProtectedRoute>} />
        <Route path="/vendor/products" element={<ProtectedRoute roles={['vendor']}><VendorProducts /></ProtectedRoute>} />
        <Route path="/vendor/products/new" element={<ProtectedRoute roles={['vendor']}><ProductForm /></ProtectedRoute>} />
        <Route path="/vendor/products/:id/edit" element={<ProtectedRoute roles={['vendor']}><ProductForm /></ProtectedRoute>} />
        <Route path="/vendor/orders" element={<ProtectedRoute roles={['vendor']}><VendorOrders /></ProtectedRoute>} />
        <Route path="/vendor/profile" element={<ProtectedRoute roles={['vendor']}><VendorProfile /></ProtectedRoute>} />
        <Route path="/vendor/earnings" element={<ProtectedRoute roles={['vendor']}><VendorEarnings /></ProtectedRoute>} />
        <Route path="/vendor/reviews" element={<ProtectedRoute roles={['vendor']}><VendorReviews /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/vendors" element={<ProtectedRoute roles={['admin']}><AdminVendors /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute roles={['admin']}><AdminOrders /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><AdminAnalytics /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

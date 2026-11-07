import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { lazy, Suspense, useEffect } from 'react';
import { Bell } from 'lucide-react';

// Socket
import { useSocketConnection, useSocketEvent } from './hooks/useSocket';
import { useNotificationStore } from './store/notificationStore';
import { useAuthStore } from './store/authStore';
import { authService } from './services/authService';

// Customer Pages
import HomePage from './pages/customer/HomePage';
import ShopPage from './pages/customer/ShopPage';
import RewardsPage from './pages/customer/RewardsPage';
import ProductsPage from './pages/customer/ProductsPage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import VendorsPage from './pages/customer/VendorsPage';
import VendorProfilePage from './pages/customer/VendorProfilePage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrdersPage from './pages/customer/OrdersPage';
import OrderDetailPage from './pages/customer/OrderDetailPage';
import NotificationsPage from './pages/customer/NotificationsPage';
import LoginPage from './pages/customer/LoginPage';
import RegisterPage from './pages/customer/RegisterPage';
import PaymentVerifyPage from './pages/customer/PaymentVerifyPage';
import PaymentHistoryPage from './pages/customer/PaymentHistoryPage';
import ProfilePage from './pages/customer/ProfilePage';

// Vendor Pages — split into their own chunks, customers never download them
const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'));
const VendorProducts = lazy(() => import('./pages/vendor/VendorProducts'));
const ProductForm = lazy(() => import('./pages/vendor/ProductForm'));
const VendorOrders = lazy(() => import('./pages/vendor/VendorOrders'));
const VendorProfile = lazy(() => import('./pages/vendor/VendorProfile'));
const VendorEarnings = lazy(() => import('./pages/vendor/VendorEarnings'));
const VendorFeedback = lazy(() => import('./pages/vendor/VendorFeedback'));
const VendorReviews = lazy(() => import('./pages/vendor/VendorReviews'));
const VendorMessages = lazy(() => import('./pages/vendor/VendorMessages'));

// Admin Pages — same, lazy-loaded
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminVendors = lazy(() => import('./pages/admin/AdminVendors'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'));

// Common
import ProtectedRoute from './components/common/ProtectedRoute';
import AuthModal from './components/common/AuthModal';
import NotFoundPage from './pages/NotFoundPage';
import DailyRewardModal from './components/social/DailyRewardModal';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/common/OfflineBanner';
import ScrollToTop from './components/common/ScrollToTop';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';

// ─── Socket + Notification wiring ────────────────────────────
function AppProviders() {
  useSocketConnection();

  const { addNotification } = useNotificationStore();
  const { isAuthenticated, updateUser } = useAuthStore();

  // Refresh user profile on boot to keep data current
  useEffect(() => {
    if (!isAuthenticated) return;
    authService.getMe()
      .then(({ data }) => { if (data.data) updateUser(data.data); })
      .catch(() => { /* token may be expired — leave it, refresh handles it */ });
  }, [isAuthenticated, updateUser]);

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
      <ErrorBoundary>
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
      <OfflineBanner />
      <ScrollToTop />
      <AuthModal />
      <DailyRewardModal />
      <PWAInstallPrompt />
      <AppProviders />

      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-brand-bg">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        }
      >
      <Routes>
        {/* Public — no login needed to browse or add to cart */}
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
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
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><PaymentHistoryPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/rewards" element={<ProtectedRoute><RewardsPage /></ProtectedRoute>} />

        {/* Vendor */}
        <Route path="/vendor/dashboard" element={<ProtectedRoute roles={['vendor']}><VendorDashboard /></ProtectedRoute>} />
        <Route path="/vendor/products" element={<ProtectedRoute roles={['vendor']}><VendorProducts /></ProtectedRoute>} />
        <Route path="/vendor/products/new" element={<ProtectedRoute roles={['vendor']}><ProductForm /></ProtectedRoute>} />
        <Route path="/vendor/products/:id/edit" element={<ProtectedRoute roles={['vendor']}><ProductForm /></ProtectedRoute>} />
        <Route path="/vendor/orders" element={<ProtectedRoute roles={['vendor']}><VendorOrders /></ProtectedRoute>} />
        <Route path="/vendor/profile" element={<ProtectedRoute roles={['vendor']}><VendorProfile /></ProtectedRoute>} />
        <Route path="/vendor/earnings" element={<ProtectedRoute roles={['vendor']}><VendorEarnings /></ProtectedRoute>} />
        <Route path="/vendor/feedback" element={<ProtectedRoute roles={['vendor']}><VendorFeedback /></ProtectedRoute>} />
        <Route path="/vendor/reviews" element={<ProtectedRoute roles={['vendor']}><VendorReviews /></ProtectedRoute>} />
        <Route path="/vendor/messages" element={<ProtectedRoute roles={['vendor']}><VendorMessages /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/vendors" element={<ProtectedRoute roles={['admin']}><AdminVendors /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute roles={['admin']}><AdminOrders /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><AdminAnalytics /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute roles={['admin']}><AdminProducts /></ProtectedRoute>} />
        <Route path="/admin/messages" element={<ProtectedRoute roles={['admin']}><AdminMessages /></ProtectedRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

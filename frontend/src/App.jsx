import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { Bell } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

// Socket
import { useSocketConnection, useSocketEvent } from './hooks/useSocket';
import { useNotificationStore } from './store/notificationStore';
import { useAuthStore } from './store/authStore';
import { useRewardStore } from './store/rewardStore';
import { authService } from './services/authService';
import { rewardService } from './services/rewardService';
import DailyRewardModal from './components/social/DailyRewardModal';
import CreatePostModal from './components/social/CreatePostModal';
import { useCreatePostStore } from './store/createPostStore';
import { favoriteService } from './services/favoriteService';
import { useWishlistStore } from './store/wishlistStore';

// Eager — critical first-paint & auth paths
import FeedPage from './pages/social/FeedPage';
import ProductsPage from './pages/customer/ProductsPage';
import LoginPage from './pages/customer/LoginPage';
import RegisterPage from './pages/customer/RegisterPage';
import CartPage from './pages/customer/CartPage';
import NotFoundPage from './pages/NotFoundPage';

// Common
import ProtectedRoute from './components/common/ProtectedRoute';
import AuthModal from './components/common/AuthModal';
import RouteFallback from './components/common/RouteFallback';

// Lazy — heavier or less-frequent routes
const DiscoverPage = lazy(() => import('./pages/social/DiscoverPage'));
const ProductDetailPage = lazy(() => import('./pages/customer/ProductDetailPage'));
const VendorsPage = lazy(() => import('./pages/customer/VendorsPage'));
const VendorProfilePage = lazy(() => import('./pages/customer/VendorProfilePage'));
const CheckoutPage = lazy(() => import('./pages/customer/CheckoutPage'));
const OrdersPage = lazy(() => import('./pages/customer/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/customer/OrderDetailPage'));
const WishlistPage = lazy(() => import('./pages/customer/WishlistPage'));
const NotificationsPage = lazy(() => import('./pages/customer/NotificationsPage'));
const ForgotPasswordPage = lazy(() => import('./pages/customer/ForgotPasswordPage'));
const OtpPage = lazy(() => import('./pages/customer/OtpPage'));
const ResetPasswordPage = lazy(() => import('./pages/customer/ResetPasswordPage'));
const PaymentVerifyPage = lazy(() => import('./pages/customer/PaymentVerifyPage'));
const PaymentHistoryPage = lazy(() => import('./pages/customer/PaymentHistoryPage'));
const ProfilePage = lazy(() => import('./pages/customer/ProfilePage'));
const RewardsPage = lazy(() => import('./pages/customer/RewardsPage'));

const PostDetailPage = lazy(() => import('./pages/social/PostDetailPage'));
const PostEditPage = lazy(() => import('./pages/social/PostEditPage'));
const SavedPostsPage = lazy(() => import('./pages/social/SavedPostsPage'));

const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'));
const VendorProducts = lazy(() => import('./pages/vendor/VendorProducts'));
const ProductForm = lazy(() => import('./pages/vendor/ProductForm'));
const VendorOrders = lazy(() => import('./pages/vendor/VendorOrders'));
const VendorProfile = lazy(() => import('./pages/vendor/VendorProfile'));
const VendorEarnings = lazy(() => import('./pages/vendor/VendorEarnings'));
const VendorReviews = lazy(() => import('./pages/vendor/VendorReviews'));
const VendorPosts = lazy(() => import('./pages/vendor/VendorPosts'));
const VendorStories = lazy(() => import('./pages/vendor/VendorStories'));
const BusinessHub = lazy(() => import('./pages/vendor/BusinessHub'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminVendors = lazy(() => import('./pages/admin/AdminVendors'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));

// ─── Socket + Notification wiring ────────────────────────────
function AuthBootstrap() {
  const { isAuthenticated, _hasHydrated, updateUser, logout } = useAuthStore();
  const { setBalance } = useRewardStore();
  const { setItems: setWishlistItems } = useWishlistStore();
  const clearNotifications = useNotificationStore((state) => state.clear);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) {
      setWishlistItems([]);
      setBalance(0);
      clearNotifications();
      return;
    }
    authService.getMe()
      .then(({ data }) => updateUser(data.data))
      .catch(() => logout());
    favoriteService.getAll()
      .then(({ data }) => {
        const products = (data.data || []).map((f) => f.product).filter(Boolean);
        setWishlistItems(products);
      })
      .catch(() => {});
    rewardService.getWallet()
      .then(({ data }) => {
        setBalance(Number(data.data.balance), data.data.lastDailyRewardAt);
      })
      .catch(() => {});
  }, [_hasHydrated, clearNotifications, isAuthenticated, logout, setBalance, setWishlistItems, updateUser]);

  return null;
}

function AppProviders() {
  useSocketConnection();
  const { addNotification } = useNotificationStore();

  useSocketEvent('notification:new', (notification) => {
    addNotification(notification);
    toast.custom((t) => (
      <div
        className={`flex items-center gap-3 bg-white border border-orange-100 px-4 py-3 rounded-2xl shadow-card-hover max-w-sm ${
          t.visible ? 'animate-enter' : 'animate-leave'
        }`}
      >
        <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <Bell size={16} className="text-primary" aria-hidden="true" />
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

/**
 * Nudges returning members to claim their daily Kitchen Coins once per day.
 * A dismissed modal is remembered for the rest of the day.
 */
function DailyRewardWrapper() {
  const { showDailyModal, setShowDailyModal, lastDailyRewardAt } = useRewardStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;
    const claimedToday =
      lastDailyRewardAt &&
      new Date(lastDailyRewardAt).toDateString() === new Date().toDateString();
    if (!claimedToday) setShowDailyModal(true);
  }, [isAuthenticated, lastDailyRewardAt, setShowDailyModal]);

  if (!isAuthenticated || !showDailyModal) return null;
  return <DailyRewardModal isOpen={showDailyModal} onClose={() => setShowDailyModal(false)} />;
}

/** Only verified kitchens can publish, so the composer only mounts for vendors. */
function VendorCreatePostModal({ isOpen, onClose }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || user?.role !== 'vendor') return null;
  return <CreatePostModal isOpen={isOpen} onClose={onClose} />;
}

export default function App() {
  const createPostOpen = useCreatePostStore((state) => state.isOpen);
  const closeCreatePost = useCreatePostStore((state) => state.close);

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
      <VendorCreatePostModal isOpen={createPostOpen} onClose={closeCreatePost} />
      <AuthBootstrap />
      <AppProviders />
      <DailyRewardWrapper />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<RouteFallback />}>
        <Routes location={location} key={location.pathname}>
          {/* Landing = Feed */}
          <Route path="/" element={<FeedPage />} />
          <Route path="/feed" element={<Navigate to="/" replace />} />
          {/* Commerce stays contextual to food stories and kitchens */}
          <Route path="/shop" element={<Navigate to="/products" replace />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          {/* Explore */}
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/vendors" element={<VendorsPage />} />
          <Route path="/vendors/:id" element={<VendorProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/otp" element={<OtpPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/payment/verify" element={<PaymentVerifyPage />} />
          <Route path="/posts/:id" element={<PostDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          {/* Auth required */}
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
          <Route path="/saved" element={<ProtectedRoute><SavedPostsPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><PaymentHistoryPage /></ProtectedRoute>} />
          <Route path="/rewards" element={<ProtectedRoute><RewardsPage /></ProtectedRoute>} />
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
          <Route path="/vendor/posts" element={<ProtectedRoute roles={['vendor']}><VendorPosts /></ProtectedRoute>} />
          <Route path="/vendor/posts/:id/edit" element={<ProtectedRoute roles={['vendor']}><PostEditPage /></ProtectedRoute>} />
          <Route path="/vendor/stories" element={<ProtectedRoute roles={['vendor']}><VendorStories /></ProtectedRoute>} />
          <Route path="/vendor/hub" element={<ProtectedRoute roles={['vendor']}><BusinessHub /></ProtectedRoute>} />
          {/* Admin */}
          <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/vendors" element={<ProtectedRoute roles={['admin']}><AdminVendors /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute roles={['admin']}><AdminOrders /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><AdminAnalytics /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute roles={['admin']}><AdminProducts /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

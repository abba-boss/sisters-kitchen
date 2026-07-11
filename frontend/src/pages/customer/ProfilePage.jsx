import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Lock, Save, Eye, EyeOff, Wallet, Gift, Package, Heart,
  Store, MapPin, CreditCard, Bell, Settings, Users, ChevronRight,
  Copy, Check, Trash2, CheckCheck, Sparkles, ShieldCheck, Coins,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import PageSection from '../../components/common/PageSection';
import ProductCard from '../../components/common/ProductCard';
import VendorCard from '../../components/common/VendorCard';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useRewardStore } from '../../store/rewardStore';
import { authService } from '../../services/authService';
import { rewardService } from '../../services/rewardService';
import { orderService } from '../../services/orderService';
import { favoriteService } from '../../services/favoriteService';
import { followerService } from '../../services/followerService';
import { paymentService } from '../../services/paymentService';
import { notificationService } from '../../services/notificationService';
import {
  formatPrice, formatDate, formatDateTime, timeAgo,
  getOrderStatusColor, getOrderStatusLabel,
} from '../../utils/formatters';
import toast from 'react-hot-toast';

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: Sparkles },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'rewards', label: 'Rewards', icon: Gift },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'saved-foods', label: 'Saved Foods', icon: Heart },
  { id: 'saved-vendors', label: 'Saved Vendors', icon: Store },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'referral', label: 'Referral', icon: Users },
];

const TYPE_EMOJI = {
  order_placed: '🛒', order_confirmed: '✅', order_preparing: '👩‍🍳',
  order_ready: '🎉', order_delivered: '🍽️', order_cancelled: '❌',
  new_order: '🛎️', payment_success: '💳', payment_failed: '⚠️',
  vendor_approved: '🎊', general: '🔔',
};

const PAYMENT_STATUS = {
  success: 'badge-success',
  pending: 'badge-warning',
  failed: 'badge-danger',
  refunded: 'bg-blue-100 text-blue-600 badge',
};

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { balance, setBalance } = useRewardStore();
  const {
    notifications, unreadCount, setNotifications,
    markAsRead, markAllAsRead, removeNotification,
  } = useNotificationStore();

  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [orders, setOrders] = useState([]);
  const [savedFoods, setSavedFoods] = useState([]);
  const [savedVendors, setSavedVendors] = useState([]);
  const [payments, setPayments] = useState([]);
  const [claiming, setClaiming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [copied, setCopied] = useState(false);
  const [settingsTab, setSettingsTab] = useState('profile');

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const sectionRefs = useRef({});

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      address: user.address || '',
    });
  }, [user]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      rewardService.getWallet().then(({ data }) => {
        setWallet(data.data);
        setBalance(Number(data.data?.balance || 0));
      }).catch(() => {}),
      orderService.getMyOrders({ limit: 5 }).then(({ data }) => setOrders(data.data || [])).catch(() => {}),
      favoriteService.getAll().then(({ data }) => {
        setSavedFoods((data.data || []).map((f) => f.product).filter(Boolean));
      }).catch(() => {}),
      followerService.getFollowing().then(({ data }) => setSavedVendors(data.data || [])).catch(() => {}),
      paymentService.getMyPayments({ limit: 5 }).then(({ data }) => setPayments(data.data || [])).catch(() => {}),
      notificationService.getAll().then(({ data }) => setNotifications(data.data || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [setBalance, setNotifications]);

  const scrollToSection = (id) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await authService.updateProfile(profileForm);
      updateUser(data.data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (pwdForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await authService.changePassword({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      toast.success('Password changed successfully!');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const handleClaimDaily = async () => {
    setClaiming(true);
    try {
      const { data } = await rewardService.claimDaily();
      toast.success(data.message);
      const { data: walletRes } = await rewardService.getWallet();
      setWallet(walletRes.data);
      setBalance(Number(walletRes.data?.balance || 0));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not claim reward');
    } finally { setClaiming(false); }
  };

  const canClaimToday = () => {
    if (!wallet?.lastDailyRewardAt) return true;
    return new Date(wallet.lastDailyRewardAt).toDateString() !== new Date().toDateString();
  };

  const referralLink = `${window.location.origin}/register?ref=${user?.id || ''}`;
  const coinToNaira = (coins) => Math.floor(Number(coins || 0) / 10) * 100;

  const handleCopyReferral = () => {
    navigator.clipboard?.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkRead = async (id) => {
    markAsRead(id);
    await notificationService.markAsRead(id).catch(() => {});
  };

  const handleMarkAll = async () => {
    markAllAsRead();
    await notificationService.markAllAsRead().catch(() => {});
    toast.success('All marked as read');
  };

  const handleDeleteNotification = async (id) => {
    removeNotification(id);
    await notificationService.delete(id).catch(() => {});
  };

  return (
    <MainLayout>
      <div className="page-container page-shell">
        {/* Profile Header */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-orange-100 bg-gradient-to-br from-white via-orange-50/40 to-primary/5 shadow-card overflow-hidden mb-8"
        >
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[1.6rem] bg-primary/10 flex items-center justify-center shadow-soft flex-shrink-0">
                <span className="font-poppins font-bold text-primary text-3xl sm:text-4xl">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-brand-dark">
                    {user?.firstName} {user?.lastName}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent capitalize">
                    <ShieldCheck size={12} />
                    {user?.role}
                  </span>
        </div>
                <p className="text-brand-muted text-sm sm:text-base">{user?.email}</p>
                {user?.phone && <p className="text-brand-muted text-sm mt-0.5">{user?.phone}</p>}
              </div>
              <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                <StatPill label="Wallet" value={`${Math.floor(balance)} coins`} />
                <StatPill label="Orders" value={orders.length > 0 ? `${orders.length}+` : '0'} />
                <StatPill label="Saved" value={savedFoods.length} />
              </div>
            </div>
          </div>
        </motion.section>

        <div className="grid xl:grid-cols-[240px_minmax(0,1fr)] gap-8 items-start">
          {/* Sidebar nav */}
          <aside className="xl:sticky xl:top-24">
            <div className="rounded-[1.6rem] border border-orange-100 bg-white shadow-card p-3 hidden xl:block">
              <nav className="space-y-1">
                {SECTIONS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                      activeSection === id
                        ? 'bg-primary text-white shadow-soft'
                        : 'text-brand-muted hover:bg-brand-bg hover:text-brand-dark'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Mobile nav pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide xl:hidden">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    activeSection === id
                      ? 'bg-primary text-white shadow-soft'
                      : 'bg-white text-brand-muted border border-orange-100'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </aside>

          {/* Main sections */}
          <div className="space-y-8 min-w-0">
            {/* Overview */}
            <PageSection
              ref={(el) => { sectionRefs.current.overview = el; }}
              id="overview"
              title="Account Overview"
              subtitle="Your premium Sisters Kitchen hub at a glance."
            >
              {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-28 rounded-[1.4rem] bg-orange-100/60 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <OverviewTile
                    icon={Wallet}
                    title="Wallet Balance"
                    value={`${Math.floor(balance)} coins`}
                    sub={`≈ ${formatPrice(coinToNaira(balance))} value`}
                    onClick={() => scrollToSection('wallet')}
                  />
                  <OverviewTile
                    icon={Package}
                    title="Recent Orders"
                    value={orders[0] ? `#${orders[0].orderNumber}` : 'No orders yet'}
                    sub={orders[0] ? getOrderStatusLabel(orders[0].status) : 'Start ordering'}
                    onClick={() => scrollToSection('orders')}
                  />
                  <OverviewTile
                    icon={Heart}
                    title="Saved Foods"
                    value={`${savedFoods.length} items`}
                    sub="Your favorite dishes"
                    onClick={() => scrollToSection('saved-foods')}
                  />
                </div>
              )}
            </PageSection>

            {/* Wallet */}
            <PageSection
              ref={(el) => { sectionRefs.current.wallet = el; }}
              id="wallet"
              title="Wallet"
              subtitle="Your Kitchen Coins balance and discount value."
              action={<Link to="/rewards" className="text-sm font-semibold text-primary hover:underline">View rewards →</Link>}
            >
              <div className="rounded-[1.6rem] bg-gradient-to-br from-primary to-primary-dark p-6 text-white relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
                <div className="relative z-10">
                  <p className="text-white/70 text-sm mb-1">Available Balance</p>
                  <p className="font-poppins font-bold text-4xl sm:text-5xl">
                    {Math.floor(balance)}
                    <span className="text-xl ml-2 text-white/80">coins</span>
                  </p>
                  <p className="text-white/70 text-sm mt-2">
                    ≈ {formatPrice(coinToNaira(balance))} discount at checkout
                  </p>
                  <div className="flex flex-wrap gap-4 mt-5 text-sm">
                    <div>
                      <p className="text-white/60 text-xs">Total Earned</p>
                      <p className="font-semibold">{Number(wallet?.totalEarned || 0).toFixed(0)}</p>
                    </div>
                    <div className="w-px h-8 bg-white/20" />
              <div>
                      <p className="text-white/60 text-xs">Total Spent</p>
                      <p className="font-semibold">{Number(wallet?.totalSpent || 0).toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </PageSection>

            {/* Reward Points */}
            <PageSection
              ref={(el) => { sectionRefs.current.rewards = el; }}
              id="rewards"
              title="Reward Points"
              subtitle="Earn coins with every order, review, and daily login."
            >
              <div className="space-y-4">
                <motion.button
                  onClick={handleClaimDaily}
                  disabled={!canClaimToday() || claiming}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full rounded-[1.4rem] p-4 flex items-center justify-between transition-all ${
                    canClaimToday()
                      ? 'bg-yellow-50 border-2 border-yellow-200 hover:border-yellow-400'
                      : 'bg-gray-50 border-2 border-gray-100 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-yellow-100 rounded-xl flex items-center justify-center text-xl">☀️</div>
                    <div className="text-left">
                      <p className="font-semibold text-brand-dark text-sm">
                        {canClaimToday() ? 'Claim Daily Reward' : 'Already claimed today'}
                      </p>
                      <p className="text-xs text-brand-muted">
                        {canClaimToday() ? 'Earn 3+ coins · keep your streak going' : 'Come back tomorrow'}
                      </p>
                    </div>
                  </div>
                  <span className="bg-yellow-400 text-white text-sm font-bold px-3 py-1.5 rounded-xl">
                    {claiming ? '...' : '+3 🪙'}
                  </span>
                </motion.button>

                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    ['🛒', 'Place an order', '1 coin / ₦100'],
                    ['⭐', 'Write a review', '10 coins'],
                    ['👥', 'Refer a friend', '50 coins'],
                    ['☀️', 'Daily login', '3 coins/day'],
                  ].map(([icon, text, coins]) => (
                    <div key={text} className="flex items-center justify-between rounded-[1.2rem] border border-orange-100 bg-brand-bg/50 px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{icon}</span>
                        <span className="text-sm text-brand-dark">{text}</span>
                      </div>
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">{coins}</span>
                    </div>
                  ))}
                </div>
              </div>
            </PageSection>

            {/* Order History */}
            <PageSection
              ref={(el) => { sectionRefs.current.orders = el; }}
              id="orders"
              title="Order History"
              subtitle="Your most recent orders and statuses."
              action={<Link to="/orders" className="text-sm font-semibold text-primary hover:underline">View all →</Link>}
            >
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-[1.4rem] bg-orange-100/60 animate-pulse" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <EmptyBlock icon={Package} message="No orders yet." actionLabel="Browse Food" actionTo="/products" />
              ) : (
                <div className="space-y-3">
                  {orders.map((order, i) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        to={`/orders/${order.id}`}
                        className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-orange-100 bg-white p-4 hover:border-primary/30 hover:shadow-soft transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                            <Package size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-brand-dark text-sm">Order #{order.orderNumber}</p>
                            <p className="text-xs text-brand-muted truncate">
                              {order.vendor?.businessName} · {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <span className={`badge ${getOrderStatusColor(order.status)} text-xs`}>
                              {getOrderStatusLabel(order.status)}
                            </span>
                            <p className="font-poppins font-bold text-brand-dark text-sm mt-1">
                              {formatPrice(order.total)}
                            </p>
                          </div>
                          <ChevronRight size={16} className="text-brand-muted group-hover:text-primary transition-colors" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </PageSection>

            {/* Saved Foods */}
            <PageSection
              ref={(el) => { sectionRefs.current['saved-foods'] = el; }}
              id="saved-foods"
              title="Saved Foods"
              subtitle="Dishes you've saved for later."
              action={<Link to="/wishlist" className="text-sm font-semibold text-primary hover:underline">View wishlist →</Link>}
            >
              {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-64 rounded-[1.6rem] bg-orange-100/60 animate-pulse" />
                  ))}
                </div>
              ) : savedFoods.length === 0 ? (
                <EmptyBlock icon={Heart} message="No saved foods yet." actionLabel="Discover Food" actionTo="/products" />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedFoods.slice(0, 6).map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </div>
              )}
            </PageSection>

            {/* Saved Vendors */}
            <PageSection
              ref={(el) => { sectionRefs.current['saved-vendors'] = el; }}
              id="saved-vendors"
              title="Saved Vendors"
              subtitle="Kitchens you follow and love."
              action={<Link to="/vendors" className="text-sm font-semibold text-primary hover:underline">Explore vendors →</Link>}
            >
              {loading ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-56 rounded-[1.6rem] bg-orange-100/60 animate-pulse" />
                  ))}
                </div>
              ) : savedVendors.length === 0 ? (
                <EmptyBlock icon={Store} message="You're not following any vendors yet." actionLabel="Find Vendors" actionTo="/vendors" />
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {savedVendors.slice(0, 4).map((vendor, i) => (
                    <motion.div
                      key={vendor.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <VendorCard vendor={vendor} />
                    </motion.div>
                  ))}
                </div>
              )}
            </PageSection>

            {/* Addresses */}
            <PageSection
              ref={(el) => { sectionRefs.current.addresses = el; }}
              id="addresses"
              title="Addresses"
              subtitle="Manage your default delivery address."
            >
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="rounded-[1.4rem] border border-orange-100 bg-brand-bg/50 p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-white text-primary flex items-center justify-center shadow-soft">
                      <MapPin size={17} />
            </div>
            <div>
                      <p className="font-semibold text-brand-dark">Default Delivery Address</p>
                      <p className="text-sm text-brand-muted mt-0.5">Used at checkout and for order delivery.</p>
                    </div>
                  </div>
                  <textarea
                    value={profileForm.address}
                    onChange={(e) => setProfileForm((p) => ({ ...p, address: e.target.value }))}
                    rows={3}
                    placeholder="Your full delivery address..."
                    className="input-field resize-none"
                  />
                </div>
                <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2">
                  <Save size={16} />
                  {saving ? 'Saving…' : 'Save Address'}
                </button>
              </form>
            </PageSection>

            {/* Payment History */}
            <PageSection
              ref={(el) => { sectionRefs.current.payments = el; }}
              id="payments"
              title="Payment History"
              subtitle="Recent transactions and receipts."
              action={<Link to="/payments" className="text-sm font-semibold text-primary hover:underline">View all →</Link>}
            >
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-[1.4rem] bg-orange-100/60 animate-pulse" />
                  ))}
                </div>
              ) : payments.length === 0 ? (
                <EmptyBlock icon={CreditCard} message="No payments yet." actionLabel="Start Ordering" actionTo="/products" />
              ) : (
                <div className="space-y-3">
                  {payments.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-orange-100 bg-white p-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                          <CreditCard size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-brand-dark truncate">{p.reference}</p>
                          <p className="text-xs text-brand-muted">{formatDateTime(p.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-poppins font-bold text-brand-dark">{formatPrice(p.amount)}</p>
                        <span className={`badge ${PAYMENT_STATUS[p.status] || 'badge-warning'} text-xs capitalize`}>
                          {p.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </PageSection>

            {/* Notifications */}
            <PageSection
              ref={(el) => { sectionRefs.current.notifications = el; }}
              id="notifications"
              title="Notifications"
              subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up.'}
              action={(
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAll} className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1">
                      <CheckCheck size={14} /> Mark all read
                    </button>
                  )}
                  <Link to="/notifications" className="text-sm font-semibold text-primary hover:underline">View all →</Link>
                </div>
              )}
            >
              {notifications.length === 0 ? (
                <EmptyBlock icon={Bell} message="No notifications yet." />
              ) : (
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {notifications.slice(0, 5).map((n, i) => (
                      <motion.div
                        key={n.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: i * 0.03 }}
                        className={`flex items-start gap-3 rounded-[1.4rem] border p-4 ${
                          !n.isRead ? 'border-primary/30 bg-primary/5' : 'border-orange-100 bg-white'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-full bg-brand-bg flex items-center justify-center text-base flex-shrink-0">
                          {TYPE_EMOJI[n.type] || '🔔'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${!n.isRead ? 'text-brand-dark' : 'text-brand-muted'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-brand-muted mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-brand-muted/60 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          {!n.isRead && (
                            <button onClick={() => handleMarkRead(n.id)} className="p-1.5 rounded-lg hover:bg-accent/10 text-brand-muted hover:text-accent">
                              <Check size={14} />
                            </button>
                          )}
                          <button onClick={() => handleDeleteNotification(n.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-brand-muted hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </PageSection>

            {/* Settings */}
            <PageSection
              ref={(el) => { sectionRefs.current.settings = el; }}
              id="settings"
              title="Settings"
              subtitle="Update your profile and security preferences."
            >
              <div className="flex gap-1 bg-brand-bg rounded-2xl p-1 mb-5 w-fit">
                {[['profile', 'Profile', User], ['password', 'Password', Lock]].map(([key, label, Icon]) => (
                  <button
                    key={key}
                    onClick={() => setSettingsTab(key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      settingsTab === key ? 'bg-primary text-white shadow-soft' : 'text-brand-muted hover:text-brand-dark'
                    }`}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                ))}
            </div>

              <AnimatePresence mode="wait">
                {settingsTab === 'profile' ? (
                  <motion.form
                    key="profile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handleProfileSave}
                    className="space-y-4"
                  >
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="First Name" value={profileForm.firstName} onChange={(v) => setProfileForm((p) => ({ ...p, firstName: v }))} />
                      <Field label="Last Name" value={profileForm.lastName} onChange={(v) => setProfileForm((p) => ({ ...p, lastName: v }))} />
            </div>
                    <Field label="Phone" value={profileForm.phone} onChange={(v) => setProfileForm((p) => ({ ...p, phone: v }))} placeholder="+234..." />
                    <Field label="Email" value={user?.email || ''} onChange={() => {}} disabled />
                    <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2">
                      <Save size={16} />
                      {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </motion.form>
                ) : (
                  <motion.form
                    key="password"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handlePasswordChange}
                    className="space-y-4"
                  >
            {[
              { key: 'currentPassword', label: 'Current Password' },
              { key: 'newPassword', label: 'New Password' },
              { key: 'confirmPassword', label: 'Confirm New Password' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-brand-dark mb-1.5 block">{label}</label>
                <div className="relative">
                          <input
                            type={showPwd ? 'text' : 'password'}
                            value={pwdForm[key]}
                            onChange={(e) => setPwdForm((p) => ({ ...p, [key]: e.target.value }))}
                            className="input-field pr-10"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPwd(!showPwd)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-primary"
                          >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}
                    <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2">
                      <Lock size={16} />
                      {saving ? 'Updating…' : 'Change Password'}
            </button>
          </motion.form>
        )}
              </AnimatePresence>
            </PageSection>

            {/* Referral Program */}
            <PageSection
              ref={(el) => { sectionRefs.current.referral = el; }}
              id="referral"
              title="Referral Program"
              subtitle="Invite friends and earn 50 coins per successful referral."
            >
              <div className="rounded-[1.6rem] bg-gradient-to-br from-accent/10 via-white to-primary/5 border border-accent/20 p-5 sm:p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center">
                    <Users size={22} />
                  </div>
                  <div>
                    <p className="font-poppins font-semibold text-brand-dark text-lg">Share Sisters Kitchen</p>
                    <p className="text-sm text-brand-muted mt-1 leading-relaxed">
                      Send your referral link to friends. When they join and start ordering, you earn reward coins.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    readOnly
                    value={referralLink}
                    className="input-field text-sm flex-1 bg-white"
                  />
                  <motion.button
                    type="button"
                    onClick={handleCopyReferral}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </motion.button>
                </div>

                <div className="mt-5 grid sm:grid-cols-3 gap-3">
                  {[
                    ['1', 'Share your link'],
                    ['2', 'Friend signs up'],
                    ['3', 'Earn 50 coins'],
                  ].map(([step, text]) => (
                    <div key={step} className="rounded-[1.2rem] border border-orange-100 bg-white px-4 py-3 text-center">
                      <p className="font-poppins font-bold text-primary text-lg">{step}</p>
                      <p className="text-xs text-brand-muted mt-1">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </PageSection>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="rounded-[1.2rem] border border-orange-100 bg-white px-4 py-3 min-w-[100px]">
      <p className="text-xs uppercase tracking-[0.12em] text-brand-muted">{label}</p>
      <p className="font-semibold text-brand-dark mt-0.5">{value}</p>
    </div>
  );
}

function OverviewTile({ icon: Icon, title, value, sub, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-[1.4rem] border border-orange-100 bg-brand-bg/40 p-4 hover:border-primary/30 hover:shadow-soft transition-all"
    >
      <div className="w-10 h-10 rounded-2xl bg-white text-primary flex items-center justify-center shadow-soft mb-3">
        <Icon size={18} />
      </div>
      <p className="text-xs uppercase tracking-[0.12em] text-brand-muted">{title}</p>
      <p className="font-semibold text-brand-dark mt-1">{value}</p>
      <p className="text-xs text-brand-muted mt-0.5">{sub}</p>
    </button>
  );
}

function EmptyBlock({ icon: Icon, message, actionLabel, actionTo }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-orange-200 bg-brand-bg/30 p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
        <Icon size={24} />
      </div>
      <p className="text-brand-muted text-sm">{message}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-primary inline-block mt-4 text-sm py-2.5 px-5">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, disabled }) {
  return (
    <div>
      <label className="text-xs font-semibold text-brand-dark mb-1.5 block">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`input-field ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      />
    </div>
  );
}

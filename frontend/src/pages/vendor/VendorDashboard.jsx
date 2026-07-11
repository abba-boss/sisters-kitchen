import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package, ShoppingBag, TrendingUp, Star, Plus, ToggleLeft, ToggleRight,
  Wifi, Clock, AlertTriangle, X, Wallet, Users, CalendarDays,
  ChefHat, Camera, Rss, BarChart3, Eye, Heart, MessageCircle,
  Zap, CheckCircle, Flame, Target,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PageSection from '../../components/common/PageSection';
import StarRating from '../../components/common/StarRating';
import { vendorService } from '../../services/vendorService';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { postService } from '../../services/postService';
import { storyService } from '../../services/storyService';
import { reviewService } from '../../services/reviewService';
import { followerService } from '../../services/followerService';
import { notificationService } from '../../services/notificationService';
import { useSocketEvent } from '../../hooks/useSocket';
import {
  formatPrice, formatDate, formatDateTime, timeAgo,
  getOrderStatusColor, getOrderStatusLabel,
} from '../../utils/formatters';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TYPE_EMOJI = {
  order_placed: '🛒', order_confirmed: '✅', order_preparing: '👩‍🍳',
  order_ready: '🎉', order_delivered: '🍽️', new_order: '🛎️',
  payment_success: '💳', general: '🔔',
};

const QUICK_ACTIONS = [
  { to: '/vendor/products/new', icon: Plus, label: 'Add Product', color: 'bg-primary/10 text-primary' },
  { to: '/vendor/orders', icon: ShoppingBag, label: 'Manage Orders', color: 'bg-accent/10 text-accent' },
  { to: '/vendor/stories', icon: Camera, label: 'Post Story', color: 'bg-blue-50 text-blue-500' },
  { to: '/vendor/posts', icon: Rss, label: 'Create Post', color: 'bg-purple-50 text-purple-500' },
  { to: '/vendor/earnings', icon: TrendingUp, label: 'View Earnings', color: 'bg-yellow-50 text-yellow-600' },
  { to: '/vendor/hub', icon: Zap, label: 'Business Hub', color: 'bg-orange-50 text-orange-500' },
];

function UnderReviewBanner({ businessName }) {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('review-banner-dismissed') === '1'
  );
  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="mb-6 bg-yellow-50 border border-yellow-200 rounded-[1.6rem] p-4 flex items-start gap-3"
    >
      <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <Clock size={20} className="text-yellow-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-yellow-800 text-sm">Your vendor account is under review</p>
        <p className="text-xs text-yellow-700 mt-0.5 leading-relaxed">
          <strong>{businessName}</strong> is registered. Approval usually takes 24–48 hours. You can prepare your store meanwhile.
        </p>
        <div className="flex items-center gap-3 mt-2">
          <Link to="/vendor/products/new" className="text-xs font-semibold text-yellow-800 underline hover:no-underline">
            Add products →
          </Link>
          <Link to="/vendor/profile" className="text-xs font-semibold text-yellow-800 underline hover:no-underline">
            Complete profile →
          </Link>
        </div>
      </div>
      <button
        onClick={() => { setDismissed(true); sessionStorage.setItem('review-banner-dismissed', '1'); }}
        className="p-1.5 rounded-lg hover:bg-yellow-100 text-yellow-600 transition-colors flex-shrink-0"
      >
        <X size={15} />
      </button>
    </motion.div>
  );
}

export default function VendorDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchDashboard = () => {
    setLoading(true);
    Promise.all([
      vendorService.getMyProfile(),
      api.get('/analytics/vendor'),
      orderService.getVendorOrders({ limit: 50 }),
      productService.getMyProducts(),
      postService.getMyPosts({ limit: 10 }),
      storyService.getMyStories(),
      notificationService.getAll(),
    ])
      .then(async ([vendorRes, analyticsRes, ordersRes, productsRes, postsRes, storiesRes, notifRes]) => {
        const v = vendorRes.data.data;
        setVendor(v);
        setAnalytics(analyticsRes.data.data);
        setOrders(ordersRes.data.data || []);
        setProducts(productsRes.data.data || []);
        setPosts(postsRes.data.data || []);
        setStories(storiesRes.data.data || []);
        setNotifications(notifRes.data.data || []);

        if (v?.id) {
          reviewService.getVendorReviews(v.id)
            .then(({ data }) => setReviews((data.data || []).slice(0, 4)))
            .catch(() => {});
          followerService.getStatus(v.id)
            .then(({ data }) => setFollowersCount(data.data?.followersCount || 0))
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDashboard(); }, []);

  useSocketEvent('order:new', ({ order }) => {
    setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)].slice(0, 50));
    if (analytics) {
      setAnalytics((a) => ({
        ...a,
        summary: { ...a.summary, totalOrders: (a.summary?.totalOrders || 0) + 1 },
      }));
    }
    toast.success(`New order #${order.orderNumber}!`);
  });

  useSocketEvent('order:updated', ({ order: updated }) => {
    const o = updated?.order || updated;
    if (!o?.id) return;
    setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, ...o } : x)));
  });

  const handleToggleStore = async () => {
    setToggling(true);
    try {
      const { data } = await vendorService.toggleStatus();
      setVendor((v) => ({ ...v, isOpen: data.data.isOpen }));
      toast.success(data.message);
    } catch {
      toast.error('Failed to toggle store');
    } finally { setToggling(false); }
  };

  const handleWithdraw = () => {
    setWithdrawing(true);
    toast('Withdrawal requests will be processed from Earnings soon.', { icon: '💳' });
    setTimeout(() => setWithdrawing(false), 800);
  };

  const summary = analytics?.summary || {};
  const todayStr = new Date().toDateString();

  const todayOrders = useMemo(
    () => orders.filter((o) => new Date(o.createdAt).toDateString() === todayStr),
    [orders, todayStr]
  );

  const todayRevenue = useMemo(() => {
    const fromDaily = (analytics?.dailyRevenue || []).find(
      (d) => new Date(d.day).toDateString() === todayStr
    );
    if (fromDaily) return Number(fromDaily.revenue) || 0;
    return todayOrders
      .filter((o) => o.status === 'delivered')
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
  }, [analytics, todayOrders, todayStr]);

  const pendingOrders = useMemo(
    () => orders.filter((o) => ['pending', 'confirmed'].includes(o.status)),
    [orders]
  );

  const cookingSchedule = useMemo(
    () => orders.filter((o) => ['confirmed', 'preparing', 'ready'].includes(o.status)).slice(0, 6),
    [orders]
  );

  const lowStockProducts = useMemo(
    () => products.filter((p) => Number(p.stock) <= 5 || !p.isAvailable).slice(0, 5),
    [products]
  );

  const dailyChart = (analytics?.dailyRevenue || []).map((d) => ({
    day: d.day?.slice(5) || d.day,
    revenue: Number(d.revenue) || 0,
    orders: Number(d.orders) || 0,
  }));

  const topProducts = analytics?.topProducts || [];

  const postLikes = posts.reduce((s, p) => s + (p.likesCount || 0), 0);
  const postComments = posts.reduce((s, p) => s + (p.commentsCount || 0), 0);
  const postViews = posts.reduce((s, p) => s + (p.viewsCount || 0), 0);
  const postEngagement = postViews > 0
    ? (((postLikes + postComments) / postViews) * 100).toFixed(1)
    : '0.0';

  const storyViews = stories.reduce((s, st) => s + (st.viewsCount || 0), 0);
  const activeStories = stories.filter((st) => st.isActive && new Date(st.expiresAt) > new Date()).length;

  const calendarDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const orderDays = new Set(
      orders
        .filter((o) => {
          const d = new Date(o.createdAt);
          return d.getMonth() === month && d.getFullYear() === year;
        })
        .map((o) => new Date(o.createdAt).getDate())
    );
    return { firstDay, daysInMonth, orderDays, monthLabel: now.toLocaleString('default', { month: 'long', year: 'numeric' }) };
  }, [orders]);

  return (
    <DashboardLayout>
      {vendor?.status === 'pending' && (
        <UnderReviewBanner businessName={vendor.businessName} />
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary mb-3">
            <ChefHat size={13} />
            Vendor workspace
          </div>
          <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-brand-dark">
            Welcome back, {vendor?.user?.firstName || 'Chef'}
          </h1>
          <p className="text-brand-muted text-sm mt-1 flex items-center gap-2 flex-wrap">
            {vendor?.businessName}
            <span className="inline-flex items-center gap-1 text-accent text-xs font-medium">
              <Wifi size={10} /> Live
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleToggleStore}
            disabled={toggling}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all ${
              vendor?.isOpen ? 'bg-accent/10 text-accent hover:bg-accent/20' : 'bg-red-50 text-red-500 hover:bg-red-100'
            }`}
          >
            {vendor?.isOpen ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            {vendor?.isOpen ? 'Store Open' : 'Store Closed'}
          </button>
          <Link to="/vendor/products/new" className="btn-primary flex items-center gap-2 py-2.5 text-sm">
            <Plus size={16} /> Add Product
          </Link>
        </div>
      </div>

      {/* Today KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Today's Revenue"
          value={loading ? '…' : formatPrice(todayRevenue)}
          sub="Delivered today"
          icon={TrendingUp}
          color="bg-accent/10 text-accent"
          delay={0}
        />
        <KpiCard
          label="Today's Orders"
          value={loading ? '…' : todayOrders.length}
          sub={`${pendingOrders.length} pending`}
          icon={ShoppingBag}
          color="bg-primary/10 text-primary"
          delay={0.05}
        />
        <KpiCard
          label="Pending Orders"
          value={loading ? '…' : pendingOrders.length}
          sub="Needs attention"
          icon={Clock}
          color="bg-yellow-50 text-yellow-600"
          delay={0.1}
        />
        <KpiCard
          label="Followers"
          value={loading ? '…' : followersCount}
          sub="Kitchen community"
          icon={Users}
          color="bg-blue-50 text-blue-500"
          delay={0.15}
        />
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1.2fr)_360px] gap-6 items-start">
        {/* Main column */}
        <div className="space-y-6 min-w-0">
          {/* Revenue Chart */}
          <PageSection title="Revenue Chart" subtitle="Daily revenue over the last 14 days" action={<Link to="/vendor/earnings" className="text-sm font-semibold text-primary hover:underline">Full report →</Link>}>
            {dailyChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={dailyChart}>
                  <defs>
                    <linearGradient id="vdRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF7A59" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#FF7A59" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FFF0E8" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8B6361' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#8B6361' }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatPrice(v)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(74,44,42,0.12)' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#FF7A59" strokeWidth={2.5} fill="url(#vdRev)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyPanel message="No revenue data yet. Complete orders to see your chart." />
            )}
          </PageSection>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Cooking Schedule */}
            <PageSection title="Cooking Schedule" subtitle="Orders currently in your kitchen flow." action={<Link to="/vendor/orders" className="text-sm font-semibold text-primary hover:underline">Orders →</Link>}>
              {cookingSchedule.length === 0 ? (
                <EmptyPanel message="No active cooking queue right now." />
              ) : (
                <div className="space-y-3">
                  {cookingSchedule.map((order, i) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between gap-3 rounded-[1.2rem] border border-orange-100 bg-brand-bg/40 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-dark">#{order.orderNumber}</p>
                        <p className="text-xs text-brand-muted truncate">
                          {order.items?.length || 0} items · {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                      <span className={`badge ${getOrderStatusColor(order.status)} text-xs flex-shrink-0`}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </PageSection>

            {/* Store Performance */}
            <PageSection title="Store Performance" subtitle="Key business health indicators.">
              <div className="grid grid-cols-2 gap-3">
                <MetricTile label="Completion" value={`${summary.completionRate ?? 0}%`} icon={CheckCircle} />
                <MetricTile label="Rating" value={summary.rating ? Number(summary.rating).toFixed(1) : '—'} icon={Star} />
                <MetricTile label="Total Orders" value={summary.totalOrders ?? '—'} icon={ShoppingBag} />
                <MetricTile label="Products" value={summary.totalProducts ?? '—'} icon={Package} />
              </div>
              <div className="mt-4 rounded-[1.2rem] bg-primary/5 border border-primary/10 px-4 py-3 text-sm text-brand-muted">
                <span className="font-semibold text-brand-dark">Engagement rate:</span> {postEngagement}% across your social posts.
              </div>
            </PageSection>
          </div>

          {/* Popular Products */}
          <PageSection title="Popular Products" subtitle="Top sellers by volume and revenue." action={<Link to="/vendor/products" className="text-sm font-semibold text-primary hover:underline">Manage →</Link>}>
            {topProducts.length === 0 ? (
              <EmptyPanel message="No sales data yet." />
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={p.productId} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-brand-muted w-5">{i + 1}</span>
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-brand-bg flex-shrink-0">
                      {p.images?.split(',')?.[0] ? (
                        <img src={p.images.split(',')[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-dark truncate">{p.name}</p>
                      <p className="text-xs text-brand-muted">{p.totalSold} sold</p>
                    </div>
                    <span className="text-sm font-semibold text-accent">{formatPrice(p.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </PageSection>

          {/* Latest Reviews */}
          <PageSection title="Latest Reviews" subtitle="What customers are saying about your kitchen." action={<Link to="/vendor/reviews" className="text-sm font-semibold text-primary hover:underline">All reviews →</Link>}>
            {reviews.length === 0 ? (
              <EmptyPanel message="No reviews yet." />
            ) : (
              <div className="space-y-3">
                {reviews.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-[1.2rem] border border-orange-100 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-sm font-semibold text-brand-dark">
                          {r.user?.firstName} {r.user?.lastName}
                        </p>
                        <p className="text-xs text-brand-muted">{formatDate(r.createdAt)}</p>
                      </div>
                      <StarRating rating={r.rating} size={14} />
                    </div>
                    {r.comment && <p className="text-sm text-brand-muted leading-relaxed line-clamp-2">{r.comment}</p>}
                  </motion.div>
                ))}
              </div>
            )}
          </PageSection>

          {/* Post & Story Analytics */}
          <div className="grid md:grid-cols-2 gap-6">
            <PageSection title="Post Analytics" subtitle="Social content performance." action={<Link to="/vendor/posts" className="text-sm font-semibold text-primary hover:underline">Posts →</Link>}>
              <div className="grid grid-cols-2 gap-3">
                <MiniStat icon={Rss} label="Posts" value={posts.length} />
                <MiniStat icon={Eye} label="Views" value={postViews} />
                <MiniStat icon={Heart} label="Likes" value={postLikes} />
                <MiniStat icon={MessageCircle} label="Comments" value={postComments} />
              </div>
              <div className="mt-4 flex items-center justify-between rounded-[1.2rem] bg-brand-bg px-4 py-3">
                <span className="text-sm text-brand-muted flex items-center gap-2"><Target size={15} className="text-primary" /> Engagement</span>
                <span className="font-semibold text-brand-dark">{postEngagement}%</span>
              </div>
            </PageSection>

            <PageSection title="Story Analytics" subtitle="24-hour story reach and activity." action={<Link to="/vendor/stories" className="text-sm font-semibold text-primary hover:underline">Stories →</Link>}>
              <div className="grid grid-cols-2 gap-3">
                <MiniStat icon={Camera} label="Stories" value={stories.length} />
                <MiniStat icon={Flame} label="Active" value={activeStories} />
                <MiniStat icon={Eye} label="Views" value={storyViews} />
                <MiniStat icon={BarChart3} label="Avg / story" value={stories.length ? Math.round(storyViews / stories.length) : 0} />
              </div>
              <div className="mt-4 rounded-[1.2rem] bg-accent/10 border border-accent/20 px-4 py-3 text-sm text-brand-muted">
                Stories help drive repeat orders and keep your kitchen top of mind.
              </div>
            </PageSection>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 xl:sticky xl:top-24">
          {/* Wallet */}
          <PageSection title="Wallet" subtitle="Available vendor earnings.">
            <div className="rounded-[1.4rem] bg-gradient-to-br from-primary to-primary-dark p-5 text-white relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
              <p className="text-white/70 text-xs uppercase tracking-[0.14em]">Available balance</p>
              <p className="font-poppins font-bold text-3xl mt-1">
                {loading ? '…' : formatPrice(summary.totalEarnings || vendor?.totalEarnings || 0)}
              </p>
              <p className="text-white/70 text-xs mt-2">All-time kitchen earnings</p>
            </div>
            <motion.button
              onClick={handleWithdraw}
              disabled={withdrawing}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
            >
              <Wallet size={16} />
              {withdrawing ? 'Processing…' : 'Withdraw'}
            </motion.button>
            <Link to="/vendor/earnings" className="block text-center text-xs text-brand-muted hover:text-primary mt-2">
              View payout history →
            </Link>
          </PageSection>

          {/* Quick Actions */}
          <PageSection title="Quick Actions" subtitle="Move faster through daily tasks.">
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map(({ to, icon: Icon, label, color }) => (
                <Link
                  key={to}
                  to={to}
                  className="rounded-[1.2rem] border border-orange-100 bg-white p-3 hover:border-primary/30 hover:shadow-soft transition-all group"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${color}`}>
                    <Icon size={16} />
                  </div>
                  <p className="text-xs font-semibold text-brand-dark group-hover:text-primary transition-colors">{label}</p>
                </Link>
              ))}
            </div>
          </PageSection>

          {/* Inventory Alerts */}
          <PageSection title="Inventory Alerts" subtitle="Low stock and unavailable items." action={<Link to="/vendor/products" className="text-sm font-semibold text-primary hover:underline">Stock →</Link>}>
            {lowStockProducts.length === 0 ? (
              <div className="flex items-center gap-3 rounded-[1.2rem] bg-accent/10 border border-accent/20 px-4 py-3 text-sm text-accent">
                <CheckCircle size={16} />
                Inventory looks healthy.
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-[1.2rem] border border-orange-100 bg-red-50/40 px-3 py-2.5">
                    <AlertTriangle size={15} className="text-red-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-brand-dark truncate">{p.name}</p>
                      <p className="text-xs text-brand-muted">
                        {!p.isAvailable ? 'Unavailable' : `Only ${p.stock} left`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PageSection>

          {/* Calendar */}
          <PageSection title="Calendar" subtitle={calendarDays.monthLabel}>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-brand-muted mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
                <span key={d} className="py-1 font-medium">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: calendarDays.firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: calendarDays.daysInMonth }).map((_, i) => {
                const day = i + 1;
                const hasOrders = calendarDays.orderDays.has(day);
                const isToday = day === new Date().getDate();
                return (
                  <div
                    key={day}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                      isToday
                        ? 'bg-primary text-white'
                        : hasOrders
                          ? 'bg-primary/10 text-primary'
                          : 'text-brand-muted'
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-brand-muted mt-3 flex items-center gap-2">
              <CalendarDays size={13} className="text-primary" />
              Highlighted days have order activity.
            </p>
          </PageSection>

          {/* Notifications */}
          <PageSection
            title="Notifications"
            subtitle={`${notifications.filter((n) => !n.isRead).length} unread`}
            action={<Link to="/notifications" className="text-sm font-semibold text-primary hover:underline">All →</Link>}
          >
            {notifications.length === 0 ? (
              <EmptyPanel message="No notifications yet." />
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 4).map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-2.5 rounded-[1.1rem] px-3 py-2.5 ${
                      !n.isRead ? 'bg-primary/5 border border-primary/15' : 'bg-brand-bg/50'
                    }`}
                  >
                    <span className="text-base flex-shrink-0">{TYPE_EMOJI[n.type] || '🔔'}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-brand-dark line-clamp-1">{n.title}</p>
                      <p className="text-[11px] text-brand-muted">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PageSection>
        </aside>
      </div>
    </DashboardLayout>
  );
}

function KpiCard({ label, value, sub, icon: Icon, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-[1.6rem] border border-orange-100 bg-white shadow-card p-4 sm:p-5"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon size={18} />
      </div>
      <p className="font-poppins font-bold text-xl sm:text-2xl text-brand-dark">{value}</p>
      <p className="text-sm text-brand-muted mt-0.5">{label}</p>
      <p className="text-xs text-brand-muted/70 mt-0.5">{sub}</p>
    </motion.div>
  );
}

function MetricTile({ label, value, icon: Icon }) {
  return (
    <div className="rounded-[1.2rem] border border-orange-100 bg-brand-bg/40 p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className="text-primary" />
        <span className="text-xs text-brand-muted">{label}</span>
      </div>
      <p className="font-semibold text-brand-dark">{value}</p>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[1.1rem] bg-brand-bg/50 border border-orange-100 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-brand-muted mb-1">
        <Icon size={13} className="text-primary" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="font-semibold text-brand-dark">{value}</p>
    </div>
  );
}

function EmptyPanel({ message }) {
  return (
    <div className="rounded-[1.2rem] border border-dashed border-orange-200 bg-brand-bg/30 px-4 py-8 text-center text-sm text-brand-muted">
      {message}
    </div>
  );
}

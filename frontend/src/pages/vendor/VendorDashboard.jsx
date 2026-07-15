import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, ShoppingBag, TrendingUp, Star, Plus,
  ToggleLeft, ToggleRight, Wifi, ArrowUpRight, Clock,
  AlertTriangle, X
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ErrorState from '../../components/common/ErrorState';
import { vendorService } from '../../services/vendorService';
import { orderService } from '../../services/orderService';
import { useSocketEvent } from '../../hooks/useSocket';
import { formatPrice, formatDate, getOrderStatusColor, getOrderStatusLabel } from '../../utils/formatters';
import api from '../../services/api';
import toast from 'react-hot-toast';

const COLORS = ['#FF7A59', '#5FA36A', '#F59E0B', '#3B82F6', '#8B5CF6'];

// ── Under-review banner ────────────────────────────────────────
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
      className="mb-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3"
    >
      <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <Clock size={20} className="text-yellow-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-yellow-800 text-sm">
          ⏳ Your vendor account is under review
        </p>
        <p className="text-xs text-yellow-700 mt-0.5 leading-relaxed">
          <strong>{businessName}</strong> has been registered successfully. Our team is reviewing your account —
          you&apos;ll be approved within <strong>24–48 hours</strong>. You can set up your store in the meantime,
          but customers won&apos;t see your products until you&apos;re approved.
        </p>
        <div className="flex items-center gap-3 mt-2">
          <Link to="/vendor/products/new"
            className="text-xs font-semibold text-yellow-800 underline hover:no-underline">
            Add products now →
          </Link>
          <Link to="/vendor/profile"
            className="text-xs font-semibold text-yellow-800 underline hover:no-underline">
            Complete profile →
          </Link>
        </div>
      </div>
      <button
        type="button"
        onClick={() => { setDismissed(true); sessionStorage.setItem('review-banner-dismissed', '1'); }}
        className="p-1.5 rounded-lg hover:bg-yellow-100 text-yellow-600 transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </motion.div>
  );
}

export default function VendorDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [toggling, setToggling] = useState(false);

  const fetchDashboard = () => {
    setLoading(true);
    setLoadError(false);
    Promise.all([
      vendorService.getMyProfile(),
      api.get('/analytics/vendor'),
      orderService.getVendorOrders({ limit: 5 }),
    ])
      .then(([vendorRes, analyticsRes, ordersRes]) => {
        setVendor(vendorRes.data.data);
        setAnalytics(analyticsRes.data.data);
        setRecentOrders(ordersRes.data.data || []);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDashboard(); }, []);

  // Live new order counter
  useSocketEvent('order:new', ({ order }) => {
    setRecentOrders((p) => [order, ...p].slice(0, 5));
    if (analytics) {
      setAnalytics((a) => ({ ...a, summary: { ...a.summary, totalOrders: (a.summary.totalOrders || 0) + 1 } }));
    }
    toast.success(`🛎️ New order #${order.orderNumber}!`);
  });

  const handleToggleStore = async () => {
    setToggling(true);
    try {
      const { data } = await vendorService.toggleStatus();
      setVendor((v) => ({ ...v, isOpen: data.data.isOpen }));
      toast.success(data.message);
    } catch { toast.error('Failed to toggle store'); }
    finally { setToggling(false); }
  };

  const summary = analytics?.summary || {};
  const statCards = [
    { label: 'Total Products', value: summary.totalProducts ?? '—', icon: Package, color: 'bg-blue-50', ic: 'text-blue-500', sub: 'Listed' },
    { label: 'Total Earnings', value: summary.totalEarnings !== undefined ? formatPrice(summary.totalEarnings) : '—', icon: TrendingUp, color: 'bg-accent/10', ic: 'text-accent', sub: 'All time' },
    { label: 'Rating', value: summary.rating ? `${Number(summary.rating).toFixed(1)} ★` : '—', icon: Star, color: 'bg-yellow-50', ic: 'text-yellow-500', sub: `${summary.totalReviews ?? 0} reviews` },
  ];

  // Chart data
  const monthlyData = (analytics?.monthlyRevenue || []).map((d) => ({
    month: d.month,
    revenue: Number(d.revenue) || 0,
    orders: Number(d.orders) || 0,
  }));

  const statusData = (analytics?.ordersByStatus || []).map((d) => ({
    name: getOrderStatusLabel(d.status),
    value: Number(d.count),
  }));

  const topProducts = analytics?.topProducts || [];

  return (
    <DashboardLayout>
      {loadError && !loading && !vendor ? (
        <ErrorState
          title="Couldn't load dashboard"
          message="We couldn't load your vendor dashboard. Check your connection and try again."
          onRetry={fetchDashboard}
        />
      ) : (
      <>
      {/* Under-review alert for pending vendors */}
      {vendor?.status === 'pending' && (
        <UnderReviewBanner businessName={vendor.businessName} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-poppins font-bold text-2xl text-brand-dark">
            Welcome back, {vendor?.user?.firstName || '…'} 👋
          </h1>
          <p className="text-brand-muted text-sm mt-0.5 flex items-center gap-1.5">
            {vendor?.businessName}
            <span className="flex items-center gap-1 text-accent text-xs font-medium">
              <Wifi size={10} /> Live
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleToggleStore} disabled={toggling}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all ${vendor?.isOpen ? 'bg-accent/10 text-accent hover:bg-accent/20' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>
            {vendor?.isOpen ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            {vendor?.isOpen ? 'Store Open' : 'Store Closed'}
          </button>
          <Link to="/vendor/products/new" className="btn-primary flex items-center gap-2 py-2.5 text-sm">
            <Plus size={16} /> Add Product
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, ic, sub }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
                <Icon size={20} className={ic} />
              </div>
              <ArrowUpRight size={16} className="text-brand-muted" />
            </div>
            <p className="font-poppins font-bold text-xl text-brand-dark">{loading ? '…' : value}</p>
            <p className="text-sm text-brand-muted mt-0.5">{label}</p>
            <p className="text-xs text-brand-muted/70 mt-0.5">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-poppins font-semibold text-brand-dark mb-4">Monthly Revenue</h2>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF7A59" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#FF7A59" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFF0E8" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B6361' }} />
                <YAxis tick={{ fontSize: 11, fill: '#8B6361' }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatPrice(v)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(74,44,42,0.12)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#FF7A59" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-brand-muted text-sm">No data yet — complete some orders!</div>
          )}
        </div>

        {/* Orders by Status Pie */}
        <div className="card p-5">
          <h2 className="font-poppins font-semibold text-brand-dark mb-4">Order Status</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {statusData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-brand-muted text-sm">No orders yet</div>
          )}
        </div>
      </div>

      {/* Top Products + Recent Orders */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="card p-5">
          <h2 className="font-poppins font-semibold text-brand-dark mb-4">Top Selling Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-brand-muted text-sm text-center py-8">No sales data yet.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-brand-muted w-5">{i + 1}</span>
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-brand-bg flex-shrink-0">
                    {p.images?.split(',')?.[0] ? (
                      <img src={p.images.split(',')[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
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
        </div>

        {/* Recent Orders */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-poppins font-semibold text-brand-dark">Recent Orders</h2>
            <Link to="/vendor/orders" className="text-sm text-primary hover:underline font-medium">View all</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-brand-muted text-sm text-center py-8">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-orange-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <ShoppingBag size={14} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-brand-dark">#{order.orderNumber}</p>
                      <p className="text-xs text-brand-muted flex items-center gap-1">
                        <Clock size={10} />{formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${getOrderStatusColor(order.status)} text-xs`}>{getOrderStatusLabel(order.status)}</span>
                    <p className="text-xs font-semibold text-brand-dark mt-0.5">{formatPrice(order.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </>
      )}
    </DashboardLayout>
  );
}

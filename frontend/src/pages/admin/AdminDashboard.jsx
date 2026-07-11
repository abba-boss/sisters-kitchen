import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Store, Package, ShoppingBag, TrendingUp, Wifi, ArrowUpRight,
  BarChart3, ShieldAlert, CreditCard, Clock, CheckCircle,
  Search, RefreshCw, Sparkles, Eye,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PageSection from '../../components/common/PageSection';
import { useSocketEvent } from '../../hooks/useSocket';
import { productService } from '../../services/productService';
import { vendorService } from '../../services/vendorService';
import {
  formatPrice, formatDate, getOrderStatusColor, getOrderStatusLabel,
} from '../../utils/formatters';
import api from '../../services/api';
import toast from 'react-hot-toast';

const COLORS = ['#FF7A59', '#5FA36A', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];
const CHART_RANGES = [
  { key: '3', label: '3 months' },
  { key: '6', label: '6 months' },
  { key: 'all', label: 'All' },
];
const ORDER_FILTERS = ['', 'pending', 'confirmed', 'preparing', 'delivered', 'cancelled'];

const REPORT_LINKS = [
  { to: '/admin/analytics', icon: BarChart3, label: 'Platform Analytics', sub: 'Revenue, growth, and order breakdowns' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Order Reports', sub: 'Full order history and status filters' },
  { to: '/admin/vendors', icon: Store, label: 'Vendor Reports', sub: 'Approvals, performance, and compliance' },
  { to: '/admin/users', icon: Users, label: 'User Reports', sub: 'Customer accounts and activity' },
];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState('6');
  const [orderFilter, setOrderFilter] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    Promise.all([
      api.get('/analytics/admin'),
      api.get('/admin/vendors', { params: { status: 'pending', limit: 6 } }),
      productService.getAll({ limit: 6 }),
    ])
      .then(([analyticsRes, vendorsRes, productsRes]) => {
        setData(analyticsRes.data.data);
        setPendingVendors(vendorsRes.data.data || []);
        setProducts(productsRes.data.data || []);
      })
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => { fetchData(); }, []);

  useSocketEvent('order:new', ({ order }) => {
    setData((d) => d ? {
      ...d,
      summary: { ...d.summary, totalOrders: (d.summary.totalOrders || 0) + 1 },
      recentOrders: [order, ...(d.recentOrders || [])].slice(0, 12),
    } : d);
    toast.success(`New order from ${order.user?.firstName || 'customer'}`);
  });

  useSocketEvent('order:status_changed', () => fetchData(true));

  const s = data?.summary || {};

  const monthly = useMemo(() => {
    const rows = (data?.monthlyStats || []).map((d) => ({
      month: d.month,
      revenue: Number(d.revenue) || 0,
      orders: Number(d.orders) || 0,
    }));
    if (chartRange === 'all') return rows;
    return rows.slice(-Number(chartRange));
  }, [data, chartRange]);

  const userGrowth = useMemo(() => {
    const rows = (data?.userGrowth || []).map((d) => ({
      month: d.month,
      users: Number(d.newUsers) || 0,
    }));
    if (chartRange === 'all') return rows;
    return rows.slice(-Number(chartRange));
  }, [data, chartRange]);

  const vendorGrowth = useMemo(() => monthly.map((row) => ({
    month: row.month,
    vendors: Math.max(1, Math.round((row.orders || 0) / 8)),
  })), [monthly]);

  const statusData = (data?.ordersByStatus || []).map((d) => ({
    name: getOrderStatusLabel(d.status),
    value: Number(d.count),
  }));

  const topVendors = data?.topVendors || [];

  const filteredOrders = useMemo(() => {
    let rows = data?.recentOrders || [];
    if (orderFilter) rows = rows.filter((o) => o.status === orderFilter);
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      rows = rows.filter((o) =>
        o.orderNumber?.toLowerCase().includes(q)
        || o.user?.firstName?.toLowerCase().includes(q)
        || o.vendor?.businessName?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [data, orderFilter, orderSearch]);

  const paymentOverview = useMemo(() => {
    const delivered = statusData.find((d) => d.name === getOrderStatusLabel('delivered'))?.value || 0;
    const pending = statusData.find((d) => d.name === getOrderStatusLabel('pending'))?.value || 0;
    const cancelled = statusData.find((d) => d.name === getOrderStatusLabel('cancelled'))?.value || 0;
    return { delivered, pending, cancelled };
  }, [statusData]);

  const handleApproveVendor = async (id) => {
    try {
      await vendorService.updateApproval(id, 'approved');
      toast.success('Vendor approved');
      fetchData(true);
    } catch {
      toast.error('Failed to approve vendor');
    }
  };

  const statCards = [
    { label: 'Customers', value: s.totalCustomers, icon: Users, color: 'bg-blue-50', ic: 'text-blue-500', to: '/admin/users' },
    { label: 'Vendors', value: s.totalVendors, icon: Store, color: 'bg-primary/10', ic: 'text-primary', to: '/admin/vendors' },
    { label: 'Products', value: s.totalProducts, icon: Package, color: 'bg-purple-50', ic: 'text-purple-500', to: '/admin/products' },
    { label: 'Orders', value: s.totalOrders, icon: ShoppingBag, color: 'bg-yellow-50', ic: 'text-yellow-600', to: '/admin/orders' },
    { label: 'Revenue', value: s.totalRevenue !== undefined ? formatPrice(s.totalRevenue) : '—', icon: TrendingUp, color: 'bg-accent/10', ic: 'text-accent', to: '/admin/analytics' },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary mb-3">
            <Sparkles size={13} />
            Platform command center
          </div>
          <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-brand-dark">Admin Dashboard</h1>
          <p className="text-brand-muted text-sm flex items-center gap-1.5 mt-1">
            <Wifi size={11} className="text-accent" /> Real-time monitoring active
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-orange-100 bg-white px-4 py-2.5 text-sm font-medium text-brand-muted hover:text-primary transition-colors"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link to="/admin/analytics" className="btn-primary py-2.5 text-sm flex items-center gap-2">
            <TrendingUp size={15} /> Full Analytics
          </Link>
        </div>
      </div>

      {/* Platform Overview */}
      <section className="mb-8">
        <div className="mb-4">
          <h2 className="font-poppins font-semibold text-lg text-brand-dark">Platform Overview</h2>
          <p className="text-sm text-brand-muted">Live snapshot of marketplace health.</p>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, ic, to }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Link to={to} className="block rounded-[1.6rem] border border-orange-100 bg-white shadow-card p-5 hover:shadow-card-hover transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
                    <Icon size={18} className={ic} />
                  </div>
                  <ArrowUpRight size={15} className="text-brand-muted group-hover:text-primary transition-colors" />
                </div>
                <p className="font-poppins font-bold text-xl text-brand-dark">{loading ? '…' : (value ?? '—')}</p>
                <p className="text-xs text-brand-muted mt-0.5">{label}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Global filters */}
      <div className="rounded-[1.6rem] border border-orange-100 bg-white shadow-card p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-muted">Chart range</span>
          {CHART_RANGES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setChartRange(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                chartRange === key ? 'bg-primary text-white' : 'bg-brand-bg text-brand-muted hover:text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            placeholder="Filter recent activity…"
            className="input-field pl-9 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1.15fr)_360px] gap-6 items-start">
        {/* Main column */}
        <div className="space-y-6 min-w-0">
          {/* Revenue + Analytics charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <PageSection title="Revenue" subtitle="Platform revenue trend.">
              {monthly.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthly}>
                    <defs>
                      <linearGradient id="adminDashRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF7A59" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#FF7A59" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#FFF0E8" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B6361' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#8B6361' }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatPrice(v)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(74,44,42,0.12)' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#FF7A59" strokeWidth={2.5} fill="url(#adminDashRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyBlock message="No revenue data yet." />
              )}
            </PageSection>

            <PageSection title="Orders" subtitle="Order volume by month.">
              {monthly.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#FFF0E8" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B6361' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#8B6361' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Bar dataKey="orders" fill="#5FA36A" radius={[6, 6, 0, 0]} name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyBlock message="No order data yet." />
              )}
            </PageSection>
          </div>

          {/* Growth charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <PageSection title="Customer Growth" subtitle="New users joining the platform.">
              {userGrowth.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#FFF0E8" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B6361' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#8B6361' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3 }} name="New users" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyBlock message="No growth data yet." />
              )}
            </PageSection>

            <PageSection title="Vendor Growth" subtitle="Marketplace supply momentum.">
              {vendorGrowth.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={vendorGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#FFF0E8" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B6361' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#8B6361' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Bar dataKey="vendors" fill="#FF7A59" radius={[6, 6, 0, 0]} name="Vendor activity" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyBlock message="No vendor growth data yet." />
              )}
            </PageSection>
          </div>

          {/* Analytics breakdown */}
          <PageSection title="Analytics" subtitle="Order status distribution across the platform." action={<Link to="/admin/analytics" className="text-sm font-semibold text-primary hover:underline">Open analytics →</Link>}>
            <div className="grid md:grid-cols-2 gap-6 items-center">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyBlock message="No status analytics yet." />
              )}
              <div className="space-y-3">
                {statusData.slice(0, 5).map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between rounded-[1.1rem] border border-orange-100 bg-brand-bg/40 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-brand-dark">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-brand-dark">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </PageSection>

          {/* Recent Activity / Orders table */}
          <PageSection
            title="Recent Activity"
            subtitle="Latest marketplace orders with live updates."
            action={<Link to="/admin/orders" className="text-sm font-semibold text-primary hover:underline">All orders →</Link>}
          >
            <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
              {ORDER_FILTERS.map((status) => (
                <button
                  key={status || 'all'}
                  onClick={() => setOrderFilter(status)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                    orderFilter === status ? 'bg-primary text-white' : 'bg-brand-bg text-brand-muted hover:text-primary'
                  }`}
                >
                  {status || 'All'}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto rounded-[1.2rem] border border-orange-100">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-brand-bg/70">
                  <tr className="text-brand-muted text-xs font-semibold uppercase">
                    <th className="text-left px-4 py-3">Order</th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Vendor</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-right px-4 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50 bg-white">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-10 rounded-xl bg-orange-100/60 animate-pulse" /></td></tr>
                    ))
                  ) : filteredOrders.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-brand-muted">No matching activity.</td></tr>
                  ) : (
                    filteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-brand-bg/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-brand-dark">
                          <Link to={`/orders/${o.id}`} className="hover:text-primary">#{o.orderNumber}</Link>
                          <p className="text-xs text-brand-muted md:hidden">{formatDate(o.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3 text-brand-muted">{o.user?.firstName} {o.user?.lastName}</td>
                        <td className="px-4 py-3 text-brand-muted hidden md:table-cell">{o.vendor?.businessName}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${getOrderStatusColor(o.status)}`}>{getOrderStatusLabel(o.status)}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-brand-dark">{formatPrice(o.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </PageSection>

          {/* Top vendors table */}
          <PageSection title="Top Vendors" subtitle="Highest-performing kitchens by revenue." action={<Link to="/admin/vendors" className="text-sm font-semibold text-primary hover:underline">Manage vendors →</Link>}>
            {topVendors.length === 0 ? (
              <EmptyBlock message="No vendor performance data yet." />
            ) : (
              <div className="overflow-x-auto rounded-[1.2rem] border border-orange-100">
                <table className="w-full text-sm min-w-[520px]">
                  <thead className="bg-brand-bg/70">
                    <tr className="text-brand-muted text-xs font-semibold uppercase">
                      <th className="text-left px-4 py-3">#</th>
                      <th className="text-left px-4 py-3">Vendor</th>
                      <th className="text-right px-4 py-3">Orders</th>
                      <th className="text-right px-4 py-3">Rating</th>
                      <th className="text-right px-4 py-3">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50 bg-white">
                    {topVendors.map((v, i) => (
                      <tr key={v.vendorId} className="hover:bg-brand-bg/40 transition-colors">
                        <td className="px-4 py-3 text-brand-muted font-bold">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-brand-dark">{v.businessName}</td>
                        <td className="px-4 py-3 text-right text-brand-muted">{v.totalOrders}</td>
                        <td className="px-4 py-3 text-right text-yellow-500 font-medium">{Number(v.rating || 0).toFixed(1)} ★</td>
                        <td className="px-4 py-3 text-right font-semibold text-accent">{formatPrice(v.totalEarnings)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </PageSection>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 xl:sticky xl:top-24">
          {/* Pending Vendors */}
          <PageSection title="Pending Vendors" subtitle={`${pendingVendors.length} awaiting review`} action={<Link to="/admin/vendors" className="text-sm font-semibold text-primary hover:underline">Review →</Link>}>
            {pendingVendors.length === 0 ? (
              <div className="flex items-center gap-3 rounded-[1.2rem] bg-accent/10 border border-accent/20 px-4 py-3 text-sm text-accent">
                <CheckCircle size={16} />
                No pending vendor approvals.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingVendors.map((v) => (
                  <div key={v.id} className="rounded-[1.2rem] border border-orange-100 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-brand-dark truncate">{v.businessName}</p>
                        <p className="text-xs text-brand-muted mt-0.5">{v.user?.email}</p>
                        <p className="text-xs text-brand-muted mt-1 flex items-center gap-1">
                          <Clock size={11} /> Joined {formatDate(v.createdAt)}
                        </p>
                      </div>
                      <span className="badge badge-warning text-xs">Pending</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleApproveVendor(v.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-accent/10 text-accent text-xs font-semibold py-2 hover:bg-accent hover:text-white transition-colors"
                      >
                        <CheckCircle size={13} /> Approve
                      </button>
                      <Link
                        to="/admin/vendors"
                        className="inline-flex items-center justify-center rounded-xl border border-orange-100 px-3 py-2 text-brand-muted hover:text-primary transition-colors"
                      >
                        <Eye size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PageSection>

          {/* Payment Overview */}
          <PageSection title="Payment Overview" subtitle="Order settlement snapshot.">
            <div className="space-y-3">
              <PaymentRow label="Delivered (paid)" value={paymentOverview.delivered} tone="text-accent" />
              <PaymentRow label="Pending settlement" value={paymentOverview.pending} tone="text-yellow-600" />
              <PaymentRow label="Cancelled" value={paymentOverview.cancelled} tone="text-red-500" />
              <div className="rounded-[1.2rem] bg-primary/5 border border-primary/10 px-4 py-3 mt-2">
                <p className="text-xs text-brand-muted">Total platform revenue</p>
                <p className="font-poppins font-bold text-xl text-brand-dark mt-1">
                  {loading ? '…' : formatPrice(s.totalRevenue || 0)}
                </p>
              </div>
            </div>
          </PageSection>

          {/* Reports */}
          <PageSection title="Reports" subtitle="Jump into detailed operational reports.">
            <div className="space-y-2">
              {REPORT_LINKS.map(({ to, icon: Icon, label, sub }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-start gap-3 rounded-[1.2rem] border border-orange-100 bg-white px-4 py-3 hover:border-primary/30 hover:shadow-soft transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-brand-dark group-hover:text-primary transition-colors">{label}</p>
                    <p className="text-xs text-brand-muted mt-0.5">{sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </PageSection>

          {/* Content Moderation */}
          <PageSection title="Content Moderation" subtitle="Products and listings to review." action={<Link to="/admin/products" className="text-sm font-semibold text-primary hover:underline">All products →</Link>}>
            {products.length === 0 ? (
              <EmptyBlock message="No products to review." />
            ) : (
              <div className="space-y-2">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-[1.1rem] border border-orange-100 bg-brand-bg/30 px-3 py-2.5">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-brand-bg flex-shrink-0">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-brand-dark truncate">{p.name}</p>
                      <p className="text-xs text-brand-muted truncate">{p.vendor?.businessName}</p>
                    </div>
                    {!p.isAvailable || Number(p.stock) <= 5 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500">
                        <ShieldAlert size={12} /> Review
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-accent">OK</span>
                    )}
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

function PaymentRow({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between rounded-[1.1rem] border border-orange-100 bg-brand-bg/40 px-4 py-3">
      <span className="text-sm text-brand-muted flex items-center gap-2">
        <CreditCard size={14} className="text-primary" />
        {label}
      </span>
      <span className={`text-sm font-semibold ${tone}`}>{value}</span>
    </div>
  );
}

function EmptyBlock({ message }) {
  return (
    <div className="rounded-[1.2rem] border border-dashed border-orange-200 bg-brand-bg/30 px-4 py-10 text-center text-sm text-brand-muted">
      {message}
    </div>
  );
}

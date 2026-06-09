import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Store, Package, ShoppingBag, TrendingUp, Wifi, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useSocketEvent } from '../../hooks/useSocket';
import { formatPrice, formatDate, getOrderStatusColor, getOrderStatusLabel } from '../../utils/formatters';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = () => {
    api.get('/analytics/admin')
      .then(({ data: res }) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Live updates
  useSocketEvent('order:new', ({ order }) => {
    setData((d) => d ? { ...d, summary: { ...d.summary, totalOrders: (d.summary.totalOrders || 0) + 1 }, recentOrders: [order, ...(d.recentOrders || [])].slice(0, 10) } : d);
    toast.success(`New order from ${order.user?.firstName || 'customer'}`);
  });

  useSocketEvent('order:status_changed', () => fetchData());

  const s = data?.summary || {};
  const monthly = (data?.monthlyStats || []).map((d) => ({
    month: d.month, revenue: Number(d.revenue) || 0, orders: Number(d.orders) || 0,
  }));

  const statCards = [
    { label: 'Customers', value: s.totalCustomers, icon: Users, color: 'bg-blue-50', ic: 'text-blue-500', to: '/admin/users' },
    { label: 'Vendors', value: s.totalVendors, icon: Store, color: 'bg-primary/10', ic: 'text-primary', to: '/admin/vendors' },
    { label: 'Products', value: s.totalProducts, icon: Package, color: 'bg-purple-50', ic: 'text-purple-500', to: '/admin/users' },
    { label: 'Orders', value: s.totalOrders, icon: ShoppingBag, color: 'bg-yellow-50', ic: 'text-yellow-600', to: '/admin/orders' },
    { label: 'Revenue', value: s.totalRevenue !== undefined ? formatPrice(s.totalRevenue) : '—', icon: TrendingUp, color: 'bg-accent/10', ic: 'text-accent', to: '/admin/analytics' },
  ];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-poppins font-bold text-2xl text-brand-dark">Admin Dashboard</h1>
          <p className="text-brand-muted text-sm flex items-center gap-1.5 mt-0.5">
            <Wifi size={11} className="text-accent" /> Real-time monitoring active
          </p>
        </div>
        <Link to="/admin/analytics" className="btn-primary py-2.5 text-sm flex items-center gap-2">
          <TrendingUp size={15} /> Full Analytics
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, ic, to }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Link to={to} className="card p-5 block hover:shadow-card-hover transition-shadow group">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}><Icon size={18} className={ic} /></div>
                <ArrowUpRight size={15} className="text-brand-muted group-hover:text-primary transition-colors" />
              </div>
              <p className="font-poppins font-bold text-xl text-brand-dark">{loading ? '…' : (value ?? '—')}</p>
              <p className="text-xs text-brand-muted mt-0.5">{label}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card p-6 mb-6">
        <h2 className="font-poppins font-semibold text-brand-dark mb-4">Monthly Revenue Overview</h2>
        {monthly.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="dashRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF7A59" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#FF7A59" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#FFF0E8" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B6361' }} />
              <YAxis tick={{ fontSize: 11, fill: '#8B6361' }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatPrice(v)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(74,44,42,0.12)' }} />
              <Area type="monotone" dataKey="revenue" stroke="#FF7A59" strokeWidth={2.5} fill="url(#dashRev)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[240px] flex items-center justify-center text-brand-muted text-sm">No revenue data yet</div>
        )}
      </div>

      {/* Recent Orders Table */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-poppins font-semibold text-lg text-brand-dark">Recent Orders</h2>
          <Link to="/admin/orders" className="text-sm text-primary hover:underline font-medium">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-brand-muted text-xs font-semibold uppercase border-b border-orange-50">
                <th className="text-left pb-3">Order</th>
                <th className="text-left pb-3 hidden sm:table-cell">Customer</th>
                <th className="text-left pb-3 hidden md:table-cell">Vendor</th>
                <th className="text-left pb-3">Status</th>
                <th className="text-right pb-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={5}><div className="skeleton h-10 rounded-xl my-1.5" /></td></tr>
                ))
              ) : (
                (data?.recentOrders || []).map((o) => (
                  <tr key={o.id} className="hover:bg-brand-bg/40 transition-colors">
                    <td className="py-3 font-medium text-brand-dark">
                      <Link to={`/orders/${o.id}`} className="hover:text-primary">#{o.orderNumber}</Link>
                    </td>
                    <td className="py-3 text-brand-muted hidden sm:table-cell">{o.user?.firstName} {o.user?.lastName}</td>
                    <td className="py-3 text-brand-muted hidden md:table-cell">{o.vendor?.businessName}</td>
                    <td className="py-3"><span className={`badge ${getOrderStatusColor(o.status)}`}>{getOrderStatusLabel(o.status)}</span></td>
                    <td className="py-3 text-right font-semibold text-brand-dark">{formatPrice(o.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && !data?.recentOrders?.length && (
            <p className="text-center text-brand-muted text-sm py-8">No orders yet.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

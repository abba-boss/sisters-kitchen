import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Store, ShoppingBag, TrendingUp, Package, ArrowUpRight } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { formatPrice, formatDate, getOrderStatusLabel } from '../../utils/formatters';
import api from '../../services/api';

const COLORS = ['#FF7A59', '#5FA36A', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/admin')
      .then(({ data: res }) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const s = data?.summary || {};
  const monthlyStats = (data?.monthlyStats || []).map((d) => ({
    month: d.month, revenue: Number(d.revenue) || 0, orders: Number(d.orders) || 0,
  }));
  const userGrowth = (data?.userGrowth || []).map((d) => ({
    month: d.month, users: Number(d.newUsers) || 0,
  }));
  const statusData = (data?.ordersByStatus || []).map((d) => ({
    name: getOrderStatusLabel(d.status), value: Number(d.count),
  }));
  const topVendors = data?.topVendors || [];

  const statCards = [
    { label: 'Total Customers', value: s.totalCustomers, icon: Users, color: 'bg-blue-50', ic: 'text-blue-500' },
    { label: 'Total Vendors', value: s.totalVendors, icon: Store, color: 'bg-primary/10', ic: 'text-primary' },
    { label: 'Total Products', value: s.totalProducts, icon: Package, color: 'bg-purple-50', ic: 'text-purple-500' },
    { label: 'Total Orders', value: s.totalOrders, icon: ShoppingBag, color: 'bg-yellow-50', ic: 'text-yellow-600' },
    { label: 'Platform Revenue', value: s.totalRevenue !== undefined ? formatPrice(s.totalRevenue) : '—', icon: TrendingUp, color: 'bg-accent/10', ic: 'text-accent' },
  ];

  return (
    <DashboardLayout>
      <h1 className="font-poppins font-bold text-2xl text-brand-dark mb-8">Platform Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, ic }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="card p-5">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={18} className={ic} />
            </div>
            <p className="font-poppins font-bold text-xl text-brand-dark">{loading ? '…' : (value ?? '—')}</p>
            <p className="text-xs text-brand-muted mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue & Orders Chart */}
      <div className="card p-6 mb-6">
        <h2 className="font-poppins font-semibold text-brand-dark mb-4">Monthly Revenue & Orders</h2>
        {monthlyStats.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyStats}>
              <defs>
                <linearGradient id="adminRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF7A59" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#FF7A59" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="adminOrd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5FA36A" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#5FA36A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#FFF0E8" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B6361' }} />
              <YAxis yAxisId="r" tick={{ fontSize: 11, fill: '#8B6361' }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
              <YAxis yAxisId="o" orientation="right" tick={{ fontSize: 11, fill: '#8B6361' }} />
              <Tooltip formatter={(v, n) => n === 'revenue' ? formatPrice(v) : v} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(74,44,42,0.12)' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area yAxisId="r" type="monotone" dataKey="revenue" name="Revenue" stroke="#FF7A59" strokeWidth={2} fill="url(#adminRev)" />
              <Area yAxisId="o" type="monotone" dataKey="orders" name="Orders" stroke="#5FA36A" strokeWidth={2} fill="url(#adminOrd)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-brand-muted text-sm">No data yet</div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* User Growth */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-poppins font-semibold text-brand-dark mb-4">User Growth</h2>
          {userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFF0E8" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B6361' }} />
                <YAxis tick={{ fontSize: 11, fill: '#8B6361' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Bar dataKey="users" fill="#FF7A59" radius={[6, 6, 0, 0]} name="New Users" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-brand-muted text-sm">No data</div>
          )}
        </div>

        {/* Order Status Pie */}
        <div className="card p-5">
          <h2 className="font-poppins font-semibold text-brand-dark mb-4">Order Status</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-brand-muted text-sm">No data</div>
          )}
        </div>
      </div>

      {/* Top Vendors */}
      <div className="card p-6">
        <h2 className="font-poppins font-semibold text-brand-dark mb-5">Top Vendors by Revenue</h2>
        {topVendors.length === 0 ? (
          <p className="text-brand-muted text-sm text-center py-6">No vendor data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-brand-muted text-xs font-semibold uppercase border-b border-orange-50">
                  <th className="text-left pb-3">#</th>
                  <th className="text-left pb-3">Vendor</th>
                  <th className="text-right pb-3">Orders</th>
                  <th className="text-right pb-3">Rating</th>
                  <th className="text-right pb-3">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50">
                {topVendors.map((v, i) => (
                  <tr key={v.vendorId} className="hover:bg-brand-bg/50">
                    <td className="py-3 text-brand-muted font-bold">{i + 1}</td>
                    <td className="py-3 font-medium text-brand-dark">{v.businessName}</td>
                    <td className="py-3 text-right text-brand-muted">{v.totalOrders}</td>
                    <td className="py-3 text-right text-yellow-500 font-medium">{Number(v.rating || 0).toFixed(1)} ★</td>
                    <td className="py-3 text-right font-semibold text-accent">{formatPrice(v.totalEarnings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

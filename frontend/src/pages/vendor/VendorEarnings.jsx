import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, Star, Package, ArrowUpRight } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import { formatPrice } from '../../utils/formatters';

export default function VendorEarnings() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/vendor')
      .then(({ data }) => setAnalytics(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const s = analytics?.summary || {};
  const monthly = (analytics?.monthlyRevenue || []).map((d) => ({
    month: d.month,
    revenue: Number(d.revenue) || 0,
    orders: Number(d.orders) || 0,
  }));
  const daily = (analytics?.dailyRevenue || []).map((d) => ({
    day: d.day?.slice(5), // MM-DD
    revenue: Number(d.revenue) || 0,
    orders: Number(d.orders) || 0,
  }));

  const cards = [
    { label: 'Total Earnings', value: s.totalEarnings !== undefined ? formatPrice(s.totalEarnings) : '—', icon: TrendingUp, color: 'bg-accent/10', ic: 'text-accent' },
    { label: 'Total Orders', value: s.totalOrders ?? '—', icon: ShoppingBag, color: 'bg-primary/10', ic: 'text-primary' },
    { label: 'Completion Rate', value: s.completionRate !== undefined ? `${s.completionRate}%` : '—', icon: Package, color: 'bg-blue-50', ic: 'text-blue-500' },
    { label: 'Rating', value: s.rating ? `${Number(s.rating).toFixed(1)} / 5` : '—', icon: Star, color: 'bg-yellow-50', ic: 'text-yellow-500' },
  ];

  return (
    <DashboardLayout>
      <h1 className="font-poppins font-bold text-xl text-brand-dark mb-6">Earnings & Analytics</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, ic }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={20} className={ic} />
            </div>
            <p className="font-poppins font-bold text-xl text-brand-dark">{loading ? '…' : value}</p>
            <p className="text-sm text-brand-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Monthly Chart */}
      <div className="card p-5 mb-6">
        <h2 className="font-poppins font-semibold text-brand-dark mb-4">Monthly Revenue (Last 6 Months)</h2>
        {monthly.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF7A59" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#FF7A59" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ord" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5FA36A" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#5FA36A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#FFF0E8" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B6361' }} />
              <YAxis yAxisId="rev" tick={{ fontSize: 11, fill: '#8B6361' }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
              <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 11, fill: '#8B6361' }} />
              <Tooltip formatter={(v, name) => name === 'revenue' ? formatPrice(v) : v} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(74,44,42,0.12)' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue" stroke="#FF7A59" strokeWidth={2} fill="url(#rev)" />
              <Area yAxisId="ord" type="monotone" dataKey="orders" name="Orders" stroke="#5FA36A" strokeWidth={2} fill="url(#ord)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[260px] flex items-center justify-center text-brand-muted text-sm">No data yet — start selling!</div>
        )}
      </div>

      {/* Daily Chart */}
      <div className="card p-5">
        <h2 className="font-poppins font-semibold text-brand-dark mb-4">Daily Revenue (Last 14 Days)</h2>
        {daily.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#FFF0E8" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8B6361' }} />
              <YAxis tick={{ fontSize: 11, fill: '#8B6361' }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatPrice(v)} contentStyle={{ borderRadius: '12px', border: 'none' }} />
              <Bar dataKey="revenue" fill="#FF7A59" radius={[6, 6, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-brand-muted text-sm">No recent sales data</div>
        )}
      </div>
    </DashboardLayout>
  );
}

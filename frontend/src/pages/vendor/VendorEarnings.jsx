import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, Percent, Package, 
  Calendar, Download, ArrowUpRight, ArrowDownRight, Crown,
  Clock, ShoppingCart, Wallet, CreditCard, ArrowRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import { formatPrice, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function VendorEarnings() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  
  // Date range state (same as dashboard)
  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    loadEarningsData();
  }, [dateRange, customStartDate, customEndDate]);

  const loadEarningsData = () => {
    setLoading(true);
    
    // Build query params for date filtering
    const params = {};
    if (dateRange === 'today') {
      params.startDate = new Date().toISOString().split('T')[0];
      params.endDate = new Date().toISOString().split('T')[0];
    } else if (dateRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      params.startDate = weekAgo.toISOString().split('T')[0];
      params.endDate = new Date().toISOString().split('T')[0];
    } else if (dateRange === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      params.startDate = monthAgo.toISOString().split('T')[0];
      params.endDate = new Date().toISOString().split('T')[0];
    } else if (dateRange === 'custom' && customStartDate && customEndDate) {
      params.startDate = customStartDate;
      params.endDate = customEndDate;
    }

    api.get('/analytics/vendor', { params })
      .then(({ data }) => setAnalytics(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleWithdrawal = () => {
    setWithdrawing(true);
    // TODO: Implement withdrawal API call
    setTimeout(() => {
      toast.success('Withdrawal request submitted! You will receive payment within 2-3 business days.');
      setWithdrawing(false);
    }, 1500);
  };

  const s = analytics?.summary || {};
  
  // Calculate earnings breakdown
  const COMMISSION_RATE = 0.10; // 10% platform commission
  const grossEarnings = s.totalEarnings || 0;
  const platformCommission = grossEarnings * COMMISSION_RATE;
  const netEarnings = grossEarnings - platformCommission;
  
  // Mock data for available balance (in real app, this comes from backend)
  const availableBalance = netEarnings * 0.8; // 80% of net is available (20% pending)
  const pendingBalance = netEarnings * 0.2;
  
  // Calculate average order value
  const avgOrderValue = s.totalOrders > 0 ? grossEarnings / s.totalOrders : 0;
  
  // Calculate total items sold (mock - should come from backend)
  const totalItemsSold = s.totalOrders ? s.totalOrders * 2.5 : 0; // Avg 2.5 items per order
  
  // Get chart data
  const monthly = (analytics?.monthlyRevenue || []).map((d) => ({
    month: d.month,
    revenue: Number(d.revenue) || 0,
    orders: Number(d.orders) || 0,
  }));
  
  const daily = (analytics?.dailyRevenue || []).map((d) => ({
    day: d.day?.slice(5) || d.day, // MM-DD or full date
    revenue: Number(d.revenue) || 0,
    orders: Number(d.orders) || 0,
  }));
  
  // Use daily chart if date range is less than 30 days, otherwise monthly
  const shouldShowDaily = dateRange === 'today' || dateRange === 'week' || 
    (dateRange === 'custom' && customStartDate && customEndDate && 
     (new Date(customEndDate) - new Date(customStartDate)) / (1000 * 60 * 60 * 24) <= 30);
  
  const chartData = shouldShowDaily ? daily : monthly;
  const chartLabel = shouldShowDaily ? 'Daily Revenue' : 'Monthly Revenue';
  
  // Find best performing day
  const bestDay = chartData.length > 0 
    ? chartData.reduce((max, item) => item.revenue > max.revenue ? item : max, chartData[0])
    : null;
  
  // Top product (mock - should come from backend)
  const topProduct = analytics?.topProducts?.[0] || null;

  // Mock transaction data (should come from backend)
  const recentTransactions = [
    { id: 1, date: '2024-01-20', orderNumber: 'SK-2024-1234', gross: 5400, commission: 540, net: 4860, status: 'completed' },
    { id: 2, date: '2024-01-19', orderNumber: 'SK-2024-1233', gross: 3200, commission: 320, net: 2880, status: 'completed' },
    { id: 3, date: '2024-01-18', orderNumber: 'SK-2024-1232', gross: 8900, commission: 890, net: 8010, status: 'completed' },
    { id: 4, date: '2024-01-17', orderNumber: 'SK-2024-1231', gross: 2100, commission: 210, net: 1890, status: 'pending' },
    { id: 5, date: '2024-01-16', orderNumber: 'SK-2024-1230', gross: 6700, commission: 670, net: 6030, status: 'completed' },
  ];

  // Mock withdrawal history (should come from backend)
  const withdrawalHistory = [
    { id: 1, date: '2024-01-15', amount: 125000, status: 'completed', bank: 'GTBank ***1234' },
    { id: 2, date: '2024-01-01', amount: 98000, status: 'completed', bank: 'GTBank ***1234' },
    { id: 3, date: '2023-12-15', amount: 156000, status: 'completed', bank: 'GTBank ***1234' },
  ];

  // Primary earnings cards
  const earningsCards = [
    { 
      label: 'Gross Earnings', 
      value: formatPrice(grossEarnings), 
      icon: DollarSign, 
      color: 'bg-blue-50', 
      ic: 'text-blue-500',
      sub: 'Total from orders',
      trend: '+12%',
      trendUp: true
    },
    { 
      label: 'Platform Fee', 
      value: formatPrice(platformCommission), 
      icon: Percent, 
      color: 'bg-orange-50', 
      ic: 'text-orange-500',
      sub: `${(COMMISSION_RATE * 100).toFixed(0)}% commission`,
      trend: null
    },
    { 
      label: 'Net Earnings', 
      value: formatPrice(netEarnings), 
      icon: TrendingUp, 
      color: 'bg-green-50', 
      ic: 'text-green-500',
      sub: 'After commission',
      trend: '+15%',
      trendUp: true
    },
    { 
      label: 'Available Balance', 
      value: formatPrice(availableBalance), 
      icon: Wallet, 
      color: 'bg-accent/10', 
      ic: 'text-accent',
      sub: 'Ready to withdraw',
      action: true
    },
  ];

  // Performance insight cards
  const insightCards = [
    { 
      label: 'Items Sold', 
      value: Math.round(totalItemsSold).toLocaleString(), 
      icon: Package, 
      color: 'bg-purple-50', 
      ic: 'text-purple-500',
      sub: 'Total quantity'
    },
    { 
      label: 'Avg Order Value', 
      value: formatPrice(avgOrderValue), 
      icon: ShoppingCart, 
      color: 'bg-indigo-50', 
      ic: 'text-indigo-500',
      sub: 'Per order'
    },
    { 
      label: 'Best Day', 
      value: bestDay ? (bestDay.month || bestDay.day) : '—', 
      icon: Crown, 
      color: 'bg-yellow-50', 
      ic: 'text-yellow-500',
      sub: bestDay ? formatPrice(bestDay.revenue) : 'No data'
    },
    { 
      label: 'Top Product', 
      value: topProduct ? topProduct.name?.slice(0, 15) + '...' : '—', 
      icon: TrendingUp, 
      color: 'bg-pink-50', 
      ic: 'text-pink-500',
      sub: topProduct ? `${topProduct.totalSold} sold` : 'No sales yet'
    },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-poppins font-bold text-2xl text-brand-dark">Earnings & Analytics</h1>
          <p className="text-brand-muted text-sm mt-0.5">Track your revenue and performance</p>
        </div>
        <button
          onClick={handleWithdrawal}
          disabled={withdrawing || availableBalance < 1000}
          className="btn-primary flex items-center gap-2 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CreditCard size={16} />
          {withdrawing ? 'Processing...' : 'Withdraw Funds'}
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="card p-5 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-brand-dark">
            <Calendar size={18} className="text-primary" />
            <span className="font-semibold text-sm">Date Range:</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {['all', 'today', 'week', 'month', 'custom'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  dateRange === range
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-brand-bg text-brand-muted hover:bg-orange-50'
                }`}
              >
                {range === 'all' && 'All Time'}
                {range === 'today' && 'Today'}
                {range === 'week' && 'Last 7 Days'}
                {range === 'month' && 'Last 30 Days'}
                {range === 'custom' && 'Custom Range'}
              </button>
            ))}
          </div>

          {dateRange === 'custom' && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 ml-auto"
            >
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-orange-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              <span className="text-brand-muted">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-orange-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Earnings Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {earningsCards.map(({ label, value, icon: Icon, color, ic, sub, trend, trendUp, action }, i) => (
          <motion.div 
            key={label} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.08 }}
            className="card p-4 relative"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center`}>
                <Icon size={18} className={ic} />
              </div>
              {trend && (
                <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
                  {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {trend}
                </div>
              )}
            </div>
            <p className="font-poppins font-bold text-xl text-brand-dark">{loading ? '…' : value}</p>
            <p className="text-xs text-brand-dark font-medium mt-0.5">{label}</p>
            <p className="text-xs text-brand-muted/70 mt-0.5">{sub}</p>
            {action && !loading && availableBalance >= 1000 && (
              <div className="mt-2 pt-2 border-t border-orange-100">
                <p className="text-xs text-brand-muted">Pending: {formatPrice(pendingBalance)}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {insightCards.map(({ label, value, icon: Icon, color, ic, sub }, i) => (
          <motion.div 
            key={label} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 + i * 0.08 }}
            className="card p-4"
          >
            <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center mb-2`}>
              <Icon size={18} className={ic} />
            </div>
            <p className="font-poppins font-bold text-lg text-brand-dark">{loading ? '…' : value}</p>
            <p className="text-xs text-brand-dark font-medium mt-0.5">{label}</p>
            <p className="text-xs text-brand-muted/70 mt-0.5">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-poppins font-semibold text-brand-dark">{chartLabel}</h2>
          <button className="text-xs text-primary hover:underline flex items-center gap-1">
            <Download size={12} /> Export
          </button>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
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
              <XAxis 
                dataKey={shouldShowDaily ? 'day' : 'month'} 
                tick={{ fontSize: 11, fill: '#8B6361' }} 
              />
              <YAxis 
                yAxisId="rev" 
                tick={{ fontSize: 11, fill: '#8B6361' }} 
                tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} 
              />
              <YAxis 
                yAxisId="ord" 
                orientation="right" 
                tick={{ fontSize: 11, fill: '#8B6361' }} 
              />
              <Tooltip 
                formatter={(v, name) => name === 'revenue' ? formatPrice(v) : v} 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(74,44,42,0.12)' }} 
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area 
                yAxisId="rev" 
                type="monotone" 
                dataKey="revenue" 
                name="Revenue" 
                stroke="#FF7A59" 
                strokeWidth={2} 
                fill="url(#rev)" 
              />
              <Area 
                yAxisId="ord" 
                type="monotone" 
                dataKey="orders" 
                name="Orders" 
                stroke="#5FA36A" 
                strokeWidth={2} 
                fill="url(#ord)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-brand-muted text-sm">
            No data for selected period
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-poppins font-semibold text-brand-dark">Recent Transactions</h2>
          <button className="text-xs text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight size={12} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-orange-100">
                <th className="text-left py-3 px-2 text-xs font-semibold text-brand-muted">Date</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-brand-muted">Order #</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-brand-muted">Gross</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-brand-muted">Fee</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-brand-muted">Net</th>
                <th className="text-center py-3 px-2 text-xs font-semibold text-brand-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-orange-50 hover:bg-orange-50/50 transition-colors">
                  <td className="py-3 px-2 text-xs text-brand-muted">{tx.date}</td>
                  <td className="py-3 px-2 text-xs font-medium text-brand-dark">{tx.orderNumber}</td>
                  <td className="py-3 px-2 text-xs text-right text-brand-dark">{formatPrice(tx.gross)}</td>
                  <td className="py-3 px-2 text-xs text-right text-orange-500">-{formatPrice(tx.commission)}</td>
                  <td className="py-3 px-2 text-xs text-right font-semibold text-green-600">{formatPrice(tx.net)}</td>
                  <td className="py-3 px-2 text-center">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      tx.status === 'completed' 
                        ? 'bg-green-50 text-green-600' 
                        : 'bg-yellow-50 text-yellow-600'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdrawal History */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-poppins font-semibold text-brand-dark">Withdrawal History</h2>
          <button className="text-xs text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight size={12} />
          </button>
        </div>
        <div className="space-y-3">
          {withdrawalHistory.map((withdrawal) => (
            <div key={withdrawal.id} className="flex items-center justify-between py-3 px-4 bg-brand-bg rounded-xl hover:bg-orange-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                  <CreditCard size={18} className="text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-dark">{formatPrice(withdrawal.amount)}</p>
                  <p className="text-xs text-brand-muted">{withdrawal.bank}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
                  {withdrawal.status}
                </span>
                <p className="text-xs text-brand-muted mt-1">{withdrawal.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

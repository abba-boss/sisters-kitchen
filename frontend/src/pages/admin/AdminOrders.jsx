import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Search, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { orderService } from '../../services/orderService';
import { useSocketEvent } from '../../hooks/useSocket';
import { formatPrice, formatDate, getOrderStatusColor, getOrderStatusLabel } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchOrders = () => {
    setLoading(true);
    orderService.getAllOrders({ page, limit: 20, status: statusFilter })
      .then(({ data }) => { setOrders(data.data || []); setMeta(data.meta || {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  // Live updates
  useSocketEvent('order:new', () => { fetchOrders(); toast.success('New order received!'); });
  useSocketEvent('order:status_changed', () => fetchOrders());

  const filtered = search
    ? orders.filter((o) =>
        o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
        o.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        o.vendor?.businessName?.toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  const statuses = ['', 'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="font-poppins font-bold text-xl text-brand-dark">All Orders</h1>
          <p className="text-brand-muted text-sm">{meta.total} total orders</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              type="text"
              placeholder="Search orders…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 py-2 text-sm w-48"
            />
          </div>
          <button onClick={fetchOrders} className="p-2 rounded-xl hover:bg-brand-bg text-brand-muted hover:text-primary transition-all" title="Refresh">
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5 pb-1">
        {statuses.map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
              statusFilter === s ? 'bg-primary text-white shadow-soft' : 'bg-white text-brand-muted border border-orange-100 hover:border-primary hover:text-primary'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders found" message="No orders match your current filters." />
      ) : (
        <>
          <div className="card overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-brand-bg">
                  <tr className="text-brand-muted text-xs font-semibold uppercase">
                    <th className="text-left px-4 py-3">Order</th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">Customer</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Vendor</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">Date</th>
                    <th className="text-right px-4 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50">
                  {filtered.map((o, i) => (
                    <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="hover:bg-brand-bg/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-brand-dark">
                        <Link to={`/orders/${o.id}`} className="hover:text-primary">#{o.orderNumber}</Link>
                      </td>
                      <td className="px-4 py-3 text-brand-muted hidden sm:table-cell">{o.user?.firstName} {o.user?.lastName}</td>
                      <td className="px-4 py-3 text-brand-muted hidden md:table-cell">{o.vendor?.businessName}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${getOrderStatusColor(o.status)}`}>{getOrderStatusLabel(o.status)}</span>
                      </td>
                      <td className="px-4 py-3 text-brand-muted hidden lg:table-cell text-xs">{formatDate(o.createdAt)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-brand-dark">{formatPrice(o.total)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} pages={meta.pages} onChange={(p) => { setPage(p); window.scrollTo(0, 0); }} />
        </>
      )}
    </DashboardLayout>
  );
}

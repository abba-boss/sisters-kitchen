import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ChevronRight, RefreshCw } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { orderService } from '../../services/orderService';
import { useSocketEvent } from '../../hooks/useSocket';
import {
  formatPrice, formatDate,
  getOrderStatusColor, getOrderStatusLabel,
} from '../../utils/formatters';
import toast from 'react-hot-toast';

const STATUS_FILTERS = ['', 'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const [orders,  setOrders]  = useState([]);
  const [meta,    setMeta]    = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [status,  setStatus]  = useState('');
  const [page,    setPage]    = useState(1);
  const [updated, setUpdated] = useState(null); // id of recently-updated order

  const fetchOrders = () => {
    setLoading(true);
    orderService.getMyOrders({ status, page, limit: 10 })
      .then(({ data }) => { setOrders(data.data || []); setMeta(data.meta || {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [status, page]);

  // Live order status updates
  useSocketEvent('order:updated', ({ order: updatedOrder }) => {
    const o = updatedOrder?.order || updatedOrder;
    if (!o?.id) return;
    setOrders((prev) =>
      prev.map((x) => x.id === o.id ? { ...x, status: o.status } : x)
    );
    setUpdated(o.id);
    setTimeout(() => setUpdated(null), 3000);
    toast.success(`Order #${o.orderNumber} → ${getOrderStatusLabel(o.status)}`);
  });

  return (
    <MainLayout>
      <div className="page-container py-10">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="section-title">My Orders</h1>
            <p className="text-brand-muted text-sm mt-0.5">{meta.total} orders total</p>
          </div>
          <button onClick={fetchOrders}
            className="flex items-center gap-2 text-sm text-brand-muted hover:text-primary transition-colors px-3 py-2 rounded-xl hover:bg-brand-bg">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Status filter pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 pb-1">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold capitalize transition-all ${
                status === s
                  ? 'bg-primary text-white shadow-soft'
                  : 'bg-white text-brand-muted border border-orange-100 hover:border-primary hover:text-primary'
              }`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card p-5 h-24 skeleton" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders found"
            message="You haven't placed any orders yet."
            actionLabel="Order Now"
            actionTo="/products"
          />
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {orders.map((order, i) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: i < 8 ? i * 0.04 : 0 }}
                  className={`card p-5 transition-all ${updated === order.id ? 'ring-2 ring-primary/40' : ''}`}>
                  <Link to={`/orders/${order.id}`} className="flex items-center justify-between gap-4 group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        updated === order.id ? 'bg-primary text-white' : 'bg-primary/10'
                      }`}>
                        <Package size={22} className={updated === order.id ? 'text-white' : 'text-primary'} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-brand-dark text-sm">
                            Order #{order.orderNumber}
                          </p>
                          {updated === order.id && (
                            <motion.span
                              initial={{ scale: 0 }} animate={{ scale: 1 }}
                              className="badge bg-primary text-white text-xs animate-pulse">
                              Updated!
                            </motion.span>
                          )}
                        </div>
                        <p className="text-xs text-brand-muted mt-0.5">
                          {order.vendor?.businessName} · {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-brand-muted">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <span className={`badge ${getOrderStatusColor(order.status)} mb-1 block`}>
                          {getOrderStatusLabel(order.status)}
                        </span>
                        <span className="font-poppins font-bold text-brand-dark text-sm">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                      <ChevronRight size={18} className="text-brand-muted group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <Pagination
          page={page}
          pages={meta.pages}
          onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        />
      </div>
    </MainLayout>
  );
}

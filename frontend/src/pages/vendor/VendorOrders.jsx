import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, CheckCircle, XCircle, Clock, Wifi } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EmptyState from '../../components/common/EmptyState';
import { orderService } from '../../services/orderService';
import { useSocketEvent } from '../../hooks/useSocket';
import { formatPrice, formatDateTime, getOrderStatusColor, getOrderStatusLabel } from '../../utils/formatters';
import toast from 'react-hot-toast';

const STATUS_ACTIONS = {
  pending: [
    { status: 'confirmed', label: 'Accept', icon: CheckCircle, color: 'bg-accent/10 text-accent hover:bg-accent hover:text-white' },
    { status: 'cancelled', label: 'Reject', icon: XCircle, color: 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white' },
  ],
  confirmed: [{ status: 'preparing', label: 'Start Preparing', icon: Clock, color: 'bg-primary/10 text-primary hover:bg-primary hover:text-white' }],
  preparing: [{ status: 'ready', label: 'Mark Ready', icon: CheckCircle, color: 'bg-primary/10 text-primary hover:bg-primary hover:text-white' }],
  ready: [{ status: 'out_for_delivery', label: 'Out for Delivery', icon: Clock, color: 'bg-primary/10 text-primary hover:bg-primary hover:text-white' }],
  out_for_delivery: [{ status: 'delivered', label: 'Mark Delivered', icon: CheckCircle, color: 'bg-accent/10 text-accent hover:bg-accent hover:text-white' }],
};

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState(null);
  const [liveOrder, setLiveOrder] = useState(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    orderService.getVendorOrders({ status: statusFilter, limit: 50 })
      .then(({ data }) => setOrders(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Real-time: new order came in ────────────────────────────
  useSocketEvent('order:new', ({ order }) => {
    setLiveOrder(order);
    setOrders((prev) => {
      if (prev.find((o) => o.id === order.id)) return prev;
      return [order, ...prev];
    });
    toast.success(`🛎️ New order #${order.orderNumber}!`);
  });

  // ── Real-time: order status changed ─────────────────────────
  useSocketEvent('order:updated', ({ order: updated }) => {
    const o = updated?.order || updated;
    setOrders((prev) => prev.map((x) => x.id === o?.id ? o : x));
  });

  const handleStatusUpdate = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await orderService.updateStatus(orderId, { status });
      toast.success(`Order ${getOrderStatusLabel(status)}`);
      fetchOrders();
    } catch { toast.error('Failed to update order'); }
    finally { setUpdating(null); }
  };

  const statuses = ['', 'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-poppins font-bold text-xl text-brand-dark">Orders</h1>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-accent font-medium">
            <Wifi size={12} /> Live updates active
          </div>
        </div>
        <span className="text-sm text-brand-muted">{orders.length} orders</span>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5 pb-1">
        {statuses.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold capitalize transition-all ${statusFilter === s ? 'bg-primary text-white shadow-soft' : 'bg-white text-brand-muted border border-orange-100 hover:border-primary'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
      ) : orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders" message="New orders will appear here in real-time." />
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {orders.map((order, i) => (
              <motion.div key={order.id}
                layout
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: i < 8 ? i * 0.04 : 0 }}
                className={`card p-5 ${order.id === liveOrder?.id ? 'ring-2 ring-primary/40' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ShoppingBag size={18} className="text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-brand-dark text-sm">#{order.orderNumber}</span>
                        <span className={`badge ${getOrderStatusColor(order.status)}`}>{getOrderStatusLabel(order.status)}</span>
                        {order.id === liveOrder?.id && <span className="badge bg-primary/10 text-primary text-xs animate-pulse">New!</span>}
                      </div>
                      <p className="text-xs text-brand-muted mt-0.5">
                        {order.user?.firstName} {order.user?.lastName} · {formatDateTime(order.createdAt)}
                      </p>
                      <p className="text-xs text-brand-muted">{order.items?.length} item(s) · <strong>{formatPrice(order.total)}</strong></p>
                      {order.deliveryAddress && <p className="text-xs text-brand-muted mt-1">📍 {order.deliveryAddress}</p>}
                      {order.notes && <p className="text-xs text-brand-muted italic mt-0.5">Note: {order.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {STATUS_ACTIONS[order.status]?.map(({ status, label, icon: Icon, color }) => (
                      <button key={status}
                        onClick={() => handleStatusUpdate(order.id, status)}
                        disabled={updating === order.id}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-60 ${color}`}>
                        <Icon size={14} /> {updating === order.id ? '…' : label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </DashboardLayout>
  );
}

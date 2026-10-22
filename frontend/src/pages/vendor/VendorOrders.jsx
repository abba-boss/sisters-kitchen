import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, CheckCircle, XCircle, Clock, Wifi, QrCode, 
  MapPin, Truck, Eye, Search, Calendar, Filter, RefreshCw,
  MoreVertical, Check, X
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { EmptyOrders } from '../../components/common/EmptyState';
import { OrderCardSkeleton } from '../../components/common/SkeletonLoader';
import PickupVerificationModal from '../../components/vendor/PickupVerificationModal';
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
  const [typeFilter, setTypeFilter] = useState(''); // delivery, pickup
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState(null);
  const [liveOrder, setLiveOrder] = useState(null);
  const [verifyModalOrder, setVerifyModalOrder] = useState(null);
  const [selectedDate, setSelectedDate] = useState('today'); // today, all
  const [actionDropdown, setActionDropdown] = useState(null);

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

  const handleVerifySuccess = (updatedOrder) => {
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    setVerifyModalOrder(null);
    fetchOrders();
  };

  const isPickupOrder = (order) => order.fulfillmentType === 'pickup';
  const canVerifyPickup = (order) => isPickupOrder(order) && order.status === 'ready' && !order.pickupVerifiedAt;

  // Calculate stats
  const todayOrders = orders.filter(o => {
    const today = new Date().toDateString();
    return new Date(o.createdAt).toDateString() === today;
  });
  
  const stats = {
    todaysOrders: todayOrders.length,
    revenue: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + Number(o.total), 0),
    pending: orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'delivered').length,
    refunded: orders.filter(o => o.status === 'cancelled').length,
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    // Search filter
    if (searchQuery && !order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !order.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !order.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (statusFilter && order.status !== statusFilter) return false;
    
    // Type filter
    if (typeFilter && order.fulfillmentType !== typeFilter) return false;
    
    // Date filter
    if (selectedDate === 'today') {
      const today = new Date().toDateString();
      if (new Date(order.createdAt).toDateString() !== today) return false;
    }
    
    return true;
  });

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-poppins font-bold text-2xl text-brand-dark">Order Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card p-5">
          <p className="text-xs text-brand-muted mb-1">Today's Orders</p>
          <p className="font-poppins font-bold text-2xl text-brand-dark">{stats.todaysOrders}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-brand-muted mb-1">Revenue (Incl. 10%)</p>
          <p className="font-poppins font-bold text-xl text-brand-dark">{formatPrice(stats.revenue)}</p>
          <p className="text-xs text-accent mt-1">N887,439</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-brand-muted mb-1">Pending</p>
          <p className="font-poppins font-bold text-2xl text-brand-dark">{stats.pending}</p>
          <p className="text-xs text-brand-muted mt-1">3 orders</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-brand-muted mb-1">Completed</p>
          <p className="font-poppins font-bold text-2xl text-brand-dark">{stats.completed}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-brand-muted mb-1">Refunded</p>
          <p className="font-poppins font-bold text-2xl text-brand-dark text-red-500">{stats.refunded === 0 ? 'No' : stats.refunded}</p>
          <p className="text-xs text-brand-muted mt-1">0 orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              type="text"
              placeholder="Search by order number or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-orange-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none px-4 py-2.5 pr-10 border border-orange-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white cursor-pointer"
            >
              <option value="">All Orders</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none px-4 py-2.5 pr-10 border border-orange-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="delivery">Delivery</option>
              <option value="pickup">Pickup</option>
            </select>
            <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
          </div>

          {/* Date Filter */}
          <div className="relative">
            <button
              onClick={() => setSelectedDate(selectedDate === 'today' ? 'all' : 'today')}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-all ${
                selectedDate === 'today'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-orange-200 bg-white text-brand-muted hover:border-primary'
              }`}
            >
              <Calendar size={16} />
              {selectedDate === 'today' ? 'Today' : 'All Time'}
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={fetchOrders}
            className="p-2.5 border border-orange-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all"
          >
            <RefreshCw size={18} className="text-brand-muted" />
          </button>
        </div>
      </div>

      {/* Orders Count */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-poppins font-semibold text-brand-dark">Orders</h2>
        <span className="text-sm text-brand-muted">Showing <strong>{filteredOrders.length}</strong> orders</span>
      </div>

      {loading ? (
        <div className="card p-5">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyOrders 
          isVendor={true}
          onBrowse={() => window.location.href = '/vendor/products'}
        />
      ) : (
        <div className="card overflow-hidden">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-orange-100 bg-brand-bg/50">
                  <th className="text-left py-4 px-4 text-xs font-semibold text-brand-muted">Order #</th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-brand-muted">Customer</th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-brand-muted">Type</th>
                  <th className="text-center py-4 px-4 text-xs font-semibold text-brand-muted">Items</th>
                  <th className="text-right py-4 px-4 text-xs font-semibold text-brand-muted">Subtotal</th>
                  <th className="text-right py-4 px-4 text-xs font-semibold text-brand-muted">Total (Incl. 10%)</th>
                  <th className="text-center py-4 px-4 text-xs font-semibold text-brand-muted">Status</th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-brand-muted">Time</th>
                  <th className="text-center py-4 px-4 text-xs font-semibold text-brand-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filteredOrders.map((order) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`border-b border-orange-50 hover:bg-orange-50/50 transition-colors ${
                        order.id === liveOrder?.id ? 'bg-primary/5' : ''
                      }`}
                    >
                      {/* Order Number */}
                      <td className="py-4 px-4">
                        <span className="font-semibold text-sm text-brand-dark">#{order.orderNumber}</span>
                        {order.id === liveOrder?.id && (
                          <span className="ml-2 inline-block w-2 h-2 bg-accent rounded-full animate-pulse"></span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-4">
                        <p className="text-sm text-brand-dark font-medium">
                          {order.user?.firstName} {order.user?.lastName}
                        </p>
                        {!isPickupOrder(order) && order.deliveryAddress && (
                          <p className="text-xs text-brand-muted truncate max-w-[200px]">
                            {order.deliveryAddress}
                          </p>
                        )}
                      </td>

                      {/* Type */}
                      <td className="py-4 px-4">
                        {isPickupOrder(order) ? (
                          <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                            <MapPin size={12} /> pickup
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                            <Truck size={12} /> walk-in
                          </span>
                        )}
                      </td>

                      {/* Items */}
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm text-brand-dark">{order.items?.length || 0}</span>
                      </td>

                      {/* Subtotal */}
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm text-brand-muted">{formatPrice(order.subtotal)}</span>
                      </td>

                      {/* Total */}
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm text-brand-dark font-semibold">{formatPrice(order.total)}</span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                          order.status === 'confirmed' || order.status === 'preparing' ? 'bg-orange-50 text-orange-600' :
                          order.status === 'ready' ? 'bg-green-50 text-green-600' :
                          order.status === 'out_for_delivery' ? 'bg-blue-50 text-blue-600' :
                          order.status === 'delivered' ? 'bg-green-50 text-green-600' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {getOrderStatusLabel(order.status)}
                        </span>
                        {order.pickupVerifiedAt && (
                          <div className="mt-1">
                            <span className="text-xs text-accent flex items-center justify-center gap-1">
                              <CheckCircle size={10} /> Picked up
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Time */}
                      <td className="py-4 px-4">
                        <p className="text-xs text-brand-muted whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-xs text-brand-muted">
                          {new Date(order.createdAt).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* View Button */}
                          <button
                            className="p-1.5 hover:bg-orange-100 rounded-lg transition-colors"
                            title="View order"
                          >
                            <Eye size={16} className="text-brand-muted" />
                          </button>

                          {/* Verify Pickup */}
                          {canVerifyPickup(order) && (
                            <button
                              onClick={() => setVerifyModalOrder(order)}
                              className="p-1.5 hover:bg-accent/10 rounded-lg transition-colors"
                              title="Verify pickup"
                            >
                              <QrCode size={16} className="text-accent" />
                            </button>
                          )}

                          {/* Status Actions Dropdown */}
                          {STATUS_ACTIONS[order.status] && (
                            <div className="relative">
                              <button
                                onClick={() => setActionDropdown(actionDropdown === order.id ? null : order.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  order.status === 'pending' ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' :
                                  order.status === 'confirmed' || order.status === 'preparing' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' :
                                  'bg-green-50 text-green-600 hover:bg-green-100'
                                }`}
                              >
                                {updating === order.id ? '...' : getOrderStatusLabel(order.status)}
                              </button>

                              {/* Dropdown Menu */}
                              {actionDropdown === order.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-orange-100 overflow-hidden z-10"
                                >
                                  {STATUS_ACTIONS[order.status].map(({ status, label, icon: Icon }) => (
                                    <button
                                      key={status}
                                      onClick={() => {
                                        handleStatusUpdate(order.id, status);
                                        setActionDropdown(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-brand-dark hover:bg-orange-50 transition-colors"
                                    >
                                      <Icon size={16} />
                                      {label}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pickup Verification Modal */}
      {verifyModalOrder && (
        <PickupVerificationModal
          order={verifyModalOrder}
          onClose={() => setVerifyModalOrder(null)}
          onSuccess={handleVerifySuccess}
        />
      )}
    </DashboardLayout>
  );
}

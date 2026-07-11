import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, MapPin, Phone, ChevronRight, CheckCircle,
  Clock, Truck, XCircle, Wifi, WifiOff
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { PageLoader } from '../../components/common/LoadingSkeleton';
import { orderService } from '../../services/orderService';
import { joinOrderRoom, leaveOrderRoom } from '../../services/socketService';
import { useSocketEvent } from '../../hooks/useSocket';
import { formatPrice, formatDateTime, getOrderStatusColor, getOrderStatusLabel } from '../../utils/formatters';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

const STATUS_ICONS = {
  pending: Clock,
  confirmed: CheckCircle,
  preparing: Package,
  ready: CheckCircle,
  out_for_delivery: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    orderService.getById(id)
      .then(({ data }) => {
        setOrder(data.data);
        joinOrderRoom(id);
        setIsLive(true);
      })
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false));

    return () => {
      leaveOrderRoom(id);
      setIsLive(false);
    };
  }, [id]);

  // Real-time order updates via Socket.IO
  useSocketEvent('order:status_changed', ({ order: updatedOrder }) => {
    if (updatedOrder?.order?.id === id || updatedOrder?.id === id) {
      const o = updatedOrder?.order || updatedOrder;
      setOrder(o);
      toast.success(`Order status: ${getOrderStatusLabel(o.status)} 🔄`);
    }
  });

  useSocketEvent('order:updated', ({ order: updatedOrder }) => {
    const o = updatedOrder?.order || updatedOrder;
    if (o?.id === id) setOrder(o);
  });

  if (loading) return <PageLoader />;
  if (!order) return (
    <MainLayout>
      <div className="page-container py-20 text-center">
        <p className="text-brand-muted">Order not found.</p>
        <Link to="/orders" className="btn-primary mt-4 inline-block">My Orders</Link>
      </div>
    </MainLayout>
  );

  const currentStep = order.status === 'cancelled' ? -1 : STATUS_STEPS.indexOf(order.status);
  const progressPercent = currentStep < 0 ? 0 : (currentStep / (STATUS_STEPS.length - 1)) * 100;

  return (
    <MainLayout>
      <div className="page-container page-shell max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-brand-muted mb-6">
          <Link to="/orders" className="hover:text-primary">My Orders</Link>
          <ChevronRight size={14} />
          <span className="text-brand-dark font-medium">#{order.orderNumber}</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="font-poppins font-bold text-xl text-brand-dark">
            Order #{order.orderNumber}
          </h1>
          <div className="flex items-center gap-2">
            <span className={`badge ${getOrderStatusColor(order.status)} text-sm`}>
              {getOrderStatusLabel(order.status)}
            </span>
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isLive ? 'bg-accent/10 text-accent' : 'bg-gray-100 text-gray-500'}`}>
              {isLive ? <Wifi size={11} /> : <WifiOff size={11} />}
              {isLive ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Progress Tracker */}
        {order.status !== 'cancelled' && (
          <motion.div layout className="card p-6 mb-5">
            <h2 className="font-semibold text-brand-dark mb-6 text-sm">Order Progress</h2>
            <div className="relative">
              {/* Track */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-orange-100 rounded-full" />
              <motion.div
                className="absolute top-5 left-0 h-1 bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
              <div className="relative flex justify-between">
                {STATUS_STEPS.map((step, i) => {
                  const Icon = STATUS_ICONS[step] || CheckCircle;
                  const done = i < currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={step} className="flex flex-col items-center gap-2">
                      <motion.div
                        animate={active ? { scale: [1, 1.15, 1] } : {}}
                        transition={{ repeat: active ? Infinity : 0, duration: 2 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                          done ? 'bg-primary border-primary text-white' :
                          active ? 'bg-primary border-primary text-white shadow-soft ring-4 ring-primary/20' :
                          'bg-white border-orange-100 text-brand-muted'
                        }`}
                      >
                        <Icon size={16} />
                      </motion.div>
                      <span className={`text-xs font-medium text-center hidden sm:block leading-tight max-w-[60px] ${
                        done || active ? 'text-primary' : 'text-brand-muted'
                      }`}>
                        {getOrderStatusLabel(step)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {order.estimatedDeliveryTime && (
              <p className="text-xs text-brand-muted mt-5 flex items-center gap-1.5">
                <Clock size={13} className="text-primary" />
                Estimated delivery: <strong className="text-brand-dark">{order.estimatedDeliveryTime}</strong>
              </p>
            )}
          </motion.div>
        )}

        {/* Cancelled state */}
        {order.status === 'cancelled' && (
          <div className="card p-5 mb-5 border-l-4 border-red-400 bg-red-50">
            <div className="flex items-center gap-2 text-red-600 font-semibold text-sm mb-1">
              <XCircle size={16} /> Order Cancelled
            </div>
            {order.rejectionReason && <p className="text-sm text-red-500">{order.rejectionReason}</p>}
          </div>
        )}

        {/* Vendor Info */}
        <div className="card p-5 mb-4">
          <h2 className="font-semibold text-brand-dark mb-3 text-sm">Vendor</h2>
          <Link to={`/vendors/${order.vendor?.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="font-bold text-primary">{order.vendor?.businessName?.[0]}</span>
            </div>
            <span className="text-sm font-medium text-primary">{order.vendor?.businessName}</span>
          </Link>
        </div>

        {/* Delivery Info */}
        <div className="card p-5 mb-4">
          <h2 className="font-semibold text-brand-dark mb-3 text-sm">Delivery Details</h2>
          <div className="space-y-2 text-sm text-brand-muted">
            <div className="flex items-start gap-2">
              <MapPin size={15} className="text-primary mt-0.5 flex-shrink-0" />
              <span>{order.deliveryAddress}</span>
            </div>
            {order.deliveryPhone && (
              <div className="flex items-center gap-2">
                <Phone size={15} className="text-primary" />
                <span>{order.deliveryPhone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="card p-5 mb-4">
          <h2 className="font-semibold text-brand-dark mb-4 text-sm">Order Items</h2>
          <div className="space-y-3">
            {order.items?.map((item) => {
              const image = item.product?.images?.[0] || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100';
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <img src={image} alt={item.product?.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-dark truncate">{item.product?.name}</p>
                    <p className="text-xs text-brand-muted">x{item.quantity} × {formatPrice(item.price)}</p>
                  </div>
                  <span className="font-semibold text-sm text-brand-dark">{formatPrice(item.subtotal)}</span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-orange-100 mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-brand-muted">
              <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-brand-muted">
              <span>Delivery Fee</span><span>{formatPrice(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-poppins font-bold text-brand-dark pt-2 border-t border-orange-100">
              <span>Total</span>
              <span className="text-primary">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-brand-muted text-center mt-2">
          Ordered on {formatDateTime(order.createdAt)}
        </p>
      </div>
    </MainLayout>
  );
}

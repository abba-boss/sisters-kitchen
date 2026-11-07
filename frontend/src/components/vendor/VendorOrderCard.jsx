import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, QrCode, MapPin, Truck } from 'lucide-react';
import { formatPrice, getOrderStatusLabel } from '../../utils/formatters';

/**
 * Mobile-optimized order card for vendor dashboard
 * Shows on screens < md (768px)
 */
export default function VendorOrderCard({ order, onStatusUpdate, onVerifyPickup, updating }) {
  const [showActions, setShowActions] = useState(false);

  const isPickupOrder = order.fulfillmentType === 'pickup';
  const canVerifyPickup = isPickupOrder && order.status === 'ready' && !order.pickupVerifiedAt;

  // Determine available actions based on status
  const getActions = () => {
    const actions = {
      pending: [
        { status: 'confirmed', label: 'Accept', icon: CheckCircle, color: 'bg-accent text-white' },
        { status: 'cancelled', label: 'Reject', icon: XCircle, color: 'bg-red-500 text-white' },
      ],
      confirmed: [{ status: 'preparing', label: 'Start Preparing', icon: Clock, color: 'bg-primary text-white' }],
      preparing: [{ status: 'ready', label: 'Mark Ready', icon: CheckCircle, color: 'bg-primary text-white' }],
      ready: [{ status: 'out_for_delivery', label: 'Out for Delivery', icon: Clock, color: 'bg-primary text-white' }],
      out_for_delivery: [{ status: 'delivered', label: 'Mark Delivered', icon: CheckCircle, color: 'bg-accent text-white' }],
    };

    // Remove "out for delivery" for pickup orders
    if (isPickupOrder && actions.ready) {
      return actions[order.status]?.filter(a => a.status !== 'out_for_delivery') || [];
    }

    return actions[order.status] || [];
  };

  const actions = getActions();

  // Status badge color
  const getStatusColor = () => {
    if (order.status === 'pending') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    if (order.status === 'confirmed' || order.status === 'preparing') return 'bg-orange-50 text-orange-600 border-orange-200';
    if (order.status === 'ready') return 'bg-green-50 text-green-600 border-green-200';
    if (order.status === 'out_for_delivery') return 'bg-blue-50 text-blue-600 border-blue-200';
    if (order.status === 'delivered') return 'bg-green-50 text-green-600 border-green-200';
    return 'bg-red-50 text-red-600 border-red-200';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-orange-50 bg-brand-bg/30">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-brand-dark">#{order.orderNumber}</span>
            {order.id === order.liveOrderId && (
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
            )}
          </div>
          <p className="text-sm text-brand-muted">
            {order.user?.firstName} {order.user?.lastName}
          </p>
          {!isPickupOrder && order.deliveryAddress && (
            <p className="text-xs text-brand-muted truncate mt-1">
              {order.deliveryAddress}
            </p>
          )}
        </div>

        {/* Type badge */}
        <div className="flex items-center gap-2 ml-2">
          {isPickupOrder ? (
            <span className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-lg">
              <MapPin size={12} /> Pickup
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-lg">
              <Truck size={12} /> Delivery
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-brand-muted">Status</span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
            {getOrderStatusLabel(order.status)}
          </span>
        </div>

        {/* Items count */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-brand-muted">Items</span>
          <span className="text-sm font-medium text-brand-dark">{order.items?.length || 0} item(s)</span>
        </div>

        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-brand-muted">Subtotal</span>
          <span className="text-sm text-brand-muted">{formatPrice(order.subtotal)}</span>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-2 border-t border-orange-100">
          <span className="text-sm font-semibold text-brand-dark">Total (Incl. 10%)</span>
          <span className="text-base font-bold text-primary">{formatPrice(order.total)}</span>
        </div>

        {/* Time */}
        <div className="flex items-center justify-between text-xs text-brand-muted">
          <span>
            {new Date(order.createdAt).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
          <span>
            {new Date(order.createdAt).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            })}
          </span>
        </div>

        {/* Pickup verification status */}
        {order.pickupVerifiedAt && (
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-2 flex items-center gap-2">
            <CheckCircle size={14} className="text-accent" />
            <span className="text-xs text-accent font-medium">Picked up</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {(actions.length > 0 || canVerifyPickup) && (
        <div className="p-3 border-t border-orange-50 bg-brand-bg/20">
          <div className="flex gap-2">
            {/* Verify Pickup Button */}
            {canVerifyPickup && (
              <button
                onClick={onVerifyPickup}
                className="flex-1 flex items-center justify-center gap-2 bg-accent text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-accent/90 transition-all"
              >
                <QrCode size={16} />
                Verify Pickup
              </button>
            )}

            {/* Status Action Buttons */}
            {actions.length === 1 && (
              <button
                onClick={() => onStatusUpdate(order.id, actions[0].status)}
                disabled={updating === order.id}
                className={`flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl transition-all ${actions[0].color}`}
              >
                {updating === order.id ? (
                  'Processing...'
                ) : (
                  <>
                    {(() => {
                      const Icon = actions[0].icon;
                      return <Icon size={16} />;
                    })()}
                    {actions[0].label}
                  </>
                )}
              </button>
            )}

            {actions.length > 1 && (
              <>
                {actions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.status}
                      onClick={() => onStatusUpdate(order.id, action.status)}
                      disabled={updating === order.id}
                      className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 rounded-xl transition-all ${action.color}`}
                    >
                      {updating === order.id ? (
                        '...'
                      ) : (
                        <>
                          <Icon size={14} />
                          <span className="hidden sm:inline">{action.label}</span>
                        </>
                      )}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

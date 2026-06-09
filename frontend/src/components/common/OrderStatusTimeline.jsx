import { motion } from 'framer-motion';
import { CheckCircle, Clock, Package, Truck, XCircle, Star } from 'lucide-react';
import { formatDateTime, getOrderStatusLabel } from '../../utils/formatters';

const STEP_META = {
  pending:          { icon: Clock,        color: 'text-yellow-500', bg: 'bg-yellow-50',  label: 'Order Placed'   },
  confirmed:        { icon: CheckCircle,  color: 'text-primary',    bg: 'bg-primary/10', label: 'Confirmed'      },
  preparing:        { icon: Package,      color: 'text-blue-500',   bg: 'bg-blue-50',    label: 'Being Prepared' },
  ready:            { icon: Star,         color: 'text-accent',     bg: 'bg-accent/10',  label: 'Ready'          },
  out_for_delivery: { icon: Truck,        color: 'text-primary',    bg: 'bg-primary/10', label: 'On the Way'     },
  delivered:        { icon: CheckCircle,  color: 'text-accent',     bg: 'bg-accent/10',  label: 'Delivered'      },
  cancelled:        { icon: XCircle,      color: 'text-red-500',    bg: 'bg-red-50',     label: 'Cancelled'      },
};

const ORDER_STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

/**
 * Full vertical timeline showing order progress.
 * Pass `history` array of { status, timestamp } entries if available,
 * otherwise just pass `currentStatus` to derive approximate state.
 */
export default function OrderStatusTimeline({ currentStatus, history = [] }) {
  const cancelled = currentStatus === 'cancelled';
  const currentIdx = ORDER_STEPS.indexOf(currentStatus);

  // Build display steps
  const steps = cancelled
    ? [...ORDER_STEPS.slice(0, Math.max(1, currentIdx + 1)), 'cancelled']
    : ORDER_STEPS;

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-orange-100" />

      <div className="space-y-4">
        {steps.map((step, i) => {
          const meta    = STEP_META[step] || STEP_META.pending;
          const Icon    = meta.icon;
          const isDone  = cancelled
            ? step !== 'cancelled' && ORDER_STEPS.indexOf(step) <= currentIdx
            : i <= currentIdx;
          const isActive = step === currentStatus;

          // Find timestamp from history
          const histEntry = history.find((h) => h.status === step);

          return (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0  }}
              transition={{ delay: i * 0.07 }}
              className="flex items-start gap-4 relative">

              {/* Icon node */}
              <motion.div
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: isActive ? Infinity : 0, duration: 1.8 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 transition-all ${
                  isActive ? `${meta.bg} border-current ${meta.color} shadow-soft ring-4 ring-current/15` :
                  isDone   ? `${meta.bg} border-current ${meta.color}` :
                             'bg-white border-orange-100 text-brand-muted'
                }`}>
                <Icon size={17} />
              </motion.div>

              {/* Text */}
              <div className="pt-1.5 min-w-0">
                <p className={`text-sm font-semibold leading-snug ${
                  isActive ? 'text-brand-dark' : isDone ? 'text-brand-dark' : 'text-brand-muted'
                }`}>
                  {meta.label}
                  {isActive && <span className="ml-2 text-xs font-normal text-primary animate-pulse">● now</span>}
                </p>
                {histEntry?.timestamp && (
                  <p className="text-xs text-brand-muted mt-0.5">{formatDateTime(histEntry.timestamp)}</p>
                )}
                {!histEntry && isActive && (
                  <p className="text-xs text-brand-muted mt-0.5">In progress…</p>
                )}
                {!histEntry && isDone && !isActive && (
                  <p className="text-xs text-brand-muted mt-0.5">Completed</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

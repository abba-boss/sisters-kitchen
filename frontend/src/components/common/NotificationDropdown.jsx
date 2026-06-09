import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import { notificationService } from '../../services/notificationService';
import { timeAgo } from '../../utils/formatters';

const TYPE_COLORS = {
  order_placed: 'bg-primary/10 text-primary',
  order_confirmed: 'bg-accent/10 text-accent',
  order_preparing: 'bg-yellow-100 text-yellow-600',
  order_ready: 'bg-accent/10 text-accent',
  order_delivered: 'bg-accent/10 text-accent',
  order_cancelled: 'bg-red-100 text-red-500',
  new_order: 'bg-primary/10 text-primary',
  payment_success: 'bg-accent/10 text-accent',
  payment_failed: 'bg-red-100 text-red-500',
  general: 'bg-orange-100 text-orange-500',
};

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { notifications, unreadCount, setNotifications, markAsRead, markAllAsRead, removeNotification } = useNotificationStore();

  useEffect(() => {
    // Load notifications from API on mount
    notificationService.getAll()
      .then(({ data }) => setNotifications(data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    markAsRead(id);
    await notificationService.markAsRead(id).catch(() => {});
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    removeNotification(id);
    await notificationService.delete(id).catch(() => {});
  };

  const handleMarkAll = async () => {
    markAllAsRead();
    await notificationService.markAllAsRead().catch(() => {});
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-brand-bg text-brand-muted hover:text-primary transition-all"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-card-hover border border-orange-50 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-orange-50">
              <h3 className="font-poppins font-semibold text-sm text-brand-dark">
                Notifications {unreadCount > 0 && <span className="text-primary">({unreadCount})</span>}
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={handleMarkAll} className="text-xs text-primary hover:underline font-medium">
                    Mark all read
                  </button>
                )}
                <Link to="/notifications" onClick={() => setOpen(false)} className="text-brand-muted hover:text-primary transition-colors">
                  <ExternalLink size={14} />
                </Link>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={28} className="text-orange-100 mx-auto mb-2" />
                  <p className="text-sm text-brand-muted">No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div key={n.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-brand-bg/50 transition-colors border-b border-orange-50/60 last:border-0 ${!n.isRead ? 'bg-primary/5' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${TYPE_COLORS[n.type] || 'bg-orange-100 text-orange-500'}`}>
                      🔔
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold ${!n.isRead ? 'text-brand-dark' : 'text-brand-muted'} leading-snug`}>{n.title}</p>
                      <p className="text-xs text-brand-muted mt-0.5 line-clamp-2 leading-snug">{n.message}</p>
                      <p className="text-xs text-brand-muted/60 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {!n.isRead && (
                        <button onClick={(e) => handleMarkRead(n.id, e)} className="p-1 rounded-lg hover:bg-brand-bg text-brand-muted hover:text-accent transition-all" title="Mark read">
                          <Check size={12} />
                        </button>
                      )}
                      <button onClick={(e) => handleDelete(n.id, e)} className="p-1 rounded-lg hover:bg-red-50 text-brand-muted hover:text-red-500 transition-all" title="Delete">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 10 && (
              <div className="p-3 border-t border-orange-50 text-center">
                <Link to="/notifications" onClick={() => setOpen(false)} className="text-xs text-primary hover:underline font-medium">
                  View all {notifications.length} notifications
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

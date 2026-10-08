import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';
import { notificationService } from '../../services/notificationService';
import { timeAgo } from '../../utils/formatters';

const TYPE_COLORS = {
  order_placed:    'bg-primary/10 text-primary',
  order_confirmed: 'bg-accent/10 text-accent',
  order_preparing: 'bg-yellow-100 text-yellow-600',
  order_ready:     'bg-accent/10 text-accent',
  order_delivered: 'bg-accent/10 text-accent',
  order_cancelled: 'bg-red-100 text-red-500',
  new_order:       'bg-primary/10 text-primary',
  payment_success: 'bg-accent/10 text-accent',
  payment_failed:  'bg-red-100 text-red-500',
  general:         'bg-orange-100 text-orange-500',
  new_post_like:   'bg-pink-50 text-pink-500',
  new_post_comment:'bg-blue-50 text-blue-500',
  new_follower:    'bg-purple-50 text-purple-500',
};

const TYPE_EMOJI = {
  order_placed: '🛒', order_confirmed: '✅', order_preparing: '👩‍🍳',
  order_ready: '🎉', order_delivered: '🍽️', order_cancelled: '❌',
  new_order: '🛎️', payment_success: '💳', payment_failed: '⚠️',
  vendor_approved: '🎊', general: '🔔',
  new_post_like: '❤️', new_post_comment: '💬', new_follower: '👤',
};

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { isAuthenticated } = useAuthStore();
  const {
    notifications, unreadCount, setNotifications,
    markAsRead, markAllAsRead, removeNotification,
  } = useNotificationStore();

  // Load notifications only when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    notificationService.getAll()
      .then(({ data }) => setNotifications(data.data || []))
      .catch(() => {});
  }, [isAuthenticated]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
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

  // Don't render for guests
  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-xl hover:bg-brand-bg text-brand-muted hover:text-primary transition-all"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <motion.span
            key={unreadCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
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
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-1.5 text-xs font-bold bg-primary text-white px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={handleMarkAll} className="text-xs text-primary hover:underline font-medium">
                    Mark all read
                  </button>
                )}
                <Link to="/notifications" onClick={() => setOpen(false)}
                  className="text-brand-muted hover:text-primary transition-colors p-1">
                  <ExternalLink size={14} />
                </Link>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[380px] overflow-y-auto scrollbar-hide">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Bell size={20} className="text-orange-200" />
                  </div>
                  <p className="text-sm text-brand-muted">No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 12).map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors border-b border-orange-50/60 last:border-0 ${
                      !n.isRead ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-brand-bg/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm mt-0.5 ${
                      TYPE_COLORS[n.type] || 'bg-orange-100 text-orange-500'
                    }`}>
                      {TYPE_EMOJI[n.type] || '🔔'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold leading-snug ${!n.isRead ? 'text-brand-dark' : 'text-brand-muted'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-brand-muted mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-brand-muted/50 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0 ml-1">
                      {!n.isRead && (
                        <button onClick={(e) => handleMarkRead(n.id, e)}
                          className="p-1 rounded-lg hover:bg-accent/10 text-brand-muted hover:text-accent transition-all"
                          title="Mark read">
                          <Check size={11} />
                        </button>
                      )}
                      <button onClick={(e) => handleDelete(n.id, e)}
                        className="p-1 rounded-lg hover:bg-red-50 text-brand-muted hover:text-red-500 transition-all"
                        title="Delete">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 12 && (
              <div className="p-3 border-t border-orange-50 text-center">
                <Link to="/notifications" onClick={() => setOpen(false)}
                  className="text-xs text-primary hover:underline font-medium">
                  View all {notifications.length} notifications →
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

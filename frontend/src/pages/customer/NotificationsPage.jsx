import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import EmptyState from '../../components/common/EmptyState';
import { useNotificationStore } from '../../store/notificationStore';
import { notificationService } from '../../services/notificationService';
import { timeAgo } from '../../utils/formatters';
import toast from 'react-hot-toast';

const TYPE_EMOJI = {
  order_placed: '🛒', order_confirmed: '✅', order_preparing: '👩‍🍳',
  order_ready: '🎉', order_delivered: '🍽️', order_cancelled: '❌',
  new_order: '🛎️', payment_success: '💳', payment_failed: '⚠️',
  vendor_approved: '🎊', general: '🔔',
};

export default function NotificationsPage() {
  const { notifications, unreadCount, setNotifications, markAsRead, markAllAsRead, removeNotification } = useNotificationStore();

  useEffect(() => {
    notificationService.getAll()
      .then(({ data }) => setNotifications(data.data || []))
      .catch(() => {});
  }, []);

  const handleMarkRead = async (id) => {
    markAsRead(id);
    await notificationService.markAsRead(id).catch(() => {});
  };

  const handleMarkAll = async () => {
    markAllAsRead();
    await notificationService.markAllAsRead().catch(() => {});
    toast.success('All marked as read');
  };

  const handleDelete = async (id) => {
    removeNotification(id);
    await notificationService.delete(id).catch(() => {});
  };

  return (
    <MainLayout>
      <div className="page-container page-shell max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="section-title">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-primary font-medium mt-1">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAll}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
              <CheckCheck size={15} /> Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <EmptyState icon={Bell} title="You're all caught up!" message="Notifications about your orders and updates will appear here." />
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {notifications.map((n, i) => (
                <motion.div key={n.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40, height: 0 }}
                  transition={{ delay: i < 10 ? i * 0.03 : 0 }}
                  className={`card p-4 flex items-start gap-4 ${!n.isRead ? 'border-l-4 border-primary bg-primary/5' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg ${!n.isRead ? 'bg-primary/10' : 'bg-brand-bg'}`}>
                    {TYPE_EMOJI[n.type] || '🔔'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-snug ${!n.isRead ? 'text-brand-dark' : 'text-brand-muted'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-brand-muted mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-xs text-brand-muted/60 mt-1.5">{timeAgo(n.createdAt)}</p>
                  </div>

                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {!n.isRead && (
                      <button onClick={() => handleMarkRead(n.id)}
                        className="p-1.5 rounded-lg hover:bg-accent/10 text-brand-muted hover:text-accent transition-all"
                        title="Mark as read">
                        <Check size={14} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(n.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-brand-muted hover:text-red-500 transition-all"
                      title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

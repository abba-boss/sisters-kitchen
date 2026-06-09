import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    }),

  addNotification: (notification) => {
    const current = get().notifications;
    // Avoid duplicates
    if (current.find((n) => n.id === notification.id)) return;
    set({
      notifications: [notification, ...current].slice(0, 50),
      unreadCount: get().unreadCount + 1,
    });
  },

  markAsRead: (id) => {
    set({
      notifications: get().notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, get().unreadCount - 1),
    });
  },

  markAllAsRead: () => {
    set({
      notifications: get().notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    });
  },

  removeNotification: (id) => {
    const notif = get().notifications.find((n) => n.id === id);
    set({
      notifications: get().notifications.filter((n) => n.id !== id),
      unreadCount: notif && !notif.isRead ? Math.max(0, get().unreadCount - 1) : get().unreadCount,
    });
  },

  clear: () => set({ notifications: [], unreadCount: 0 }),
}));

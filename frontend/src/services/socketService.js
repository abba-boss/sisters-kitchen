import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket = null;

const notifySocketChanged = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('sisters-kitchen:socket-changed'));
};

export const connectSocket = () => {
  const token = useAuthStore.getState().accessToken;

  // Recreate the connection when the access token changes so a refreshed
  // token is not paired with the old authenticated socket.
  if (socket && (socket.auth?.token || null) !== (token || null)) {
    socket.disconnect();
    socket = null;
  }
  if (socket?.connected) return socket;

  // Visitors still connect so the public feed can stream new kitchen posts.
  socket = io(SOCKET_URL, {
    auth: token ? { token } : {},
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
    notifySocketChanged();
  });

  socket.on('connect_error', (err) => {
    console.warn('Socket connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    notifySocketChanged();
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    notifySocketChanged();
  }
};

export const getSocket = () => socket;

export const joinOrderRoom = (orderId) => {
  if (socket?.connected) socket.emit('join:order', orderId);
};

export const leaveOrderRoom = (orderId) => {
  if (socket?.connected) socket.emit('leave:order', orderId);
};

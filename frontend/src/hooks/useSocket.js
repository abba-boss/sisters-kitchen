import { useEffect, useRef, useState } from 'react';
import { connectSocket, getSocket } from '../services/socketService';
import { useAuthStore } from '../store/authStore';

/**
 * Connect socket when authenticated; disconnect on logout.
 * Must be called once at the app root.
 */
export const useSocketConnection = () => {
  const { accessToken } = useAuthStore();

  useEffect(() => {
    // Always connect: guests receive public feed events, signed-in users also
    // receive their private order/notification rooms.
    connectSocket();
  }, [accessToken]);
};

/**
 * Subscribe to a socket event while the component is mounted.
 * The socket instance is tracked independently so subscribers re-attach after
 * login, logout, or an access-token refresh.
 */
export const useSocketEvent = (event, handler, deps = []) => {
  const handlerRef = useRef(handler);
  const [socket, setSocket] = useState(getSocket);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const updateSocket = () => setSocket(getSocket());
    window.addEventListener('sisters-kitchen:socket-changed', updateSocket);
    updateSocket();

    return () => window.removeEventListener('sisters-kitchen:socket-changed', updateSocket);
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const callback = (...args) => handlerRef.current(...args);
    socket.on(event, callback);
    return () => socket.off(event, callback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, socket, ...deps]);
};

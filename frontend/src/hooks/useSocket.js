import { useEffect, useRef } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../services/socketService';
import { useAuthStore } from '../store/authStore';

/**
 * Connect socket when authenticated; disconnect on logout.
 * Must be called once at the app root.
 */
export const useSocketConnection = () => {
  const { isAuthenticated, accessToken } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connectSocket();
    } else {
      disconnectSocket();
    }
    return () => {};
  }, [isAuthenticated, accessToken]);
};

/**
 * Subscribe to a socket event while the component is mounted.
 * @param {string} event
 * @param {function} handler
 * @param {any[]} deps
 */
export const useSocketEvent = (event, handler, deps = []) => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const cb = (...args) => handlerRef.current(...args);
    socket.on(event, cb);
    return () => socket.off(event, cb);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]);
};

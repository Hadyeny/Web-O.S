import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Notification } from '../types';

let globalSocket: Socket | null = null;

function getSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io(window.location.origin, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return globalSocket;
}

export function useRealtime(userId?: string) {
  const queryClient = useQueryClient();
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    const socket = getSocket();

    const handleOSUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    };

    const handleNotification = (notif: Notification) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (notif.userId === 'all' || notif.userId === userIdRef.current) {
        if (notif.type === 'alert' || notif.type === 'warning') {
          toast(notif.message, { icon: '⚠️' });
        } else if (notif.type === 'success') {
          toast.success(notif.message);
        } else {
          toast(notif.message, { icon: 'ℹ️' });
        }
      }
    };

    socket.on('os_updated', handleOSUpdated);
    socket.on('notification', handleNotification);

    return () => {
      socket.off('os_updated', handleOSUpdated);
      socket.off('notification', handleNotification);
    };
  }, [queryClient]);

  return getSocket();
}

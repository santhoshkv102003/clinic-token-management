import { io, Socket } from 'socket.io-client';

const getSocketBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3000';
    }
  }
  return 'https://multi-clinic-token-management.onrender.com';
};

const BASE = getSocketBaseUrl();

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(BASE, { transports: ['websocket', 'polling'] });
  }
  return socket;
}

export function joinClinicRoom(clinicId: string) {
  getSocket().emit('join-clinic', clinicId);
}

export function leaveClinicRoom(clinicId: string) {
  getSocket().emit('leave-clinic', clinicId);
}

export function onQueueUpdate(handler: (data: any) => void) {
  getSocket().on('queue:update', handler);
  return () => getSocket().off('queue:update', handler);
}

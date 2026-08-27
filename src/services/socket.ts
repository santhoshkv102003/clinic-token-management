import { io, Socket } from 'socket.io-client';

const BASE = import.meta.env.VITE_API_BASE || (typeof window !== 'undefined' ? window.location.origin : '');

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

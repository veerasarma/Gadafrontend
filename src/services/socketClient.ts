import { io, Socket } from 'socket.io-client';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/';

export function connectSocket(token: string) {
  console.log(token,'connectSockettoken')
  const base = API_BASE_URL;
  const socket: Socket = io(base, {
    transports: ['websocket'],
    auth: { token },
    withCredentials: true
  });

socket.on('connect', () => console.log('[client] connected', socket.id));
socket.on('connect_error', (e) => console.warn('[client] connect_error', e));
socket.on('error', (e) => console.warn('[client] error', e));
socket.on('disconnect', (r) => console.warn('[client] disconnected', r));


  return socket;
}
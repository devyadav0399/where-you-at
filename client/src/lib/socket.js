import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(URL, { autoConnect: false });
  }
  return socket;
}

export function connectSocket() {
  getSocket().connect();
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
}

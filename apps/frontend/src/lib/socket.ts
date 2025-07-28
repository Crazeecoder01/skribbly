import { io, Socket } from 'socket.io-client';

const URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

let socket: Socket;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(URL, {
      transports: ['websocket'], 
    });
  }
  return socket;
};
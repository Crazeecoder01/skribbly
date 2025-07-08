'use client';

import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';

export default function TestSocketPage() {
  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      console.log('✅ Connected to socket:', socket.id);

      socket.emit('join-room', 'TEST123');
    });

    socket.on('user-joined', (data) => {
      console.log('👤 Another user joined:', data);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from socket');
    });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">Socket Test Page</h1>
      <p>Check the console to see Socket.IO events.</p>
    </div>
  );
}

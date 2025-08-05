'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import axios from 'axios';
import { getSocket } from '@/lib/socket';

export function useJoinRoomForm() {
  const [userName, setUserName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  const handleJoinRoom = async () => {
    setError('');
    if (joining) return;

    if (!userName.trim() || !roomCode.trim()) {
      setError('Please fill in both fields.');
      return;
    }

    setJoining(true);

    try {
      const trimmedCode = roomCode.trim().toUpperCase();

      const prevRoomData = localStorage.getItem('room');
      if (prevRoomData) {
        const prevRoom = JSON.parse(prevRoomData);
        if (prevRoom.code === trimmedCode) {
          setError('You cannot enter the room again.');
          return;
        }
      }

      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_SOCKET_URL}/api/rooms/join`,
        {
          userName,
          roomCode: trimmedCode,
          userId: null,
        }
      );

      const { room, user } = data;

      localStorage.setItem('room', JSON.stringify(room));
      localStorage.setItem('userId', user.id);

      const socket = getSocket();
      socket.emit('join-room', {
        roomCode: room.code,
        userId: user.id,
      });

      router.push(`/room/${room.code}`);
    } catch (err) {
      console.error(err);
      let message = 'Something went wrong.';
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        message = err.response.data.error;
      }
      setError(message);
    } finally {
      setJoining(false);
    }
  };

  return {
    userName,
    setUserName,
    roomCode,
    setRoomCode,
    joining,
    error,
    handleJoinRoom,
  };
}

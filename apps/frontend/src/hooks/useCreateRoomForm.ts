'use client';

import { useRouter } from 'next/navigation';
import {  useRef, useState } from 'react';
import axios from 'axios';
import { getSocket } from '@/lib/socket';

export function useCreateRoomForm() {
    const [creatorName, setCreatorName] = useState<string>('');
    const [maxParticipants, setMaxParticipants] = useState(8);
    const [rounds, setRounds] = useState(3);
    const clickSoundRef = useRef<HTMLAudioElement | null>(null);
    const [error, setError] = useState('');
    const router = useRouter();
    
    const handleCreateRoom = async () => {
    clickSoundRef.current?.play();
    setError('');

    if (!creatorName.trim()) {
      setError('Please enter your name.');
      return;
    }

    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_SOCKET_URL}/api/rooms/create`,
        {
          roomAdmin: creatorName,
          maxParticipants,
          rounds,
        }
      );

      const { room } = data;

      const socket = getSocket();
      socket.emit('join-room', room.code);

      localStorage.setItem('room', JSON.stringify(room));
      localStorage.setItem('userId', room.users[0].id);

      router.push(`/room/${room.code}`);
    } catch (err) {
      console.error(err);
      let message = 'Something went wrong.';
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        message = err.response.data.error;
      }
      setError(message);
    }
  };

  return {
    creatorName,
    setCreatorName,
    maxParticipants,
    setMaxParticipants,
    rounds,
    setRounds,
    error,
    handleCreateRoom,
  };

}

export default useCreateRoomForm 
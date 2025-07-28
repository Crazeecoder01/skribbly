'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import axios from 'axios';

export default function JoinRoomPage() {
  const [userName, setUserName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [joining, setJoining] = useState(false);

  const [error, setError] = useState('');
  const router = useRouter();

  const handleJoinRoom = async () => {
    setError('');
     if (joining) return; 
    setJoining(true);
    if (!userName.trim() || !roomCode.trim()) {
      setError('Please fill in both fields.');
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      const { data } = await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/rooms/join`, {
        userName,
        roomCode: roomCode.trim().toUpperCase(),
        userId : userId || null,
      });

      const { room, user } = data;
      console.log('Joined room:', room);
      console.log('User ID:', user.id);
      if (joining) return; 
      setJoining(true);

      const socket = getSocket();
     
   
      localStorage.setItem('room', JSON.stringify(room));
      localStorage.setItem('userId', user.id);

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
    }finally{
      setJoining(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-600 font-pressStart text-white px-4">
  <h1 className="text-3xl sm:text-4xl font-extrabold mb-10 tracking-wider animate-pulse drop-shadow-lg">
    🚪 Join a Room
  </h1>

  <input
    type="text"
    placeholder="🧑 Your Name"
    value={userName}
    onChange={(e) => setUserName(e.target.value)}
    className="bg-white text-black text-center p-4 rounded-xl w-72 mb-4 border-4 border-yellow-300 focus:outline-none focus:ring-4 focus:ring-yellow-200 text-lg shadow-md transition-all duration-300"
  />

  <input
    type="text"
    placeholder="🎯 Room Code"
    value={roomCode}
    onChange={(e) => setRoomCode(e.target.value)}
    className="bg-white text-black text-center p-4 rounded-xl w-72 mb-6 border-4 border-pink-300 uppercase focus:outline-none focus:ring-4 focus:ring-pink-200 text-lg shadow-md transition-all duration-300"
    maxLength={6}
    autoComplete="off"
  />

  <button
  onClick={handleJoinRoom}
  disabled={joining}
  className={`${
    joining ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
  } bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-3 rounded-xl text-lg shadow-md transition-transform duration-300`}
>
  🚀 {joining ? 'Joining...' : 'Join Room'}
</button>


  {error && (
    <p className="text-red-300 mt-6 font-bold animate-pulse text-sm sm:text-base">
      ⚠️ {error}
    </p>
  )}
</main>

  );
}

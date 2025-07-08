'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function Home() {
  const router = useRouter();
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    clickSoundRef.current = new Audio('/click.wav'); 
  }, []);

  const handleClick = (path: string) => {
    clickSoundRef.current?.play();
    setTimeout(() => router.push(path), 15);
  };

  return (
    <main
      className="flex flex-col items-center justify-center h-screen text-white font-pressStart relative overflow-hidden"
      style={{
        backgroundImage: "url('/image.jpg')", 
        backgroundSize: 'cover',
        backgroundRepeat: 'repeat',
        backgroundPosition: 'center',
      }}
    >
      <div className="bg-black bg-opacity-60 px-8 py-10 rounded-3xl shadow-xl text-center">
        <h1 className="text-3xl sm:text-5xl mb-10 drop-shadow-xl animate-bounce">
          🎨 Skribbly
        </h1>

        <div className="flex gap-6 justify-center flex-wrap">
          <button
            className="bg-blue-600 px-6 py-4 rounded-xl text-lg sm:text-xl font-bold shadow-md hover:scale-110 hover:bg-blue-700 hover:shadow-lg transition-all duration-300 border-4 border-white"
            onClick={() => handleClick('/create-room')}
          >
            🚀 Create Room
          </button>

          <button
            className="bg-green-600 px-6 py-4 rounded-xl text-lg sm:text-xl font-bold shadow-md hover:scale-110 hover:bg-green-700 hover:shadow-lg transition-all duration-300 border-4 border-white"
            onClick={() => handleClick('/join-room')}
          >
            🎯 Join Room
          </button>
        </div>

        <p className="mt-10 text-sm sm:text-lg animate-pulse">Get ready to draw, guess, and laugh! 🎉</p>
      </div>

      
    </main>
  );
}

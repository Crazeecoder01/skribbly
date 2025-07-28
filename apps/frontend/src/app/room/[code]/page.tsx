'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import CanvasBoard, { CanvasBoardRef } from '@/components/CanvasBoard';
import axios from 'axios';


interface User {
  id: string;
  name: string;
}

interface Room {
  id: string;
  code: string;
  users: User[];
  state: 'WAITING' | 'PLAYING' | 'ENDED';
  maxParticipants: number;
  createdBy: string;
}


export default function RoomPage() {

  const router = useRouter();
  const canvasRef = useRef<CanvasBoardRef>(null);
  
 
  const [room, setRoom] = useState<Room | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [wordChoices, setWordChoices] = useState<string[]>([]);
  const [wordLength, setWordLength] = useState<number | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [turnStarted, setTurnStarted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(70);
  const [guess, setGuess] = useState<string>('');
  const [scoreBoard, setScoreBoard] = useState<Record<string, number>>({});
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [finalScores, setFinalScores] = useState<Record<string, number>>({});
  const [chatMessages, setChatMessages] = useState<{
    userId: string;
    message: string;
    type: 'chat' | 'correct';
  }[]>([]);
  const [turnSummary, setTurnSummary] = useState<{
    word: string;
    correctGuessers: string[];
    drawerId: string;
  } | null>(null);
  const socket = useRef(getSocket());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const joinedRoomRef = useRef(false);
  const handleWordSelect = (word: string) => {
    setSelectedWord(word);
    socket.current.emit('word-chosen', {
      roomCode: room?.code,
      word,
    });
  };

  useEffect(() => {
    const storedRoom = localStorage.getItem('room');
    const storedUserId = localStorage.getItem('userId');
   
    if (!storedRoom || !storedUserId) {
      router.push('/');
      return;
    }

    const roomData: Room = JSON.parse(storedRoom);
    setRoom(roomData);
    setUsers(roomData.users);
    setUserId(storedUserId);
    if(drawerId == null){
      setDrawerId(roomData.users[0].id);
    }else{
      setDrawerId(drawerId);
    }
      
    const sock = socket.current;
    sock.on('chat-message', ({ userId, message }) => {
      setChatMessages((prev) => [
        ...prev,
        { userId, message, type: 'chat' }
      ]);
    });
   
    
    if (!joinedRoomRef.current && room?.code && userId) {
      socket.current.emit('join-room', {
        roomCode: room.code,
        userId
      });
      joinedRoomRef.current = true;
    }
   
    socket.current.on('room-updated', (updatedRoom: Room) => {
      setRoom(updatedRoom);
      setUsers(updatedRoom.users);
    });
    
    socket.current.on('correct-guess',({userId})=>{
     
        setChatMessages((prev) => [
          ...prev,
          {
            userId,
            message: "guessed the word correctly! 🎉",
            type: 'correct'
          }
        ]);
           
    })
    sock.on('game-ended', ({ scores }) => {
      setGameOver(true);
      setFinalScores(scores);
    });
    socket.current.on('all-guessed', () => {
      setTimeLeft(70);
      if (intervalRef.current) {

        clearInterval(intervalRef.current);
      }
    })
    socket.current.on('game-started', (updatedRoom: Room)=>{
      
      setGameStarted(true);
      localStorage.setItem('gameStarted', 'true');
      setRoom(updatedRoom);
      
    })
    socket.current.on('start-turn', ({ drawerId, wordChoices }) => {
      setDrawerId(drawerId);
      if (canvasRef.current) {
        canvasRef.current.clearCanvas();
      }
      setWordChoices(wordChoices);
      setSelectedWord(null);
      setTurnStarted(false);
    });

    socket.current.on('turn-started', ({ wordLength, drawerId }) => {
      setWordLength(wordLength);
      setDrawerId(drawerId);
      
      setTurnStarted(true);
      setTimeLeft(70);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });
    sock.on('receive-path', (pathData) => {

      if (canvasRef.current && 'path' in pathData) {
        canvasRef.current.addPath(pathData);
      }
    });
 
    sock.on('update-scores', ({scores})=>{
      setScoreBoard(scores);
    })
   
    sock.on('turn-ended',({word, correctGuessers, drawerId})=>{
      setTurnSummary({ word, correctGuessers, drawerId });
       setTimeout(() => {
        setTurnSummary(null);
      }, 5000);
    })
    return () => {
      sock.off('room-updated');
      sock.off('receive-path');
      sock.off('start-turn');
      sock.off('turn-started');
      sock.off('game-started');
      sock.off('correct-guess');
      sock.off('chat-message');
      sock.off('update-scores');
      sock.off('game-ended');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [router,userId]);
  
  if (!room || !userId || !drawerId){
    return (
      <main className="flex items-center justify-center h-screen bg-black text-white">
        <p>Loading room data...</p>
      </main>
    );
  }

  const handleLeaveRoom = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/rooms/leave`, {
        userId,
      });

      socket.current.emit('leave-room', { roomCode: room.code, userId });

      localStorage.removeItem('room');
      localStorage.removeItem('userId');
      router.push('/');
    } catch (err) {
      console.error('Failed to leave room', err);
      alert('Error leaving room. Please try again.');
    }
  }
  const isDrawer = userId === drawerId;

  return (
    <main className="flex flex-col items-center justify-start min-h-screen p-8 bg-gray-900 font-pressStart">
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-white tracking-widest text-center">
        Room Code: <span className="text-yellow-400">{room.code}</span>
      </h1>

      {/* 👥 Players List */}
      <section className="mb-6 w-full max-w-2xl">
        <h2 className="text-2xl text-white mb-4">👥 Players</h2>
        <ul className="bg-gray-800 rounded-2xl shadow-xl divide-y divide-gray-700">
          {users.map((user) => (
            <li
              key={user.id}
              className={`flex items-center gap-4 p-4 ${
                user.id === userId
                  ? 'bg-blue-700 text-white font-bold'
                  : 'text-gray-200'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-400 flex items-center justify-center font-extrabold text-black shadow-inner">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="truncate">{user.name}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 🏆 Scoreboard */}
      <section className="mb-8 w-full max-w-md">
        <h2 className="text-xl text-white mb-2">🏆 Scoreboard</h2>
        <ul className="bg-gray-800 text-white rounded-xl p-4 shadow space-y-2">
          {Object.entries(scoreBoard).map(([id, score]) => {
            const user = users.find((u) => u.id === id);
            return (
              <li key={id} className="flex justify-between">
                <span>{user?.name || 'Unknown'}</span>
                <span className="font-bold text-yellow-400">{score}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {!gameStarted ? (
        <div className="text-white flex flex-col items-center gap-6 animate-pulse">
          <p className="text-xl">⏳ Waiting for host to start the game...</p>
          {userId === room.createdBy && (
            <button
              onClick={() =>
                socket.current.emit('start-game', { roomCode: room.code })
              }
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl shadow-md text-lg transition-transform hover:scale-105"
            >
              🚀 Start Game
            </button>
          )}
        </div>
      ) : (
        <div className="w-full flex flex-col items-center gap-6">
          <h2 className="text-2xl text-white text-center">
            ✍️ Drawer:{' '}
            <span className="text-yellow-300 font-bold">
              {room.users.find((u) => u.id === drawerId)?.name}
            </span>
          </h2>

          {/* 🧠 Word Picker */}
          {!turnStarted && isDrawer && wordChoices.length > 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                🧠 Pick a word to draw:
              </h3>
              <div className="flex flex-wrap justify-center gap-4">
                {wordChoices.map((word) => (
                  <button
                    key={word}
                    onClick={() => handleWordSelect(word)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-md font-semibold transition-transform hover:scale-105"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Word (only for Drawer) */}
              {isDrawer && selectedWord && (
                <div className="bg-yellow-100 text-black p-3 rounded-xl font-semibold shadow text-lg">
                  Word: {selectedWord}
                </div>
              )}

              {/* Timer */}
              <div className="text-2xl font-semibold text-white">
                ⏱️ Time Left: <span className="text-yellow-400">{timeLeft}s</span>
              </div>

              {/* Canvas */}
              <CanvasBoard
                ref={canvasRef}
                isDrawer={isDrawer}
                onDraw={(pathData) => {
                  socket.current.emit('send-path', {
                    roomCode: room.code,
                    pathData,
                  });
                }}
               />


              {/* 💬 Chat & Guess Area */}
              {(
                <div className="w-full max-w-xl mt-6 flex flex-col gap-4">
                  {/* Message List */}
                  <div className="bg-gray-800 rounded-xl p-4 shadow-md h-60 overflow-y-auto">
                    {chatMessages.map((msg, idx) => (
                      <p
                        key={idx}
                        className={`text-sm mb-2 ${
                          msg.type === 'correct' ? 'text-green-400 font-bold' : 'text-white'
                        }`}
                      >
                        <strong>
                          {users.find((u) => u.id === msg.userId)?.name || 'Unknown'}:
                        </strong>{' '}
                        {msg.message}
                      </p>
                    ))}
                  </div>

                  {/* Input Box */}
                  {!isDrawer && (
                    <div className="flex gap-3">
                    <input
                      type="text"
                      value={guess}
                      onChange={(e) => setGuess(e.target.value)}
                      className="flex-grow p-3 rounded-lg border-2 border-gray-600 text-white bg-gray-700 placeholder-gray-400 shadow"
                      placeholder={`💬 Chat or guess the word (${wordLength ?? '_'})`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && guess.trim()) {
                          socket.current.emit('send-guess', {
                            roomCode: room.code,
                            guess,
                            userId,
                          });
                          setGuess('');
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (!guess.trim()) return;
                        socket.current?.emit('send-guess', {
                          roomCode: room.code,
                          guess,
                          userId,
                        });
                        setGuess('');
                      }}
                      className="px-5 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-bold transition-transform hover:scale-105 shadow"
                    >
                      🚀 Send
                    </button>
                  </div>
                  )}
                  
                </div>
              )}

            </>
          )}
        </div>
      )}

      {/* Modal: Turn Summary */}
      {turnSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center w-[90%] max-w-md animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🕹️ Turn Summary</h2>
            <p className="mb-2 text-lg">
              <strong>Drawer:</strong>{' '}
              <span className="text-blue-700">
                {users.find((u) => u.id === turnSummary.drawerId)?.name || 'Unknown'}
              </span>
            </p>
            <p className="mb-2 text-lg">
              <strong>Word:</strong>{' '}
              <span className="text-green-600">{turnSummary.word}</span>
            </p>
            <p className="mb-4 text-lg">
              <strong>Guessed By:</strong>{' '}
              {turnSummary.correctGuessers.length > 0 ? (
                <span className="text-purple-600 font-semibold">
                  {turnSummary.correctGuessers
                    .map((id) => users.find((u) => u.id === id)?.name || 'Unknown')
                    .join(', ')}
                </span>
              ) : (
                <span className="text-red-500 font-semibold">No one guessed it</span>
              )}
            </p>
            <p className="text-sm text-gray-500 italic">Next round starting...</p>
          </div>
        </div>
      )}
      {gameOver && (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">🎉 Game Over!</h2>
          <ul className="space-y-2 text-lg">
            {Object.entries(finalScores).map(([id, score]) => {
              const user = users.find(u => u.id === id);
              return (
                <li key={id} className="flex justify-between font-semibold">
                  <span>{user?.name || 'Unknown'}</span>
                  <span className="text-blue-600">{score}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-sm text-gray-500">Thanks for playing Skribbly!</p>
          <button 
            onClick={handleLeaveRoom}
            className="mt-4 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-transform hover:scale-105 shadow"
          >
            Leave Room
          </button>
        </div>
      </div>
    )}

    </main>
  );

}
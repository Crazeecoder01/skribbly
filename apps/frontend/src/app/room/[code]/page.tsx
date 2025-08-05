'use client';

import CanvasBoard, { CanvasBoardRef } from '@/components/canvas/CanvasBoard';
import { useEffect, useRef, useState } from 'react';
import { useRoom } from '../../../hooks/useRoom';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { SerializedPath } from '../../../components/canvas/CanvasBoard';
import PlayerList from '@/components/room/PlayerList';
import ScoreBoard from '@/components/room/ScoreBoard';
import WordSelector from '@/components/room/WordSelector';
import ChatMessages from '@/components/room/ChatMessages';
import TurnSummaryModal from '@/components/room/TurnSummaryModal';
import GameOverModal from '@/components/room/GameOverModal';

export default function RoomPage() {
  const {
    room,
    userId,
    users,
    drawerId,
    isDrawer,
    gameStarted,
    wordChoices,
    selectedWord,
    wordLength,
    turnStarted,
    timeLeft,
    chatMessages,
    scoreBoard,
    gameOver,
    finalScores,
    turnSummary,
    socket,
    handleWordSelect,
  } = useRoom();

  const router = useRouter();
  const canvasRef = useRef<CanvasBoardRef>(null);
  const [guess, setGuess] = useState('');

  // Sync drawing path to other players
  const handleDraw = (pathData: SerializedPath) => {
    socket.emit('send-path', {
      roomCode: room?.code,
      pathData,
    });
  };

  const handleLeaveRoom = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/rooms/leave`, {
        userId,
      });

      socket.emit('leave-room', { roomCode: room?.code, userId });
      localStorage.removeItem('room');
      localStorage.removeItem('userId');
      router.push('/');
    } catch (err) {
      console.error('Failed to leave room', err);
      alert('Error leaving room. Please try again.');
    }
  };

  useEffect(() => {
    socket.on('receive-path', (pathData) => {
      if (canvasRef.current && 'path' in pathData) {
        canvasRef.current.addPath(pathData);
      }
    });

    return () => {
      socket.off('receive-path');
    };
  }, [socket]);

  if (!room || !userId || !drawerId) {
    return (
      <main className="flex items-center justify-center h-screen bg-black text-white">
        <p>Loading room data...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-start min-h-screen p-8 bg-gray-900 font-pressStart">
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-white tracking-widest text-center">
        Room Code: <span className="text-yellow-400">{room.code}</span>
      </h1>

      {/* Players */}
      <PlayerList users={users} currentUserId={userId} />

      {/* Scoreboard */}
      <ScoreBoard users={users} scoreBoard={scoreBoard} />

      {!gameStarted ? (
        <div className="text-white flex flex-col items-center gap-6 animate-pulse">
          <p className="text-xl">⏳ Waiting for host to start the game...</p>
          {userId === room.createdBy && (
            <button
              onClick={() => socket.emit('start-game', { roomCode: room.code })}
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
              {users.find((u) => u.id === drawerId)?.name}
            </span>
          </h2>

          {!turnStarted && isDrawer && wordChoices.length > 0 ? (
            <WordSelector wordChoices={wordChoices} handleWordSelect={handleWordSelect} />
          ) : (
            <>
              {isDrawer && selectedWord && (
                <div className="bg-yellow-100 text-black p-3 rounded-xl font-semibold shadow text-lg">
                  Word: {selectedWord}
                </div>
              )}

              <div className="text-2xl font-semibold text-white">
                ⏱️ Time Left: <span className="text-yellow-400">{timeLeft}s</span>
              </div>

              <CanvasBoard ref={canvasRef} isDrawer={isDrawer} onDraw={handleDraw} />

              {/* Chat and Guess */}
              {(
                <div className="w-full max-w-xl mt-6 flex flex-col gap-4">
                  {/* Message List */}
                  <ChatMessages chatMessages={chatMessages} users={users} />

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
                          socket.emit('send-guess', {
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
                        socket.emit('send-guess', {
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

      {/* Turn Summary Modal */}
      {turnSummary && (
        <TurnSummaryModal turnSummary={turnSummary} users={users} />
      )}

      {/* Game Over Modal */}
      {gameOver && (
        <GameOverModal
          finalScores={finalScores}
          users={users}
          handleLeaveRoom={handleLeaveRoom}
        />
      )}
    </main>
  );
}

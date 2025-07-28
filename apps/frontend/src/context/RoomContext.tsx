'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';

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

interface ChatMessage {
  userId: string;
  message: string;
  type: 'chat' | 'correct';
}

interface TurnSummary {
  word: string;
  correctGuessers: string[];
  drawerId: string;
}

interface RoomContextType {
  socket: ReturnType<typeof getSocket>;
  room: Room | null;
  users: User[];
  userId: string | null;
  drawerId: string | null;
  gameStarted: boolean;
  wordChoices: string[];
  wordLength: number | null;
  selectedWord: string | null;
  turnStarted: boolean;
  timeLeft: number;
  guess: string;
  setGuess: React.Dispatch<React.SetStateAction<string>>;
  scoreBoard: Record<string, number>;
  gameOver: boolean;
  finalScores: Record<string, number>;
  chatMessages: ChatMessage[];
  turnSummary: TurnSummary | null;
  handleWordSelect: (w: string) => void;
}


const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) throw new Error('useRoom must be used within RoomProvider');
  return context;
};

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const socket = useRef(getSocket());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const joinedRoomRef = useRef(false);

  const [room, setRoom] = useState<Room | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [wordChoices, setWordChoices] = useState<string[]>([]);
  const [wordLength, setWordLength] = useState<number | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [turnStarted, setTurnStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(70);
  const [guess, setGuess] = useState('');
  const [scoreBoard, setScoreBoard] = useState<Record<string, number>>({});
  const [gameOver, setGameOver] = useState(false);
  const [finalScores, setFinalScores] = useState<Record<string, number>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [turnSummary, setTurnSummary] = useState<TurnSummary | null>(null);

  const handleWordSelect = (word: string) => {
    setSelectedWord(word);
    socket.current.emit('word-chosen', { roomCode: room?.code, word });
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
    setDrawerId((prev) => prev || roomData.users[0].id);

    const sock = socket.current;

    if (!joinedRoomRef.current && roomData.code && storedUserId) {
      sock.emit('join-room', {
        roomCode: roomData.code,
        userId: storedUserId,
      });
      joinedRoomRef.current = true;
    }

    sock.on('chat-message', ({ userId, message }) => {
      setChatMessages((prev) => [...prev, { userId, message, type: 'chat' }]);
    });

    sock.on('correct-guess', ({ userId }) => {
      const guesser = roomData.users.find((u) => u.id === userId);
      if (guesser) {
        setChatMessages((prev) => [
          ...prev,
          { userId, message: 'guessed the word correctly! 🎉', type: 'correct' },
        ]);
      }
    });

    sock.on('room-updated', (updatedRoom: Room) => {
      setRoom(updatedRoom);
      setUsers(updatedRoom.users);
    });

    sock.on('game-started', (updatedRoom: Room) => {
      setGameStarted(true);
      localStorage.setItem('gameStarted', 'true');
      setRoom(updatedRoom);
    });

    sock.on('start-turn', ({ drawerId, wordChoices }) => {
      setDrawerId(drawerId);
      setWordChoices(wordChoices);
      setSelectedWord(null);
      setTurnStarted(false);
    });

    sock.on('turn-started', ({ wordLength, drawerId }) => {
      setDrawerId(drawerId);
      setWordLength(wordLength);
      setTurnStarted(true);
      setTimeLeft(70);
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    sock.on('all-guessed', () => {
      setTimeLeft(70);
      if (intervalRef.current) clearInterval(intervalRef.current);
    });

    sock.on('update-scores', ({ scores }) => {
      setScoreBoard(scores);
    });

    sock.on('turn-ended', ({ word, correctGuessers, drawerId }) => {
      setTurnSummary({ word, correctGuessers, drawerId });
      setTimeout(() => setTurnSummary(null), 5000);
    });

    sock.on('game-ended', ({ scores }) => {
      setGameOver(true);
      setFinalScores(scores);
    });

    return () => {
      sock.off('chat-message');
      sock.off('correct-guess');
      sock.off('room-updated');
      sock.off('game-started');
      sock.off('start-turn');
      sock.off('turn-started');
      sock.off('all-guessed');
      sock.off('update-scores');
      sock.off('turn-ended');
      sock.off('game-ended');
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [router]);

  return (
    <RoomContext.Provider
      value={{
        socket: socket.current,
        room,
        users,
        userId,
        drawerId,
        gameStarted,
        wordChoices,
        wordLength,
        selectedWord,
        turnStarted,
        timeLeft,
        guess,
        setGuess,
        scoreBoard,
        gameOver,
        finalScores,
        chatMessages,
        turnSummary,
        handleWordSelect,
        // setSelectedWord,
        // setTimeLeft,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

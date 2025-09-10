'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';

export interface User {
  id: string;
  name: string;
}

export interface Room {
  id: string;
  code: string;
  users: User[];
  state: 'WAITING' | 'PLAYING' | 'ENDED';
  maxParticipants: number;
  createdBy: string;
}

export interface ChatMessage {
  userId: string;
  message: string;
  type: 'chat' | 'correct';
}

export interface TurnSummary {
  word: string;
  correctGuessers: string[];
  drawerId: string;
}

export function useRoom() {
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [scoreBoard, setScoreBoard] = useState<Record<string, number>>({});
  const [gameOver, setGameOver] = useState(false);
  const [finalScores, setFinalScores] = useState<Record<string, number>>({});
  const [turnSummary, setTurnSummary] = useState<TurnSummary | null>(null);

  const isDrawer = userId === drawerId;

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
    if (!drawerId) setDrawerId(roomData.users[0]?.id);

    const sock = socket.current;

    if (!joinedRoomRef.current && roomData.code && storedUserId) {
      sock.emit('join-room', {
        roomCode: roomData.code,
        userId: storedUserId,
      });
      joinedRoomRef.current = true;
    }

    sock.on('chat-message', ({ userId, message }) => {
      setChatMessages((prev) => [
        ...prev,
        { userId, message, type: 'chat' },
      ]);
    });
    sock.on('already-guessed', ({ message }) => {
      // console.log(`User ${userId} already guessed correctly!`);

      setChatMessages((prev) => [
        ...prev,
        { userId: "system", message, type: "chat" },
      ]);
    });
    sock.on('correct-guess', ({ userId }) => {
      // console.log(`User ${userId} guessed correctly!`);
      setChatMessages((prev) => [
        ...prev,
        {
          userId,
          message: 'guessed the word correctly! 🎉',
          type: 'correct',
        },
      ]);
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
      setWordLength(wordLength);
      setDrawerId(drawerId);
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

    sock.on('game-ended', ({ scores }) => {
      setGameOver(true);
      setFinalScores(scores);
    });

    sock.on('turn-ended', ({ word, correctGuessers, drawerId }) => {
      setTurnSummary({ word, correctGuessers, drawerId });
      setTimeout(() => {
        setTurnSummary(null);
      }, 5000);
    });

    sock.on('update-scores', ({ scores }) => {
      setScoreBoard(scores);
    });

    return () => {
      sock.off('chat-message');
      sock.off('correct-guess');
      sock.off('room-updated');
      sock.off('game-started');
      sock.off('start-turn');
      sock.off('turn-started');
      sock.off('all-guessed');
      sock.off('game-ended');
      sock.off('turn-ended');
      sock.off('update-scores');
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [router]);

  return {
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
    socket: socket.current,
    handleWordSelect,
  };
}

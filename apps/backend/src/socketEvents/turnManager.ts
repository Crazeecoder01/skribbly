import { Server } from 'socket.io';
import {prisma} from '../lib/prisma';
import { wordList } from '../data/wordList';

const roomTurnData: Record<string, {
  currentDrawerIndex: number;
  userIds: string[];
  scores: Record<string, number>;
  chosenWord?: string;
  correctGuessers: string[];
  round: number;
  totalRounds: number;
  turnCount: number;
  timeout?: NodeJS.Timeout;
}> = {};
export const startTurnCycle = async (io: Server, roomCode: string) => {
    const room = await prisma.room.findUnique({
        where:{code: roomCode},
        include:{users:true}
    })

    if(!room || room.users.length === 0) {
        console.error(`Room with code ${roomCode} not found or has no users.`);
        return;
    }

    const userIds = room.users.map((u:{id:string})=>u.id);

    roomTurnData[roomCode] = {
        currentDrawerIndex  : 0,
        userIds,
        correctGuessers: [],
        scores: userIds.reduce((acc:Record<string, number>, id:string)=>{
          acc[id] = 0;
          return acc;
        },{} as Record<string, number>),
        round: 1,
        totalRounds: room.rounds,
        turnCount: 0
    }

    initiateTurn(io, roomCode);

};

export const initiateTurn = (io:Server, roomCode: string)=>{
    const data = roomTurnData[roomCode];

    if(!data)return;

    const drawerId = data.userIds[data.currentDrawerIndex];

    const wordChoices =  pickRandomWords();

    io.to(roomCode).emit('start-turn', {
        drawerId,
        wordChoices
    })
}

export const handleWordChosen = (io:Server, roomCode:string, word:string)=>{
    const data = roomTurnData[roomCode];
    if (!data) return;
    data.chosenWord = word;
    io.to(roomCode).emit('turn-started', {
        wordLength: word.length,
        drawerId: data.userIds[data.currentDrawerIndex],
    });

    data.timeout = setTimeout(() => {
        proceedToNextTurn(io, roomCode);
    }, 70000);
}
export const handleGuessSubmission = (io:Server, roomCode:string, guess:string, userId:string)=>{
      const data = roomTurnData[roomCode];
      if (!guess || typeof guess !== 'string' || guess.trim() === '') return;

  
      if(!data) return;
      // if (userId === data.userIds[data.currentDrawerIndex]) return;

      if(data.chosenWord?.toLowerCase() === guess.trim().toLowerCase()){
        if(!data.correctGuessers.includes(userId)){
          data.correctGuessers.push(userId);
        }
        if (!data.scores[userId]) data.scores[userId] = 0;
        
        data.scores[userId] += (data.userIds.length * 50 - (data.correctGuessers.length * 10));
        const drawerId  = data.userIds[data.currentDrawerIndex];
        if (!data.scores[drawerId]) data.scores[drawerId] = 0;
        data.scores[drawerId] += 150;

        io.to(roomCode).emit('update-scores',{
          scores: data.scores
        })
        
        io.to(roomCode).emit('correct-guess', {userId});
        
        if(data.correctGuessers.length === data.userIds.length - 1){
          if(data.timeout) clearTimeout(data.timeout);
          io.to(roomCode).emit('all-guessed');
          
          proceedToNextTurn(io, roomCode);  
        }
      }
      else{
        io.to(roomCode).emit('chat-message', { userId, message: guess });
      }
}
export const proceedToNextTurn = (io:Server, roomCode:string)=>{
    const data = roomTurnData[roomCode];
    if(!data)return;

    if(data.timeout)clearTimeout(data.timeout);
    data.turnCount += 1;

    const totalTurns = data.userIds.length * data.totalRounds;
    if (data.turnCount >= totalTurns) {
      io.to(roomCode).emit('game-ended', {
        scores: data.scores,
      });
      delete roomTurnData[roomCode];
      return;
    }
    
    io.to(roomCode).emit('turn-ended', {
      word: data.chosenWord,
      correctGuessers: data.correctGuessers,
      drawerId: data.userIds[data.currentDrawerIndex],
    })
    data.correctGuessers = [];
    data.currentDrawerIndex = (data.currentDrawerIndex + 1) % data.userIds.length;
    if(data.currentDrawerIndex === 0){
      data.round += 1;
    }
    data.chosenWord = undefined;
    initiateTurn(io, roomCode);
}

const pickRandomWords = (): string[] => {
  const selected = new Set<string>();
  while (selected.size < 3) {
    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
    selected.add(randomWord);
  }
  return [...selected];
};
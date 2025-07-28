import os from 'os';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import roomRoutes from './routes/room';
import { Server } from "socket.io";
import http from 'http';
import { emitRoomUpdate } from './socketEvents/room';
import { handleGuessSubmission, handleWordChosen, proceedToNextTurn, startTurnCycle } from './socketEvents/turnManager';
import { setupSocketRedisAdapter } from './lib/setupSocketRedisAdapter';
dotenv.config();


let containerId = os.hostname();


export const app = express();
const PORT = process.env.PORT || 4000;
const httpServer = http.createServer(app);
app.get('/ping', (req, res) => {
  res.send(`[${containerId}] Pong!`);
});
const io = new Server(httpServer,{
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
setupSocketRedisAdapter(io).then(()=>{
  console.log("✅ Redis adapter connected");
}).catch((err)=>{
  console.error(' ❌ Error connecting with Redis adapter:', err);
})
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());


app.use('/api/rooms', roomRoutes);

// Map to track which socket is in which room
const socketRoomMap = new Map<string, string>();


io.on('connection',(socket)=>{
  console.log(`[${containerId}] WebSocket connection: ${socket.id}`);
  // console.log(`Sockets connected: ${socket.id}`);
  socket.on('join-room', async ({ roomCode, userId }) => {
    if (!roomCode) {
      console.warn(`Socket ${socket.id} tried to join without roomCode`);
      return;
    }
    socket.data.userId = userId;
    socket.data.roomCode = roomCode;
    socket.join(roomCode);
    // socketRoomMap.set(socket.id, roomCode);
    console.log(`✅ User ${userId} joined room ${roomCode}`);
    await emitRoomUpdate(io, roomCode); 
  });
  socket.on('send-path', ({ roomCode, pathData }) => {
    if (!roomCode || !pathData) {
      console.warn('Invalid drawing payload');
      return;
    }
    socket.to(roomCode).emit('receive-path', pathData);
  });
  socket.on('start-game', async ({roomCode})=>{
    if (!roomCode) {
      console.warn(`Socket ${socket.id} tried to start game without roomCode`);
      return;
    }
    const updatedRoom = await emitRoomUpdate(io, roomCode);
    
    io.to(roomCode).emit('game-started', updatedRoom);
    await startTurnCycle(io, roomCode);
    
  })
  socket.on('word-chosen', ({ roomCode, word }) => {
    if (!roomCode || !word) return;

    handleWordChosen(io, roomCode, word);
  });

  socket.on('send-guess', async ({roomCode, guess, userId})=>{
    await handleGuessSubmission(io, roomCode, guess, userId);

  })
  
  socket.on('leave-room', async ({ roomCode, userId }) => {
    try {
      socket.leave(roomCode);
      // console.log(`User ${userId} left room ${roomCode}`);

      socketRoomMap.delete(socket.id);

      await emitRoomUpdate(io, roomCode);

      io.to(roomCode).emit('chat-message', {
        userId: 'system',
        message: `👋 ${userId} has left the room.`,
      });
    } catch (error) {
      console.error(`[leave-room error]:`, error);
    }
  });


  socket.on('disconnect', () => {
    // console.log(`User disconnected: ${socket.id}`);
    const roomCode = socketRoomMap.get(socket.id);
    if (roomCode) {
      socketRoomMap.delete(socket.id);
      socket.emit(`User ${socket.id} left room ${roomCode}`);
    }
  });
})
 
httpServer.listen(4000,'0.0.0.0', () => {
  console.log(`✅ Backend server running at http://0.0.0.0:4000`);
});
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import roomRoutes from './routes/room';
import { Server } from "socket.io";
import http from 'http';
import { emitRoomUpdate } from './socketEvents/room';
import { handleGuessSubmission, handleWordChosen, proceedToNextTurn, startTurnCycle } from './socketEvents/turnManager';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const httpServer = http.createServer(app);

const io = new Server(httpServer,{
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());


app.use('/api/rooms', roomRoutes);
const socketRoomMap = new Map<string, string>();
io.on('connection',(socket)=>{
  console.log(`User connected: ${socket.id}`);
  socket.on('join-room', async ({ roomCode }) => {
    if (!roomCode) {
      console.warn(`Socket ${socket.id} tried to join without roomCode`);
      return;
    }
    socket.join(roomCode);
    socketRoomMap.set(socket.id, roomCode);
    // socket.emit('joined-room', { roomCode });
    await emitRoomUpdate(io, roomCode); 
  });
  socket.on('send-path', ({ roomCode, pathData }) => {
    if (!roomCode || !pathData?.path) {
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
    // console.log("step2")
    await handleGuessSubmission(io, roomCode, guess, userId);

  })
  socket.on('disconnect', () => {
    // console.log(`User disconnected: ${socket.id}`);
    const roomCode = socketRoomMap.get(socket.id);
    if (roomCode) {
      socketRoomMap.delete(socket.id);
      socket.emit(`User ${socket.id} left room ${roomCode}`);
    }
  });
})
 
httpServer.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
});
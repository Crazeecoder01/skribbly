import {prisma} from '../lib/prisma';
import { Server } from 'socket.io';

export const emitRoomUpdate = async (io: Server, roomCode: string) => {
  const updatedRoom = await prisma.room.findUnique({
    where: { code: roomCode },
    include: { users: true },
  });

  if (updatedRoom) {
    io.to(roomCode).emit('room-updated', updatedRoom);
  }

  return updatedRoom;
};

import { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { generateRoomCode } from '../utils/generateRoomCode';

export const createRoom:RequestHandler = async(req, res)=>{
    try{
        const {roomAdmin, maxParticipants, rounds} = req.body; 

        if(!roomAdmin || typeof roomAdmin !== 'string') {
             res.status(400).json({ error: 'Room admin is required  and must be a string.' });
        }
        const roomSize = typeof maxParticipants === 'number' && maxParticipants > 1 && maxParticipants <= 8
        ? maxParticipants
        : 5;
        const user = await prisma.user.create({
            data: {
                name: roomAdmin
            }
        });
        const numberOfRounds = Number(rounds);
        if (!numberOfRounds || numberOfRounds < 1 || numberOfRounds > 10) {
            return res.status(400).json({ error: 'Rounds must be between 1 and 10' });
        }
        const code = generateRoomCode();

        const room = await prisma.room.create({
            data:{
                code,
                createdBy: user.id,
                maxParticipants: roomSize,
                rounds: numberOfRounds || 3, 
                users:{
                    connect: {id: user.id}
                }
            },
            include:{
                users: true
            }
        })
         res.status(201).json({ room });
    }
    catch (err) {
        console.error('[Create Room Error]:', err);
         res.status(500).json({ error: 'Internal server error' });
    }
}

export const joinRoom: RequestHandler = async(req, res)=>{
    try{
        const { userName, roomCode, userId } = req.body;
        
        if(userId){
            return;
        }
        if (!userName || typeof userName !== 'string' || !roomCode || typeof roomCode !== 'string') {
            res.status(400).json({ error: 'userName and roomCode are required and must be strings.' });
            return
        }
        
        const room = await prisma.room.findUnique({
            where: { code: roomCode },
            include: { users: true }
        });
        if (!room) {
            res.status(404).json({ error: 'Room not found' });
            return;
        } 
        if (room.users.length >= room.maxParticipants) {
             res.status(403).json({ error: 'Room is full' });
             return 
        }
        if (room.state !== 'WAITING') {
            res.json({error:'Game has already started'});
            return;
        }
        const alreadyInRoom = room.users.some((user: { id: string }) => user.id === userId);
        if (alreadyInRoom) {
            console.log(`[${userName}] is already in room ${roomCode}`);
            return;
        }
        const user = await prisma.user.create({
            data: {
                name: userName,
            }
        });
        const isAlreadyJoined = room.users.some((u:{id: string}) => u.id === user.id);
        if(!isAlreadyJoined){
            await prisma.room.update({
                where: { id: room.id },
                data: {
                    users: {
                        connect: { id: user.id }
                    }
                }
            });
        }
       
        
     
        res.status(200).json({
            message: 'User joined the room successfully',
            room: {
                id: room.id,
                code: room.code,
                users: [...room.users, user]
            },
            user: user
        });
        
    }
    catch(err){
        console.error('[Join Room Error]:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const startGame: RequestHandler = async (req, res) => {
    try{
        const { userName, roomCode, user } = req.body;
        if (!userName || typeof userName !== 'string' || !roomCode || typeof roomCode !== 'string') {
            res.status(400).json({ error: 'userName and roomCode are required and must be strings.' });
            return
        }
        
        const room = await prisma.room.findUnique({
            where: { code: roomCode },
            include: { users: true }
        });
        if (!room) {
            res.status(404).json({ error: 'Room not found' });
            return;
        } 

        if (room.createdBy !== user.id) {
            res.json({error:'Only the host can start the game'});
            return;
        }

        await prisma.room.update({
            where: { code: roomCode },
            data: { state: 'PLAYING' },
        });

         res.status(200).json({
            message: 'Game started successfully',
            room: {
                id: room.id,
                code: room.code,
                users: room.users
            },
        });
    }catch(err){
         console.error('[Start Game Error]:', err);
        res.status(500).json({ error: 'Internal server error' });
    
    }
}

export const leaveRoom: RequestHandler = async (req, res) => {
  const { userId } = req.body;
  try {
    await prisma.user.delete({ where: { id: userId } });
    res.status(200).json({ message: 'Left room successfully' });
  } catch (err) {
    console.error('[leaveRoom error]', err);
    res.status(500).json({ error: 'Could not leave room' });
  }
};

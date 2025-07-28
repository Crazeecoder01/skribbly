import request from 'supertest';
import express from 'express'
import { prisma } from '../lib/prisma';
import router from '../routes/room';



const app = express();
app.use(express.json());
app.use('/api/rooms', router);

describe('POST /api/rooms/create',()=>{
    it('should create a room and return its code and user', async () => {
        const response = await request(app)
        .post('/api/rooms/create')
        .send({ userName: 'TestUser', maxParticipants: 8 });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('room.code');
        expect(response.body).toHaveProperty('user.id');
        expect(response.body.room.maxParticipants).toBe(8);
        expect(response.body.user.name).toBe('TestUser');
    });

    it('should return 400 for missing userName', async()=>{
        const response = await request(app)
        .post('/api/rooms/create')
        .send({ maxParticipants: 8 });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });
})
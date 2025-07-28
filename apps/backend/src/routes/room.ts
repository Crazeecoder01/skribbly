import express from 'express';
import { createRoom, joinRoom, leaveRoom, startGame } from '../controllers/roomController';
import { roomApiLimiter } from '../middlewares/rateLimiter';

const router  = express.Router();

router.post('/create',roomApiLimiter, createRoom);
router.post('/join',roomApiLimiter, joinRoom);
router.post('/start',startGame);
router.post('/leave', leaveRoom);
export default router;
import express from 'express';
import { createRoom, joinRoom, startGame } from '../controllers/roomController';

const router  = express.Router();

router.post('/create', createRoom);
router.post('/join', joinRoom);
router.post('/start',startGame);
export default router;
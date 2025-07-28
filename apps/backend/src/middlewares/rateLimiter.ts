import rateLimit from 'express-rate-limit';

export const roomApiLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 10,             
  standardHeaders: true,
  legacyHeaders: false,
  message: '🚫 Too many requests. Please slow down.',
});

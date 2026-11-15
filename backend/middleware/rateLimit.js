import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../config/redis.js';

let limiter = null;

// Builds the limiter the first time a request needs it.
// By then, index.js has already connected to Redis.
function getLimiter() {
    if (!limiter) {
        limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            limit: 10,
            standardHeaders: 'draft-7',
            legacyHeaders: false,
            message: { message: 'Too many attempts. Please try again in 15 minutes.' },
            store: new RedisStore({
                sendCommand: (...args) => redis.sendCommand(args),
                prefix: 'rl:auth:',
            }),
        });
    }
    return limiter;
}

// Middleware used in the routes. It passes each request to the real limiter.
export const authLimiter = (req, res, next) => getLimiter()(req, res, next);
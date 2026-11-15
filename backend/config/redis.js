import { createClient } from 'redis';

// One shared connection for the whole server process
export const redis = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redis.on('error', (err) => console.error('Redis error:', err.message));

export async function connectRedis() {
    await redis.connect();
    console.log('Connected to Redis');
}
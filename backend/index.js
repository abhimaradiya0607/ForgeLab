import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import { connectDB } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { rebuildTrending } from './services/trending.js';
import mainRouter from './routes/main.router.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/', mainRouter);

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
    socket.on('joinRoom', (userID) => {
        console.log(`User ${userID} joined the room`);
        socket.join(userID);
    });
});

async function startServer() {
    try {
        await connectDB();
        await connectRedis();

        const count = await rebuildTrending();
        console.log(`Trending ranking loaded with ${count} public repo(s)`);
    } catch (err) {
        console.error('Startup failed:', err.message);
        process.exit(1);
    }

    httpServer.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

startServer();
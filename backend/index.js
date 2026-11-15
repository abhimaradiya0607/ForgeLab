import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { loadEnv } from './config/load-env.js';
import { connectDB } from './config/db.js';
import { initRepo } from './controllers/init.js';
import { addRepo } from './controllers/add.js';
import { commitRepo } from './controllers/commit.js';
import { pushRepo } from './controllers/push.js';
import { pullRepo } from './controllers/pull.js';
import { revertRepo } from './controllers/revert.js';
import { browseRepo } from './controllers/browse.js';
import mainRouter from './routes/main.router.js';
import { connectRedis } from './config/redis.js';

loadEnv();

async function startServer(){
    const app = express();
    const port=process.env.PORT || 3000;

    
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

    try {
        await connectDB();
        await connectRedis();
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err.message);
        process.exit(1);
    }

    httpServer.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

yargs(hideBin(process.argv))
.command("start","Start a server",{},startServer)
.command("init <repoId>", "Link this folder to a ForgeLab repo",
    (yargs) => {
        yargs.positional("repoId", {
            describe: "Repo ID from the ForgeLab website",
            type: "string",
        });
    },
    (argv) => {
        initRepo(argv.repoId);
    })
.command("add <file>","Add a file to the repository",
    (yargs)=>{yargs.positional("file",{
        describe:"File to add to staging area",
        type:"string",
    })
    },
    (argv)=>{
        addRepo(argv.file);
    })
.command("commit <message>",
    "Commit to staged files",
    (yargs)=>{yargs.positional("message",{
        describe:"Commit Message",
        type:"string",
    })
    },
    (argv)=>{
        commitRepo(argv.message);
    })
.command("push",
    "Push commits to S3",
    {},
    pushRepo)
.command("pull","Pulled commits from S3",{},pullRepo)
.command("revert <commitID>",
    "Revert to a specific commit",
    (yargs)=>{
        yargs.positional("commitID",{
            describe:"Commit ID to revert to",
            type:"string"
        });
}, (argv)=>{
        revertRepo(argv.commitID);
    })
    .command(
        'browse [file]',
        'Show the latest code for this repo from the website',
        (yargs) => {
            yargs.positional('file', {
                describe: 'File path to view, such as src/app.js',
                type: 'string',
            });
        },
        (argv) => browseRepo(argv.file)
    )
.demandCommand(1,'You need atleast one command')
.help().argv;


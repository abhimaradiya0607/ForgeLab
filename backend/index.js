import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import http from 'http';
import { Server } from 'socket.io';

import { loadEnv } from './config/load-env.js';
loadEnv();

import yargs from 'yargs';
import {hideBin} from 'yargs/helpers'
import { initRepo } from './controllers/init.js';
import { addRepo } from './controllers/add.js';
import { commitRepo } from './controllers/commit.js';
import { pushRepo } from './controllers/push.js';
import { pullRepo } from './controllers/pull.js';
import { revertRepo } from './controllers/revert.js';
import mainRouter from './routes/main.router.js';

dotenv.config();


yargs(hideBin(process.argv))
.command("start","Start a server",{},startServer)
.command("init","Initialize a Git repo",{},initRepo)
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
.demandCommand(1,'You need atleast one command')
.help().argv;

function startServer(){
    const app = express();
    const port=process.env.PORT || 3000;

    
    app.use(bodyParser.json());
    app.use(express.json());

    const mongoURI = process.env.MONGODB_URI;

    mongoose.connect(mongoURI).then(()=>{
        console.log("Connected to MongoDB");
    }).catch((err)=>{
        console.error("Error connecting to MongoDB", err);
    })

    app.use(cors({origin:'*'}));

    app.use('/',mainRouter);

    const httpServer = http.createServer(app);

    const io=new Server(httpServer,{
        cors:{
            origin:'*',
            methods:['GET','POST'],
            credentials:true,
        },
    });

    io.on('connection',(socket)=>{
        socket.on("joinRoom",(userID)=>{
            user=userID;
            console.log("================================================");
            console.log(`User ${userID} joined the room`);
            console.log("================================================");
            socket.join(userID);
        });
    });

    const db=mongoose.connection;

    db.once("open",async ()=>{
    console.log("CRUD Operations can be performed now");
    /* CRUD Operations */
    });
    
    httpServer.listen(port,()=>{
        console.log(`Server is running on port ${port}`);
    });
}

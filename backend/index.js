import yargs from 'yargs';
import {hideBin} from 'yargs/helpers'
import { initRepo } from './controllers/init.js';
import { addRepo } from './controllers/add.js';
import { commitRepo } from './controllers/commit.js';
import { pushrepo } from './controllers/push.js';
import { pullRepo } from './controllers/pull.js';

yargs(hideBin(process.argv))
.command("init",
    "Initialize a Git repo",
    {},
    initRepo)
.command("add <file>",
    "Add a file to the repository",
    (yargs)=>{yargs.positional("file",{
        describe:"File to add to staging area",
        type:"string",
    });
    },addRepo)
.command("commit <message>",
    "Commit to staged files",
    (yargs)=>{yargs.positional("message",{
        describe:"Commit Message",
        type:"string",
    });
    },commitRepo)
.command("push","Push commits to S3",{},pushrepo)
.command("pull","Pulled commits from S3",{},pullRepo)
.demandCommand(1,'You need atleast one command')
.help().argv;

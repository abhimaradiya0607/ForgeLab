#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { run } from './src/lib/run.js';
import { login, logout, whoami } from './src/commands/auth.js';
import { init } from './src/commands/init.js';
import { add } from './src/commands/add.js';
import { commit } from './src/commands/commit.js';
import { push } from './src/commands/push.js';
import { pull } from './src/commands/pull.js';
import { revert } from './src/commands/revert.js';
import { browse } from './src/commands/browse.js';

await yargs(hideBin(process.argv))
    .command('login', 'Save your API token', {}, run(login))
    .command('logout', 'Remove the saved token', {}, run(logout))
    .command('whoami', 'Check that the saved token works', {}, run(whoami))
    .command(
        'init <repoId>',
        'Link this folder to a ForgeLab repository',
        (y) => y.positional('repoId', { type: 'string' }),
        run((argv) => init(argv.repoId))
    )
    .command(
        'add <file>',
        'Stage a file for the next commit',
        (y) => y.positional('file', { type: 'string' }),
        run((argv) => add(argv.file))
    )
    .command(
        'commit <message>',
        'Save staged files as a commit',
        (y) => y.positional('message', { type: 'string' }),
        run((argv) => commit(argv.message))
    )
    .command('push', 'Upload new commits to ForgeLab', {}, run(push))
    .command('pull', 'Download commit history', {}, run(pull))
    .command(
        'revert <commitId>',
        'Copy files from an older commit into this folder',
        (y) => y.positional('commitId', { type: 'string' }),
        run((argv) => revert(argv.commitId))
    )
    .command(
        'browse [file]',
        'View the latest code from the server',
        (y) => y.positional('file', { type: 'string' }),
        run((argv) => browse(argv.file))
    )
    .demandCommand(1, 'Run forgelab --help to see commands')
    .strict()
    .help()
    .parseAsync();

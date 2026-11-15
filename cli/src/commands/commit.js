import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { listFiles } from '../lib/files.js';

export async function commit(message) {
    const cwd = process.cwd();
    const stagePath = path.join(cwd, '.ForgeLab', 'staging');

    const files = await listFiles(stagePath).catch(() => []);
    if (files.length === 0) {
        throw new Error('Nothing staged. Use: forgelab add <file>');
    }

    const commitId = crypto.randomUUID();
    const commitDir = path.join(cwd, '.ForgeLab', 'commits', commitId);

    for (const rel of files) {
        const dest = path.join(commitDir, rel);
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.copyFile(path.join(stagePath, rel), dest);
    }

    await fs.writeFile(
        path.join(commitDir, 'commit.json'),
        JSON.stringify({ message, date: new Date().toISOString(), files }, null, 2)
    );

    await fs.rm(stagePath, { recursive: true, force: true });
    console.log(`Commit ${commitId} created with ${files.length} file(s): ${message}`);
}

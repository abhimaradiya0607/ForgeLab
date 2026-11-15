import fs from 'node:fs/promises';
import path from 'node:path';
import { listFiles } from '../lib/files.js';

export async function revert(commitId) {
    const cwd = process.cwd();
    const commitDir = path.join(cwd, '.ForgeLab', 'commits', commitId);

    const files = await listFiles(commitDir).catch(() => {
        throw new Error(`Commit ${commitId} not found locally. Run forgelab pull first.`);
    });

    for (const rel of files) {
        if (rel === 'commit.json') continue;
        const dest = path.join(cwd, rel);
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.copyFile(path.join(commitDir, rel), dest);
    }

    console.log(`Reverted files to commit ${commitId}. Run add, commit, and push to publish.`);
}

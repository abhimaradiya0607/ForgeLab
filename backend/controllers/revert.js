import fs from 'node:fs/promises';
import path from 'node:path';
import { listFiles } from './utils/files.js';

export async function revertRepo(commitID) {
    if (!commitID) {
        console.error('Unable to revert: commit ID is required');
        return;
    }

    const commitDir = path.resolve(process.cwd(), '.ForgeLab', 'commits', commitID);

    try {
        const files = await listFiles(commitDir);

        for (const rel of files) {
            if (rel === 'commit.json') continue;

            const dest = path.join(process.cwd(), rel);
            await fs.mkdir(path.dirname(dest), { recursive: true });
            await fs.copyFile(path.join(commitDir, rel), dest);
        }

        console.log(`Reverted to commit ${commitID}`);
    } catch (err) {
        console.error('Unable to revert:', err.message);
    }
}
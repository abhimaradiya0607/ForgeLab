import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { listFiles } from './utils/files.js';

export async function commitRepo(message) {
    if (!message) {
        console.error('Usage: forgelab commit "your message"');
        return;
    }

    const repoPath = path.resolve(process.cwd(), '.ForgeLab');
    const stagePath = path.join(repoPath, 'staging');
    const commitsPath = path.join(repoPath, 'commits');

    try {
        let files = [];
        try {
            files = await listFiles(stagePath);
        } catch {
            // No staging folder yet, handled below
        }

        if (files.length === 0) {
            console.log('Nothing staged. Use: forgelab add <file>');
            return;
        }

        const commitId = uuidv4();
        const commitDir = path.join(commitsPath, commitId);

        for (const rel of files) {
            const dest = path.join(commitDir, rel);
            await fs.mkdir(path.dirname(dest), { recursive: true });
            await fs.copyFile(path.join(stagePath, rel), dest);
        }

        await fs.writeFile(
            path.join(commitDir, 'commit.json'),
            JSON.stringify({ message, date: new Date().toISOString(), files }, null, 2)
        );

        // Clear staging so the next commit only includes new changes
        await fs.rm(stagePath, { recursive: true, force: true });

        console.log(`Commit ${commitId} created with ${files.length} file(s): ${message}`);
    } catch (err) {
        console.error('Error creating commit:', err.message);
    }
}
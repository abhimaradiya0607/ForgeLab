import fs from 'node:fs/promises';
import path from 'node:path';

export async function initRepo(repoId) {
    if (!repoId) {
        console.error('Usage: forgelab init <repoId>');
        return;
    }

    const repoPath = path.resolve(process.cwd(), '.ForgeLab');

    try {
        await fs.mkdir(path.join(repoPath, 'commits'), { recursive: true });

        await fs.writeFile(
            path.join(repoPath, 'config.json'),
            JSON.stringify({ repoId }, null, 2)
        );

        console.log(`Repository initialized. Linked to repo ${repoId}`);
    } catch (err) {
        console.error('Error initializing repo:', err.message);
    }
}
import fs from 'node:fs/promises';
import path from 'node:path';

// Returns every file under a folder as a relative path using forward slashes
export async function listFiles(dir, root = dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const full = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...(await listFiles(full, root)));
        } else {
            files.push(path.relative(root, full).split(path.sep).join('/'));
        }
    }

    return files;
}

// Reads .ForgeLab/config.json and checks that it has a repo ID
export async function readRepoConfig() {
    const file = path.resolve(process.cwd(), '.ForgeLab', 'config.json');

    let raw;
    try {
        raw = await fs.readFile(file, 'utf8');
    } catch {
        throw new Error('This folder is not a ForgeLab repo. Run: forgelab init <repoId>');
    }

    const config = JSON.parse(raw);

    if (!config.repoId) {
        throw new Error('config.json has no repoId. Run: forgelab init <repoId>');
    }

    return config;
}
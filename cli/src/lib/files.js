import fs from 'node:fs/promises';
import path from 'node:path';

// Returns every file under a folder, as paths relative to the root, with forward slashes
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

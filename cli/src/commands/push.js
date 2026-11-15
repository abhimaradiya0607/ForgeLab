import fs from 'node:fs/promises';
import path from 'node:path';
import { api } from '../lib/api.js';
import { readRepoConfig, requireToken } from '../lib/config.js';
import { listFiles } from '../lib/files.js';

async function readMeta(commitDir) {
    const meta = JSON.parse(await fs.readFile(path.join(commitDir, 'commit.json'), 'utf8'));
    // Older commits didn't store a file list, so read the folder instead
    if (!meta.files) {
        meta.files = (await listFiles(commitDir)).filter((f) => f !== 'commit.json');
    }
    return meta;
}

export async function push() {
    const { repoId } = await readRepoConfig();
    const token = await requireToken();
    const commitsDir = path.join(process.cwd(), '.ForgeLab', 'commits');

    const { commits: remote } = await api('GET', `/repo/${repoId}/commits`);
    const remoteIds = new Set(remote.map((c) => c.id));

    const localIds = await fs.readdir(commitsDir).catch(() => []);
    const pending = [];

    for (const id of localIds) {
        if (remoteIds.has(id)) continue;
        const dir = path.join(commitsDir, id);
        pending.push({ id, dir, meta: await readMeta(dir) });
    }

    if (pending.length === 0) {
        console.log('Everything is already pushed.');
        return;
    }

    pending.sort((a, b) => new Date(a.meta.date) - new Date(b.meta.date));

    for (const { id, dir, meta } of pending) {
        // 1. Ask the server which files still need uploading
        const plan = await api('POST', `/repo/${repoId}/sync/plan`, {
            token,
            body: { commitId: id, files: meta.files },
        });

        // 2. Upload each file straight to S3 with its presigned URL
        for (const { path: rel, url } of plan.uploads) {
            const body = await fs.readFile(path.join(dir, rel));
            const res = await fetch(url, { method: 'PUT', body });
            if (!res.ok) throw new Error(`Upload failed for ${rel} (${res.status})`);
        }

        // 3. Tell the server the commit is complete
        await api('POST', `/repo/${repoId}/sync/complete`, {
            token,
            body: { commitId: id, message: meta.message, date: meta.date, files: meta.files },
        });

        console.log(`Pushed ${id.slice(0, 8)}: ${meta.message} (${plan.uploads.length} file(s) uploaded)`);
    }
}

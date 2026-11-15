import fs from 'node:fs/promises';
import path from 'node:path';
import { api } from '../lib/api.js';
import { readRepoConfig, getToken } from '../lib/config.js';

export async function pull() {
    const { repoId } = await readRepoConfig();
    const token = await getToken();
    const root = path.join(process.cwd(), '.ForgeLab', 'commits');

    const { commits } = await api('GET', `/repo/${repoId}/sync/download`, { token });

    let written = 0;
    for (const commit of commits) {
        for (const file of commit.files) {
            const dest = path.join(root, commit.id, file.path);

            // Commits never change, so skip anything already downloaded
            if (await fs.access(dest).then(() => true, () => false)) continue;

            const res = await fetch(file.url);
            if (!res.ok) throw new Error(`Download failed for ${file.path} (${res.status})`);

            await fs.mkdir(path.dirname(dest), { recursive: true });
            await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
            written += 1;
        }
    }

    console.log(`Pulled ${commits.length} commit(s), ${written} new file(s).`);
}

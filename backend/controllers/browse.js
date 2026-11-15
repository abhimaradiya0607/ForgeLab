import { readRepoConfig } from './utils/files.js';

const API = process.env.FORGELAB_API || 'http://localhost:3000';

async function getJson(url) {
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.message || `Request failed (${res.status})`);
    }

    return data;
}

export async function browseRepo(filePath) {
    try {
        const { repoId } = await readRepoConfig();

        // No file given: list the top-level folders and files
        if (!filePath) {
            const { files } = await getJson(`${API}/repo/${repoId}/tree`);

            const names = new Set(
                files.map((file) => {
                    const [top, ...rest] = file.path.split('/');
                    return rest.length > 0 ? `${top}/` : top;
                })
            );

            console.log(`Files in repo ${repoId}:`);
            [...names].sort().forEach((name) => console.log(`  ${name}`));
            return;
        }

        // File given: print its contents with line numbers
        const { content } = await getJson(
            `${API}/repo/${repoId}/file?path=${encodeURIComponent(filePath)}`
        );

        content.split('\n').forEach((line, index) => {
            console.log(`${String(index + 1).padStart(4)}  ${line}`);
        });
    } catch (err) {
        console.error('Browse failed:', err.message);
    }
}
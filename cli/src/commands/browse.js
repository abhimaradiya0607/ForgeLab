import { api } from '../lib/api.js';
import { readRepoConfig, getToken } from '../lib/config.js';

export async function browse(filePath) {
    const { repoId } = await readRepoConfig();
    const token = await getToken();

    if (!filePath) {
        const { files } = await api('GET', `/repo/${repoId}/tree`, { token });
        const names = new Set(
            files.map((f) => {
                const [top, ...rest] = f.path.split('/');
                return rest.length > 0 ? `${top}/` : top;
            })
        );
        console.log(`Files in ${repoId}:`);
        [...names].sort().forEach((name) => console.log(`  ${name}`));
        return;
    }

    const { content } = await api('GET', `/repo/${repoId}/file`, {
        token,
        query: { path: filePath },
    });

    content.split('\n').forEach((line, i) => console.log(`${String(i + 1).padStart(4)}  ${line}`));
}

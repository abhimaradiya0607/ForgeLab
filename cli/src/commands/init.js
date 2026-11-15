import { api } from '../lib/api.js';
import { getToken, writeRepoConfig } from '../lib/config.js';

export async function init(repoId) {
    // Confirms the repo exists and that you're allowed to see it
    await api('GET', `/repo/${repoId}/commits`, { token: await getToken() });
    await writeRepoConfig(repoId);
    console.log(`Repository initialized. Linked to ${repoId}`);
}

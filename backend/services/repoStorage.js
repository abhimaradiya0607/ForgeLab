import { redis } from '../config/redis.js';
import { commitKey, listKeys, readText, readJsonOrNull, writeJson } from './storage.js';

const STATE_TTL_SECONDS = 15;
const FILE_CACHE_LIMIT = 300;
const fileCache = new Map();

const commitsPrefix = (repoId) => `repos/${repoId}/commits/`;

// Fallback for repos with no index.json. Slow, so it runs only once per repo.
async function scanCommits(repoId) {
    const prefix = commitsPrefix(repoId);
    const keys = await listKeys(prefix);

    const filesByCommit = new Map();
    for (const key of keys) {
        const rest = key.slice(prefix.length);
        const slash = rest.indexOf('/');
        if (slash === -1) continue;

        const commitId = rest.slice(0, slash);
        if (!filesByCommit.has(commitId)) filesByCommit.set(commitId, []);
        filesByCommit.get(commitId).push(rest.slice(slash + 1));
    }

    const commits = await Promise.all(
        [...filesByCommit].map(async ([id, paths]) => {
            const meta = JSON.parse(await readText(commitKey(repoId, id, 'commit.json')));
            return { id, message: meta.message, date: meta.date, files: paths.filter((p) => p !== 'commit.json') };
        })
    );

    commits.sort((a, b) => new Date(b.date) - new Date(a.date));

    const files = {};
    for (const commit of [...commits].reverse()) {
        for (const file of commit.files) files[file] = commit.id;
    }

    return { commits, files };
}

// Returns commits (newest first) and a Map of file path -> commit that holds its latest version
export async function loadRepoState(repoId) {
    const cacheKey = `repo:${repoId}:state`;

    const cached = await redis.get(cacheKey);
    if (cached) {
        const manifest = JSON.parse(cached);
        return { commits: manifest.commits, latest: new Map(Object.entries(manifest.files)) };
    }

    const manifest =
        (await readJsonOrNull(`repos/${repoId}/index.json`)) ?? (await scanCommits(repoId));

    await redis.set(cacheKey, JSON.stringify(manifest), { EX: STATE_TTL_SECONDS });

    return { commits: manifest.commits, latest: new Map(Object.entries(manifest.files)) };
}

// Commits never change, so cached file contents never go stale
export async function readFile(repoId, commitId, filePath) {
    const key = `${repoId}/${commitId}/${filePath}`;
    if (fileCache.has(key)) return fileCache.get(key);

    const text = await readText(commitKey(repoId, commitId, filePath));

    if (fileCache.size >= FILE_CACHE_LIMIT) {
        fileCache.delete(fileCache.keys().next().value);
    }
    fileCache.set(key, text);

    return text;
}
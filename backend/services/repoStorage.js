import { s3, s3_BUCKET } from '../config/aws-config.js';
import { redis } from '../config/redis.js';


const FILE_CACHE_LIMIT = 300;  // most file contents kept in memory


const fileCache = new Map();   // "repoId/commitId/path" -> text

const commitsPrefix = (repoId) => `repos/${repoId}/commits/`;

async function getText(key) {
    const obj = await s3.getObject({ Bucket: s3_BUCKET, Key: key }).promise();
    return obj.Body.toString('utf8');
}

// Returns null when the object doesn't exist yet
async function getJsonOrNull(key) {
    try {
        return JSON.parse(await getText(key));
    } catch (err) {
        if (err.code === 'NoSuchKey') return null;
        throw err;
    }
}

async function listAllKeys(prefix) {
    const keys = [];
    let token;

    do {
        const page = await s3.listObjectsV2({
            Bucket: s3_BUCKET,
            Prefix: prefix,
            ContinuationToken: token,
        }).promise();

        keys.push(...(page.Contents || []).map((obj) => obj.Key));
        token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);

    return keys;
}

// Fallback for repos pushed before index.json existed. Slow, but only used once.
async function scanCommits(repoId) {
    const prefix = commitsPrefix(repoId);
    const keys = await listAllKeys(prefix);

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
            const meta = JSON.parse(await getText(`${prefix}${id}/commit.json`));
            return {
                id,
                message: meta.message,
                date: meta.date,
                files: paths.filter((p) => p !== 'commit.json'),
            };
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
const STATE_TTL_SECONDS = 15;

// Returns commits (newest first) and a Map of file path -> commit that holds its latest version
export async function loadRepoState(repoId) {
    const cacheKey = `repo:${repoId}:state`;

    // 1. Try Redis first
    const cached = await redis.get(cacheKey);

    if (cached) {
        const manifest = JSON.parse(cached);
        return {
            commits: manifest.commits,
            latest: new Map(Object.entries(manifest.files)),
        };
    }

    // 2. Cache miss: build it from S3
    const manifest =
        (await getJsonOrNull(`repos/${repoId}/index.json`)) ?? (await scanCommits(repoId));

    // 3. Store the plain JSON in Redis. EX expires it after 15 seconds.
    await redis.set(cacheKey, JSON.stringify(manifest), { EX: STATE_TTL_SECONDS });

    return {
        commits: manifest.commits,
        latest: new Map(Object.entries(manifest.files)),
    };
}

// Reads one file. Commits never change, so the cache never goes stale.
export async function readFile(repoId, commitId, filePath) {
    const key = `${repoId}/${commitId}/${filePath}`;
    if (fileCache.has(key)) return fileCache.get(key);

    const text = await getText(`${commitsPrefix(repoId)}${commitId}/${filePath}`);

    if (fileCache.size >= FILE_CACHE_LIMIT) {
        fileCache.delete(fileCache.keys().next().value); // drop the oldest entry
    }
    fileCache.set(key, text);

    return text;
}
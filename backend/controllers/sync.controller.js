import mongoose from 'mongoose';
import Repository from '../models/repo.model.js';
import { redis } from '../config/redis.js';
import { commitKey, presignPut, presignGet, exists, readJsonOrNull, writeJson } from '../services/storage.js';

const COMMIT_ID = /^[0-9a-f-]{36}$/i;

// Blocks "../", absolute paths, and backslashes, so nothing is written outside the commit folder
function isSafePath(p) {
    return (
        typeof p === 'string' &&
        p.length > 0 &&
        p.length <= 300 &&
        !p.startsWith('/') &&
        !p.includes('\\') &&
        !p.split('/').some((part) => part === '' || part === '..')
    );
}

// Rebuilds the "latest commit for each file" map from the commit list
function latestFileMap(commits) {
    const latest = {};
    for (const commit of [...commits].reverse()) {
        for (const file of commit.files) latest[file] = commit.id;
    }
    return latest;
}

// Owner check shared by plan and complete
async function getOwnedRepo(id, userId) {
    const repo = await Repository.findById(id).select('owner').lean();
    if (!repo) return { status: 404, message: 'Repository not found' };
    if (String(repo.owner) !== userId) {
        return { status: 403, message: 'You can only push to your own repositories' };
    }
    return { repo };
}

// POST /repo/:id/sync/plan
export const planPush = async (req, res) => {
    const { id } = req.params;
    const { commitId, files } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }
    if (!COMMIT_ID.test(commitId || '')) {
        return res.status(400).json({ message: 'Invalid commit ID' });
    }
    if (!Array.isArray(files) || files.length > 500 || !files.every(isSafePath)) {
        return res.status(400).json({ message: 'Invalid file list' });
    }

    try {
        const { repo, status, message } = await getOwnedRepo(id, req.user.id);
        if (!repo) return res.status(status).json({ message });

        const uploads = [];
        for (const path of [...files, 'commit.json']) {
            const key = commitKey(id, commitId, path);
            if (await exists(key)) continue;
            uploads.push({ path, url: await presignPut(key) });
        }

        return res.json({ uploads, skipped: files.length + 1 - uploads.length });
    } catch (err) {
        console.error('Plan push failed:', err.message);
        return res.status(500).json({ message: 'Server Error' });
    }
};

// POST /repo/:id/sync/complete
export const completePush = async (req, res) => {
    const { id } = req.params;
    const { commitId, message, date, files } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }
    if (!COMMIT_ID.test(commitId || '') || !Array.isArray(files) || !files.every(isSafePath)) {
        return res.status(400).json({ message: 'Invalid commit' });
    }

    try {
        const { repo, status, message: errorMessage } = await getOwnedRepo(id, req.user.id);
        if (!repo) return res.status(status).json({ message: errorMessage });

        // Every file must really be in S3 before the commit is published
        for (const path of [...files, 'commit.json']) {
            if (!(await exists(commitKey(id, commitId, path)))) {
                return res.status(409).json({ message: `Upload missing: ${path}` });
            }
        }

        const indexKey = `repos/${id}/index.json`;
        const manifest = (await readJsonOrNull(indexKey)) || { commits: [], files: {} };

        if (!manifest.commits.some((c) => c.id === commitId)) {
            manifest.commits.push({
                id: commitId,
                message: String(message || '').slice(0, 200),
                date: new Date(date || Date.now()).toISOString(),
                files,
            });
        }

        manifest.commits.sort((a, b) => new Date(b.date) - new Date(a.date));
        manifest.files = latestFileMap(manifest.commits);

        await writeJson(indexKey, manifest);
        await redis.del(`repo:${id}:state`);

        return res.json({ message: 'Commit published', commitId });
    } catch (err) {
        console.error('Complete push failed:', err.message);
        return res.status(500).json({ message: 'Server Error' });
    }
};

// GET /repo/:id/sync/download
export const planDownload = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    try {
        const repo = await Repository.findById(id).select('owner visibility').lean();
        const isOwner = req.user && String(repo?.owner) === req.user.id;

        if (!repo || (!repo.visibility && !isOwner)) {
            return res.status(404).json({ message: 'Repository not found' });
        }

        const manifest = (await readJsonOrNull(`repos/${id}/index.json`)) || { commits: [] };

        const commits = await Promise.all(
            manifest.commits.map(async (commit) => ({
                id: commit.id,
                message: commit.message,
                date: commit.date,
                files: await Promise.all(
                    [...commit.files, 'commit.json'].map(async (path) => ({
                        path,
                        url: await presignGet(commitKey(id, commit.id, path)),
                    }))
                ),
            }))
        );

        return res.json({ commits });
    } catch (err) {
        console.error('Plan download failed:', err.message);
        return res.status(500).json({ message: 'Server Error' });
    }
};

import mongoose from 'mongoose';
import Repository from '../models/repo.model.js';
import { loadRepoState, readFile } from '../services/repoStorage.js';

// Loads the repo and checks that this viewer may see it
async function getReadableRepo(req, id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return { status: 400, message: 'Invalid ID' };
    }

    const repo = await Repository.findById(id);

    if (!repo) {
        return { status: 404, message: 'Repository not found' };
    }

    // Private repos are visible only to the owner. Others get a 404, so they can't tell it exists.
    const isOwner = req.user && repo.owner.toString() === req.user.id;

    if (!repo.visibility && !isOwner) {
        return { status: 404, message: 'Repository not found' };
    }

    return { repo };
}

function repoSummary(repo) {
    return {
        _id: repo._id,
        name: repo.name,
        description: repo.description,
        visibility: repo.visibility,
        owner: repo.owner,
    };
}

// GET /repo/:id/tree - every file in the latest version of the repo
export const getRepoTree = async (req, res) => {
    const { id } = req.params;

    try {
        const { repo, status, message } = await getReadableRepo(req, id);
        if (!repo) return res.status(status).json({ message });

        const { latest } = await loadRepoState(id);
        const files = [...latest].map(([path, commitId]) => ({ path, commitId }));

        return res.json({ repo: repoSummary(repo), files });
    } catch (err) {
        console.error('Error loading repo tree:', err.message);
        return res.status(500).json({ message: 'Server Error' });
    }
};

// GET /repo/:id/file?path=src/app.js - the contents of one file
export const getRepoFile = async (req, res) => {
    const { id } = req.params;
    const filePath = req.query.path;

    if (!filePath) {
        return res.status(400).json({ message: 'path is required' });
    }

    try {
        const { repo, status, message } = await getReadableRepo(req, id);
        if (!repo) return res.status(status).json({ message });

        const { latest } = await loadRepoState(id);
        const commitId = latest.get(filePath);

        if (!commitId) {
            return res.status(404).json({ message: 'File not found' });
        }

        const content = await readFile(id, commitId, filePath);

        return res.json({ path: filePath, commitId, content });
    } catch (err) {
        console.error('Error loading file:', err.message);
        return res.status(500).json({ message: 'Server Error' });
    }
};

// GET /repo/:id/commits - commit history, newest first
export const getRepoCommits = async (req, res) => {
    const { id } = req.params;

    try {
        const { repo, status, message } = await getReadableRepo(req, id);
        if (!repo) return res.status(status).json({ message });

        const { commits } = await loadRepoState(id);

        return res.json({
            repo: repoSummary(repo),
            commits: commits.map((commit) => ({
                id: commit.id,
                message: commit.message,
                date: commit.date,
                fileCount: commit.files.length,
            })),
        });
    } catch (err) {
        console.error('Error loading commits:', err.message);
        return res.status(500).json({ message: 'Server Error' });
    }
};
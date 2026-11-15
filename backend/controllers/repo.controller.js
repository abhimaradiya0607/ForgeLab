import mongoose from 'mongoose';
import Repository from '../models/repo.model.js';
import Issue from '../models/issue.model.js';
import User from '../models/user.model.js';
import { runInTransaction } from '../utils/transaction.js';
import { topRepoIds, rebuildTrending } from '../services/trending.js';
import { syncTrendingScore } from '../services/trending.js';
import { withStarCounts } from '../services/repoStats.js';

function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

function handleError(res, err, label) {
    if (err.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    if (err.code === 11000) {
        return res.status(409).json({ message: 'Repository name already in use' });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: err.message });
    }

    console.error(`Error during ${label}:`, err.message);
    return res.status(500).json({ message: 'Server Error' });
}

// ---------- Protected routes (need authenticate) ----------

export const createRepository = async (req, res) => {
    const { name, description, visibility, content } = req.body;

    // The owner is always the logged-in user, never something sent in the body
    const owner = req.user.id;

    if (!name) {
        return res.status(400).json({ message: 'Repository name is required' });
    }

    try {
        const repository = await Repository.create({
            name,
            description,
            visibility,   // schema default is true if not sent
            content: content || [],
            owner,
            issues: [],  // issues are added through the issue routes
        });

        return res.status(201).json({
            message: 'New repository created',
            repositoryId: repository._id,
        });
    } catch (err) {
        return handleError(res, err, 'create repository');
    }
};

export const fetchRepositoryForCurrentUser = async (req, res) => {
    const { userID } = req.params;

    if (!isValidId(userID)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    if (userID !== req.user.id) {
        return res.status(403).json({ message: 'You can only view your own repositories' });
    }

    try {
        const repositories = await Repository.find({ owner: req.user.id });

        if (repositories.length === 0) {
            return res.status(404).json({ message: 'No repositories found' });
        }

        return res.status(200).json({
            message: 'Repositories found',
            repositories: await withStarCounts(repositories),
        });
    } catch (err) {
        return handleError(res, err, 'fetch current user repositories');
    }
};

export const updateRepositoryById = async (req, res) => {
    const { id } = req.params;
    const { description, content } = req.body;

    if (!isValidId(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    try {
        const repository = await Repository.findById(id);

        if (!repository) {
            return res.status(404).json({ message: 'Repository not found' });
        }

        if (repository.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only update your own repositories' });
        }

        if (description !== undefined) {
            repository.description = description;
        }

        if (content !== undefined) {
            repository.content.push(content);
        }

        const updatedRepo = await repository.save();

        return res.json({ message: 'Repository updated successfully', updatedRepo });
    } catch (err) {
        return handleError(res, err, 'update repository');
    }
};

export const toggleVisibilityById = async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    try {
        const repository = await Repository.findById(id);

        if (!repository) {
            return res.status(404).json({ message: 'Repository not found' });
        }

        if (repository.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only change your own repositories' });
        }

        repository.visibility = !repository.visibility;

        const updatedRepo = await repository.save();

        return res.json({ message: 'Repository visibility toggled', updatedRepo });
    } catch (err) {
        return handleError(res, err, 'toggle repository visibility');
    }
};

export const deleteRepositoryById = async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    try {
        const repository = await Repository.findById(id);

        if (!repository) {
            return res.status(404).json({ message: 'Repository not found' });
        }

        if (repository.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only delete your own repositories' });
        }

        // Delete the repo and its issues together, or not at all
        await runInTransaction(async (session) => {
            await Issue.deleteMany({ repository: id }, { session });
            await Repository.deleteOne({ _id: id }, { session });
        });

        return res.json({ message: 'Repository and its issues deleted' });
    } catch (err) {
        return handleError(res, err, 'delete repository');
    }
};

// ---------- Public routes (no login needed) ----------

export const getAllRepositories = async (req, res) => {
    try {
        const repositories = await Repository.find({})
            .populate('owner', 'username')
            .populate('issues');

        return res.json(repositories);
    } catch (err) {
        return handleError(res, err, 'get all repositories');
    }
};

export const fetchRepositoryById = async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    try {
        const repository = await Repository.findById(id)
            .populate('owner', 'username')
            .populate('issues');

        if (!repository) {
            return res.status(404).json({ message: 'Repository not found' });
        }

        return res.json(repository);
    } catch (err) {
        return handleError(res, err, 'fetch repository by id');
    }
};

export const fetchRepositoryByName = async (req, res) => {
    const { name } = req.params;

    try {
        const repository = await Repository.findOne({ name })
            .populate('owner', 'username')
            .populate('issues');

        if (!repository) {
            return res.status(404).json({ message: 'Repository not found' });
        }

        return res.json(repository);
    } catch (err) {
        return handleError(res, err, 'fetch repository by name');
    }
};

export const searchRepositories = async (req, res) => {
    // Limit the search text and escape regex characters
    const q = String(req.query.q || '').trim().slice(0, 50);

    if (!q) {
        return res.json([]);
    }

    try {
        const safeQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const repositories = await Repository.find({
            visibility: true,
            name: { $regex: safeQuery, $options: 'i' },
        })
            .select('name description visibility')
            .limit(8);

        return res.json(repositories);
    } catch (err) {
        return handleError(res, err, 'search repositories');
    }
};

// Count stars and followers in two queries, then attach them to each public repo.
async function addPublicStats(repositories) {
    const repoIds = repositories.map((repo) => repo._id);
    const ownerIds = [];
    const seenOwners = new Set();

    for (const repo of repositories) {
        const ownerId = repo.owner?._id;
        if (ownerId && !seenOwners.has(String(ownerId))) {
            seenOwners.add(String(ownerId));
            ownerIds.push(ownerId);
        }
    }

    const [starGroups, followerGroups] = await Promise.all([
        repoIds.length
            ? User.aggregate([
                { $match: { starredRepositories: { $in: repoIds } } },
                { $unwind: '$starredRepositories' },
                { $match: { starredRepositories: { $in: repoIds } } },
                { $group: { _id: '$starredRepositories', count: { $sum: 1 } } },
            ])
            : [],
        ownerIds.length
            ? User.aggregate([
                { $match: { followedUsers: { $in: ownerIds } } },
                { $unwind: '$followedUsers' },
                { $match: { followedUsers: { $in: ownerIds } } },
                { $group: { _id: '$followedUsers', count: { $sum: 1 } } },
            ])
            : [],
    ]);

    const starCounts = new Map(starGroups.map((group) => [String(group._id), group.count]));
    const followerCounts = new Map(followerGroups.map((group) => [String(group._id), group.count]));

    return repositories.map((repo) => ({
        _id: repo._id,
        name: repo.name,
        description: repo.description || '',
        visibility: repo.visibility,
        createdAt: repo.createdAt,
        starCount: starCounts.get(String(repo._id)) || 0,
        owner: repo.owner
            ? {
                _id: repo.owner._id,
                username: repo.owner.username,
                followerCount: followerCounts.get(String(repo.owner._id)) || 0,
            }
            : null,
    }));
}

// The logged-in user comes from the token, not from the request body.
export const starRepository = async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    try {
        const repository = await Repository.findById(id).populate('owner', 'username');

        if (!repository) {
            return res.status(404).json({ message: 'Repository not found' });
        }

        // Private repositories stay out of the starred list.
        if (!repository.visibility) {
            return res.status(403).json({ message: 'You can only star public repositories' });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $addToSet: { starredRepositories: repository._id } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const starCount = await User.countDocuments({ starredRepositories: repository._id });

        await syncTrendingScore(repository._id).catch((err) =>
            console.error('Trending sync failed:', err.message)
        );

        return res.json({
            starred: true,
            starCount,
            repository: {
                _id: repository._id,
                name: repository.name,
                description: repository.description,
                visibility: repository.visibility,
                owner: repository.owner,
            },
        });
    } catch (err) {
        return handleError(res, err, 'star repository');
    }
};

export const unstarRepository = async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $pull: { starredRepositories: id } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const starCount = await User.countDocuments({ starredRepositories: id });

        await syncTrendingScore(id).catch((err) =>
            console.error('Trending sync failed:', err.message)
        );
        

        return res.json({ starred: false, repositoryId: id, starCount });
    } catch (err) {
        return handleError(res, err, 'unstar repository');
    }
};

export const getPublicRepositories = async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 20, 50);
        const cursor = req.query.cursor;

        const filter = { visibility: true };
        if (cursor) {
            filter._id = { $lt: cursor };
        }

        // Ask for one extra item to know whether another page exists
        const found = await Repository.find(filter)
            .sort({ _id: -1 })
            .limit(limit + 1)
            .populate('owner', 'username followerCount');

        const hasMore = found.length > limit;
        const page = hasMore ? found.slice(0, limit) : found;

        return res.json({
            repositories: await withStarCounts(page),
            nextCursor: hasMore ? String(page.at(-1)._id) : null,
        });
    } catch (err) {
        return handleError(res, err, 'get public repositories');
    }
};

// Top 10 public repositories by how many users starred them.
// A repo with zero stars is still included when it falls inside that top 10.
export const getTrendingRepositories = async (req, res) => {
    try {
        let ids = await topRepoIds(10);

        // Empty ranking (first run, or Redis was cleared): rebuild it once
        if (ids.length === 0) {
            await rebuildTrending();
            ids = await topRepoIds(10);
        }

        const repos = await Repository.find({ _id: { $in: ids }, visibility: true })
            .populate('owner', 'username followerCount');

        // $in does not keep order, so sort the results to match Redis
        const position = new Map(ids.map((id, index) => [id, index]));
        repos.sort((a, b) => position.get(String(a._id)) - position.get(String(b._id)));

        return res.json({ repositories: await withStarCounts(repos) });
    } catch (err) {
        // Redis is down: fall back to MongoDB so the page still works
        console.error('Trending from Redis failed, using MongoDB:', err.message);

        try {
            const repos = await Repository.find({ visibility: true })
                .sort({ starCount: -1 })
                .limit(10)
                .populate('owner', 'username followerCount');

                return res.json({ repositories: await withStarCounts(repos) });
        } catch (fallbackErr) {
            return handleError(res, fallbackErr, 'get trending repositories');
        }
    }
};
import mongoose from 'mongoose';
import User from '../models/user.model.js';

// Returns a Map: repo id (string) -> number of users who starred it
export async function getStarCounts(repoIds) {
    if (repoIds.length === 0) return new Map();

    const ids = repoIds.map((id) => new mongoose.Types.ObjectId(String(id)));

    const rows = await User.aggregate([
        { $unwind: '$starredRepositories' },
        { $match: { starredRepositories: { $in: ids } } },
        { $group: { _id: '$starredRepositories', count: { $sum: 1 } } },
    ]);

    return new Map(rows.map((row) => [String(row._id), row.count]));
}

// Adds a starCount field to each repo in a list
export async function withStarCounts(repos) {
    const counts = await getStarCounts(repos.map((repo) => repo._id));

    return repos.map((repo) => {
        const plain = repo.toObject ? repo.toObject() : repo;
        return { ...plain, starCount: counts.get(String(plain._id)) ?? 0 };
    });
}
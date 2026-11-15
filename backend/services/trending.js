import { redis } from '../config/redis.js';
import Repository from '../models/repo.model.js';
import User from '../models/user.model.js';

// One sorted set holds every public repo, scored by its star count
const KEY = 'trending:repos';

// Counts how many users have starred a repo. Stars are stored on the User documents.
async function countStars(repoId) {
    return User.countDocuments({ starredRepositories: repoId });
}

// Set one repo's score to its current star count
export async function syncTrendingScore(repoId) {
    const repo = await Repository.findById(repoId).select('visibility').lean();

    // Deleted or private repos don't belong in the ranking
    if (!repo || !repo.visibility) {
        await redis.zRem(KEY, String(repoId));
        return;
    }

    const score = await countStars(repoId);
    await redis.zAdd(KEY, { score, value: String(repoId) });
}

// Rebuild the whole ranking from MongoDB. Used at startup and when Redis is empty.
export async function rebuildTrending() {
    const repos = await Repository.find({ visibility: true }, '_id').lean();

    const entries = await Promise.all(
        repos.map(async (repo) => ({
            score: await countStars(repo._id),
            value: String(repo._id),
        }))
    );

    const multi = redis.multi();
    multi.del(KEY);
    if (entries.length > 0) multi.zAdd(KEY, entries);
    await multi.exec();

    return entries.length;
}

// Returns the ids of the top N public repos, highest score first
export async function topRepoIds(limit = 10) {
    return redis.zRange(KEY, 0, limit - 1, { REV: true });
}
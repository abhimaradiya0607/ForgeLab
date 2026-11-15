
import express from "express";

import { authenticate } from '../middleware/authenticate.js';
import {
    getAllRepositories,
    fetchRepositoryById,
    fetchRepositoryForCurrentUser,
    fetchRepositoryByName,
    deleteRepositoryById,
    updateRepositoryById,
    toggleVisibilityById,
    starRepository,
    unstarRepository,
    createRepository,
    searchRepositories,
    getPublicRepositories,
    getTrendingRepositories
} from "../controllers/repo.controller.js";
import { optionalAuth } from '../middleware/optionalAuth.js';
import { getRepoTree, getRepoFile, getRepoCommits } from '../controllers/repoCode.controller.js';
import { redis } from '../config/redis.js';
import { planPush, completePush, planDownload } from '../controllers/sync.controller.js';

const RepoRouter = express.Router();

// Storage sync: the CLI uses these instead of AWS keys
RepoRouter.post('/repo/:id/sync/plan', authenticate, planPush);
RepoRouter.post('/repo/:id/sync/complete', authenticate, completePush);
RepoRouter.get('/repo/:id/sync/download', optionalAuth, planDownload);

RepoRouter.get('/repo/:id/tree', optionalAuth, getRepoTree);
RepoRouter.get('/repo/:id/file', optionalAuth, getRepoFile);
RepoRouter.get('/repo/:id/commits', optionalAuth, getRepoCommits);

// Create repository
RepoRouter.post("/repo/create", authenticate,createRepository);

// Get all repositories
RepoRouter.get("/repo/all", getAllRepositories);

// Search repositories
RepoRouter.get("/repo/search", searchRepositories);

// Get only public repositories
RepoRouter.get("/repo/public", getPublicRepositories);

// Top 10 public repositories by star count
RepoRouter.get("/repo/trending", getTrendingRepositories);

// Get repositories by user
RepoRouter.get("/repo/user/:userID", authenticate, fetchRepositoryForCurrentUser);

// Get repository by name
RepoRouter.get("/repo/name/:name", fetchRepositoryByName);

// Get repository by ID
RepoRouter.get("/repo/:id", fetchRepositoryById);

// Update repository
RepoRouter.put("/repo/update/:id",authenticate, updateRepositoryById);

// Delete repository
RepoRouter.delete("/repo/delete/:id",authenticate, deleteRepositoryById);

// Toggle repository visibility
RepoRouter.patch("/repo/toggle/:id",authenticate, toggleVisibilityById);

// Star and unstar a public repository for the logged-in user
RepoRouter.post("/repo/:id/star", authenticate, starRepository);
RepoRouter.delete("/repo/:id/star", authenticate, unstarRepository);

// Clears the cached file list for a repo. Called by the CLI after a push.
RepoRouter.post("/repo/:id/cache/clear", async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await redis.del(`repo:${id}:state`);
        return res.json({ cleared: deleted === 1 });
    } catch (err) {
        console.error("Error clearing cache:", err.message);
        return res.status(500).json({ message: "Could not clear cache" });
    }
});

export default RepoRouter;

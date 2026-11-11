import express from 'express';
import {getAllRepositories,fetchRepositoryById,fetchRepositoryForCurrentUser,
    fetchRepositoryByName,deleteRepositoryById,
    updateRepositoryById,toggleVisibilityById,createRepository } from '../controllers/repo.controller.js';

const RepoRouter=express.Router();

RepoRouter.post('/repo/create',createRepository);

RepoRouter.get('/repo/all',getAllRepositories);

RepoRouter.get('/repo/:id',fetchRepositoryById);
RepoRouter.get('/repo/name/:name',fetchRepositoryByName);
RepoRouter.get('/repo/user/:userID',fetchRepositoryForCurrentUser);


RepoRouter.put('/repo/update/:id',updateRepositoryById);

RepoRouter.delete('/repo/delete/:id',deleteRepositoryById);

RepoRouter.patch('/repo/toggle/:id',toggleVisibilityById);


export default RepoRouter;


import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
    createIssue,
    deleteIssueById,
    updateIssueById,
    getAllIssues,
    getIssueById,
} from '../controllers/issue.controller.js';

const IssueRouter = express.Router();

// Public: list issues for one repo (:id = repo ID)
IssueRouter.get('/issue/repo/:id', getAllIssues);

// Public: one issue (:id = issue ID)
IssueRouter.get('/issue/:id', getIssueById);

// Protected: create an issue in a repo (:id = repo ID)
IssueRouter.post('/issue/create/:id', authenticate, createIssue);

// Protected: update or delete an issue (:id = issue ID)
IssueRouter.put('/issue/update/:id', authenticate, updateIssueById);
IssueRouter.delete('/issue/delete/:id', authenticate, deleteIssueById);

export default IssueRouter;
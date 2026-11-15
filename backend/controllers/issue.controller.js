import mongoose from 'mongoose';
import Issue from '../models/issue.model.js';
import Repository from '../models/repo.model.js';
import { runInTransaction } from '../utils/transaction.js';

function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

function handleError(res, err, label) {
    if (err.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: err.message });
    }

    console.error(`Error during ${label}:`, err.message);
    return res.status(500).json({ message: 'Server Error' });
}

// Finds an issue and its repo, and checks the logged-in user owns that repo.
// Returns { status, message } on failure, or { issue, repository } on success.
async function findIssueOwnedBy(issueId, userId) {
    const issue = await Issue.findById(issueId);

    if (!issue) {
        return { status: 404, message: 'Issue not found' };
    }

    const repository = await Repository.findById(issue.repository);

    if (!repository || repository.owner.toString() !== userId) {
        return { status: 403, message: 'You can only change issues in your own repositories' };
    }

    return { issue, repository };
}

// ---------- Protected routes (need authenticate) ----------

// Route param :id is the REPOSITORY id here
export const createIssue = async (req, res) => {
    const { id: repoId } = req.params;
    const { title, description } = req.body;

    if (!isValidId(repoId)) {
        return res.status(400).json({ message: 'Invalid repository ID' });
    }

    if (!title || !description) {
        return res.status(400).json({ message: 'title and description are required' });
    }

    try {
        const repository = await Repository.findById(repoId);

        if (!repository) {
            return res.status(404).json({ message: 'Repository not found' });
        }

        if (repository.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only add issues to your own repositories' });
        }

        // Save the issue and add it to the repo together, or neither
        const issue = await runInTransaction(async (session) => {
            const [created] = await Issue.create(
                [{ title, description, repository: repoId }],
                { session }
            );

            await Repository.updateOne(
                { _id: repoId },
                { $push: { issues: created._id } },
                { session }
            );

            return created;
        });

        return res.status(201).json({ message: 'Issue created successfully', issue });
    } catch (err) {
        return handleError(res, err, 'create issue');
    }
};

// Route param :id is the ISSUE id here
export const updateIssueById = async (req, res) => {
    const { id } = req.params;
    const { title, description, status } = req.body;

    if (!isValidId(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    if (title === undefined && description === undefined && status === undefined) {
        return res.status(400).json({ message: 'At least one field is required to update' });
    }

    try {
        const check = await findIssueOwnedBy(id, req.user.id);

        if (!check.issue) {
            return res.status(check.status).json({ message: check.message });
        }

        const { issue } = check;

        if (title !== undefined) issue.title = title;
        if (description !== undefined) issue.description = description;
        if (status !== undefined) issue.status = status;

        // save() runs the schema validation, including the open/closed check
        const updatedIssue = await issue.save();

        return res.status(200).json({ message: 'Issue updated successfully', issue: updatedIssue });
    } catch (err) {
        return handleError(res, err, 'update issue');
    }
};

export const deleteIssueById = async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    try {
        const check = await findIssueOwnedBy(id, req.user.id);

        if (!check.issue) {
            return res.status(check.status).json({ message: check.message });
        }

        const { issue } = check;

        // Remove the issue and its link from the repo together
        await runInTransaction(async (session) => {
            await Issue.deleteOne({ _id: issue._id }, { session });

            await Repository.updateOne(
                { _id: issue.repository },
                { $pull: { issues: issue._id } },
                { session }
            );
        });

        return res.status(200).json({ message: 'Issue deleted successfully' });
    } catch (err) {
        return handleError(res, err, 'delete issue');
    }
};

// ---------- Public routes (no login needed) ----------

// Route param :id is the REPOSITORY id here
export const getAllIssues = async (req, res) => {
    const { id: repoId } = req.params;

    if (!isValidId(repoId)) {
        return res.status(400).json({ message: 'Invalid repository ID' });
    }

    try {
        const issues = await Issue.find({ repository: repoId });

        return res.status(200).json({ message: 'Issues found', issues });
    } catch (err) {
        return handleError(res, err, 'fetch issues');
    }
};

// Route param :id is the ISSUE id here
export const getIssueById = async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    try {
        const issue = await Issue.findById(id);

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        return res.status(200).json({ message: 'Issue found', issue });
    } catch (err) {
        return handleError(res, err, 'fetch issue by id');
    }
};
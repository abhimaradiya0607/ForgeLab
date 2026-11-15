import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { clerkClient, getAuth } from '@clerk/express';
import User from '../models/user.model.js';
import Repository from '../models/repo.model.js';
import Issue from '../models/issue.model.js';

function createToken(userId) {
    return jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET_KEY, { expiresIn: '7d' });
}

function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

function handleError(res, err, label) {
    if (err.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    if (err.code === 11000) {
        return res.status(409).json({ message: 'Username or email already in use' });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: err.message });
    }

    console.error(`Error during ${label}:`, err.message);
    return res.status(500).json({ message: 'Server Error' });
}

// Social accounts don't have our username, so we build a unique one
async function makeUniqueUsername(clerkUser, email) {
    const base =
        (clerkUser.username || email.split('@')[0])
            .replace(/[^a-zA-Z0-9_]/g, '')
            .slice(0, 20) || 'user';

    let username = base;

    while (await User.exists({ username })) {
        username = base + Math.floor(1000 + Math.random() * 9000);
    }

    return username;
}

export const signup = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username) {
        return res.status(400).json({ message: 'username is required' });
    }

    if (!email) {
        return res.status(400).json({ message: 'email is required' });
    }

    if (!password) {
        return res.status(400).json({ message: 'password is required' });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({ username, email, password: hashedPassword });

        return res.status(201).json({
            message: 'User registered successfully',
            token: createToken(user._id),
            userId: user._id,
        });
    } catch (err) {
        return handleError(res, err, 'signup');
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'email is required' });
    }

    if (!password) {
        return res.status(400).json({ message: 'password is required' });
    }

    try {
        // password is hidden by default, so we ask for it here
        const user = await User.findOne({ email }).select('+password');

        // Same message for wrong email or wrong password
        if (!user || !user.password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        return res.json({ token: createToken(user._id), userId: user._id, isAdmin: user.isAdmin });
    } catch (err) {
        return handleError(res, err, 'login');
    }
};

export const clerkLogin = async (req, res) => {
    // clerkMiddleware on the route already checked the Clerk token
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
        return res.status(401).json({ message: 'Social login failed. Please try again.' });
    }

    try {
        const clerkUser = await clerkClient.users.getUser(clerkId);

        const primaryEmail = clerkUser.emailAddresses.find(
            (item) => item.id === clerkUser.primaryEmailAddressId
        );

        // Only link accounts using emails that Clerk has verified
        if (!primaryEmail || primaryEmail.verification?.status !== 'verified') {
            return res.status(400).json({ message: 'Your social account has no verified email.' });
        }

        const email = primaryEmail.emailAddress.toLowerCase();

        // 1. Has this social user logged in before?
        let user = await User.findOne({ clerkId });

        // 2. Same email already signed up with a password? Link them.
        if (!user) {
            user = await User.findOne({ email });

            if (user) {
                user.clerkId = clerkId;
                await user.save();
            }
        }

        // 3. Brand new user
        if (!user) {
            user = await User.create({
                username: await makeUniqueUsername(clerkUser, email),
                email,
                clerkId,
            });
        }

        return res.json({ token: createToken(user._id), userId: user._id, isAdmin: user.isAdmin });
    } catch (err) {
        return handleError(res, err, 'social login');
    }
};

// Shows usernames only, never emails
export const getAllusers = async (req, res) => {
    try {
        const users = await User.find().select('username');
        return res.json(users);
    } catch (err) {
        return handleError(res, err, 'fetching users');
    }
};

// Logged-in users can only view their own profile
export const getUserProfile = async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    if (String(id) !== String(req.user.id)) {
        return res.status(403).json({
            message: 'You can only view your own profile'
        });
    }

    try {
        const user = await User.findById(id)
            .populate('repositories', 'name visibility');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'Profile fetched',
            user
        });

    } catch (err) {
        return handleError(res, err, 'fetching profile');
    }
};

export const updateUserProfile = async (req, res) => {
    const { id } = req.params;
    const { username, email, password } = req.body;

    if (!isValidId(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    if (id !== req.user.id) {
        return res.status(403).json({ message: 'You can only update your own profile' });
    }

    try {
        // Only add the fields the user actually sent
        const updates = {};

        if (username) {
            updates.username = username;
        }

        if (email) {
            updates.email = email;
        }

        if (password) {
            updates.password = await bcrypt.hash(password, 10);
        }

        const user = await User.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json(user);
    } catch (err) {
        return handleError(res, err, 'profile update');
    }
};

// Starred repositories and followed users for the logged-in user only.
export const getMyActivity = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate({
                path: 'starredRepositories',
                match: { visibility: true },
                select: 'name description visibility owner',
                populate: { path: 'owner', select: 'username' },
            })
            .populate('followedUsers', 'username');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // A private repo that was filtered out comes back as null. Drop those.
        const starredRepositories = (user.starredRepositories || []).filter(Boolean);
        const followed = user.followedUsers || [];
        const ownerIds = followed.map((person) => person._id);

        const repoGroups = ownerIds.length
            ? await Repository.aggregate([
                { $match: { owner: { $in: ownerIds }, visibility: true } },
                { $group: { _id: '$owner', count: { $sum: 1 } } },
            ])
            : [];
        const repoCounts = new Map(repoGroups.map((group) => [String(group._id), group.count]));

        const followedUsers = followed.map((person) => ({
            _id: person._id,
            username: person.username,
            repositoryCount: repoCounts.get(String(person._id)) || 0,
        }));

        return res.json({ starredRepositories, followedUsers });
    } catch (err) {
        return handleError(res, err, 'fetch activity');
    }
};

export const followUser = async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    if (id === req.user.id) {
        return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    try {
        const target = await User.findById(id).select('username');

        if (!target) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $addToSet: { followedUsers: target._id } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const [followerCount, repositoryCount] = await Promise.all([
            User.countDocuments({ followedUsers: target._id }),
            Repository.countDocuments({ owner: target._id, visibility: true }),
        ]);

        return res.json({
            following: true,
            followerCount,
            user: { _id: target._id, username: target.username, repositoryCount },
        });
    } catch (err) {
        return handleError(res, err, 'follow user');
    }
};

export const unfollowUser = async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $pull: { followedUsers: id } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const followerCount = await User.countDocuments({ followedUsers: id });

        return res.json({ following: false, userId: id, followerCount });
    } catch (err) {
        return handleError(res, err, 'unfollow user');
    }
};

// Counts repos and issues created per day for one user
export const getUserActivity = async (req, res) => {
    const { id } = req.params;
    const tz = req.query.tz || 'UTC';

    if (!isValidId(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    // Check the timezone so MongoDB doesn't fail with a confusing error
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: tz });
    } catch {
        return res.status(400).json({ message: 'Invalid timezone' });
    }

    try {
        const ownerId = new mongoose.Types.ObjectId(id);

        // Group by the day each item was created, in the user's timezone
        const dayFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: tz } };

        const repoDays = await Repository.aggregate([
            { $match: { owner: ownerId } },
            { $group: { _id: dayFormat, count: { $sum: 1 } } },
        ]);

        // Issues don't store the owner, so look up their repository first
        const issueDays = await Issue.aggregate([
            { $lookup: { from: 'repositories', localField: 'repository', foreignField: '_id', as: 'repo' } },
            { $unwind: '$repo' },
            { $match: { 'repo.owner': ownerId } },
            { $group: { _id: dayFormat, count: { $sum: 1 } } },
        ]);

        // Merge both lists into one total per day
        const totals = new Map();
        for (const row of [...repoDays, ...issueDays]) {
            totals.set(row._id, (totals.get(row._id) || 0) + row.count);
        }

        const activity = [...totals].map(([date, value]) => ({ date, value }));

        return res.json({ activity });
    } catch (err) {
        return handleError(res, err, 'fetching user activity');
    }
};

export const deleteUserProfile = async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    if (id !== req.user.id) {
        return res.status(403).json({ message: 'You can only delete your own profile' });
    }

    try {
        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({ message: 'User profile deleted' });
    } catch (err) {
        return handleError(res, err, 'profile deletion');
    }
};
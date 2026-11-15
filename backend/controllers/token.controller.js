import ApiToken from '../models/apiToken.model.js';
import { generateToken, hashToken } from '../utils/tokens.js';

const MAX_TOKENS_PER_USER = 10;

// POST /tokens: returns the raw token once
export const createApiToken = async (req, res) => {
    const name = String(req.body.name || '').trim().slice(0, 60);

    if (!name) {
        return res.status(400).json({ message: 'name is required, e.g. "laptop"' });
    }

    try {
        const count = await ApiToken.countDocuments({ user: req.user.id });
        if (count >= MAX_TOKENS_PER_USER) {
            return res.status(400).json({ message: 'Token limit reached. Delete an old token first.' });
        }

        const raw = generateToken();
        const doc = await ApiToken.create({
            user: req.user.id,
            name,
            tokenHash: hashToken(raw),
        });

        return res.status(201).json({
            message: 'Token created. Copy it now. It will not be shown again.',
            id: doc._id,
            name: doc.name,
            token: raw,
        });
    } catch (err) {
        console.error('Create token failed:', err.message);
        return res.status(500).json({ message: 'Server Error' });
    }
};

// GET /tokens: names and dates only, never the token itself
export const listApiTokens = async (req, res) => {
    const tokens = await ApiToken.find({ user: req.user.id })
        .select('name createdAt lastUsedAt')
        .sort({ createdAt: -1 });

    return res.json({ tokens });
};

// DELETE /tokens/:id: revokes immediately
export const deleteApiToken = async (req, res) => {
    const deleted = await ApiToken.findOneAndDelete({
        _id: req.params.id,
        user: req.user.id,
    });

    if (!deleted) {
        return res.status(404).json({ message: 'Token not found' });
    }

    return res.json({ message: 'Token revoked' });
};
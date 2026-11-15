import jwt from 'jsonwebtoken';
import ApiToken from '../models/apiToken.model.js';
import { TOKEN_PREFIX, hashToken } from '../utils/tokens.js';

export const authenticate = async (req, res, next) => {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'You need to be authorized' });
    }

    const token = header.split(' ')[1];

    try {
        // Personal access token from the CLI
        if (token.startsWith(TOKEN_PREFIX)) {
            const record = await ApiToken.findOne({ tokenHash: hashToken(token) }).lean();

            if (!record) {
                return res.status(401).json({ message: 'Invalid token' });
            }

            // Fire and forget: update "last used" without slowing the request
            ApiToken.updateOne({ _id: record._id }, { lastUsedAt: new Date() }).exec();

            req.user = { id: String(record.user) };
            return next();
        }

        // Website session (JWT)
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = { id: decoded.id };
        return next();
    } catch {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// Used only for managing tokens. A token can't create other tokens.
export const authenticateJwtOnly = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] || '';

    if (token.startsWith(TOKEN_PREFIX)) {
        return res.status(403).json({ message: 'Create and manage tokens from the website' });
    }

    return authenticate(req, res, next);
};
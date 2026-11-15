import jwt from 'jsonwebtoken';

export const optionalAuth = (req, res, next) => {
    const header = req.headers.authorization;

    if (header?.startsWith('Bearer ')) {
        try {
            const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET_KEY);
            req.user = { id: decoded.id };
        } catch {
            // Invalid token: treat the request as anonymous
        }
    }

    next();
};
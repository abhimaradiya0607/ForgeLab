import User from '../models/user.model.js';

export const requireAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: 'Only the admin can do this' });
        }

        next();
    } catch (err) {
        return res.status(500).json({ message: 'Server Error' });
    }
};
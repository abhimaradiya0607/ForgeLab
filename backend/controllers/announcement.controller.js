import mongoose from 'mongoose';
import Announcement from '../models/announcement.model.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

// Which fields each type needs. The frontend shows the same fields.
const REQUIRED_FIELDS = {
    announcement: [],
    news: [],
    event: ['eventDate', 'location'],
    competition: ['deadline', 'link'],
};

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

// Public: list announcements, optionally filtered by ?type=event
export const getAnnouncements = async (req, res) => {
    const filter = {};

    if (req.query.type) {
        filter.type = req.query.type;
    }

    try {
        const announcements = await Announcement.find(filter)
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        return res.json(announcements);
    } catch (err) {
        return handleError(res, err, 'fetch announcements');
    }
};

// Admin only: create an announcement, with an optional banner image
export const createAnnouncement = async (req, res) => {
    const { type, title, description } = req.body;

    if (!REQUIRED_FIELDS[type]) {
        return res.status(400).json({ message: 'type must be announcement, event, competition or news' });
    }

    if (!title) {
        return res.status(400).json({ message: 'title is required' });
    }

    if (!description) {
        return res.status(400).json({ message: 'description is required' });
    }

    // Check the fields that this type needs
    const missing = REQUIRED_FIELDS[type].filter((field) => !req.body[field]);

    if (missing.length > 0) {
        return res.status(400).json({ message: `Missing for ${type}: ${missing.join(', ')}` });
    }

    try {
        const announcement = new Announcement({
            type,
            title,
            description,
            eventDate: req.body.eventDate || undefined,
            location: req.body.location || undefined,
            deadline: req.body.deadline || undefined,
            link: req.body.link || undefined,
            createdBy: req.user.id,
        });

        // If a banner was uploaded, send it to Cloudinary and save the URL
        if (req.file) {
            const image = await uploadBufferToCloudinary(req.file.buffer);
            announcement.bannerUrl = image.secure_url;
            announcement.bannerPublicId = image.public_id;
        }

        await announcement.save();

        return res.status(201).json({ message: 'Announcement published', announcement });
    } catch (err) {
        return handleError(res, err, 'create announcement');
    }
};

// Admin only: delete an announcement and its banner image
export const deleteAnnouncement = async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    try {
        const announcement = await Announcement.findByIdAndDelete(id);

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        if (announcement.bannerPublicId) {
            await deleteFromCloudinary(announcement.bannerPublicId);
        }

        return res.json({ message: 'Announcement deleted' });
    } catch (err) {
        return handleError(res, err, 'delete announcement');
    }
};
import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { uploadBanner } from '../middleware/upload.js';
import {
    getAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
} from '../controllers/announcement.controller.js';

const AnnouncementRouter = express.Router();

// Public
AnnouncementRouter.get('/announcement', getAnnouncements);

// Admin only. uploadBanner must come before the controller so req.file exists.
AnnouncementRouter.post('/announcement', authenticate, requireAdmin, uploadBanner, createAnnouncement);
AnnouncementRouter.delete('/announcement/:id', authenticate, requireAdmin, deleteAnnouncement);

export default AnnouncementRouter;
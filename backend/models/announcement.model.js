import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const announcementSchema = new Schema(
    {
        type: {
            type: String,
            enum: ['announcement', 'event', 'competition', 'news'],
            required: true,
        },
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true },

        // Cloudinary banner (optional)
        bannerUrl: String,
        bannerPublicId: String,

        // Only some types use these
        eventDate: Date,
        location: String,
        deadline: Date,
        link: String,

        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

// Newest first is the most common query, so index it
announcementSchema.index({ type: 1, createdAt: -1 });

export default model('Announcement', announcementSchema);
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const apiTokenSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        name: { type: String, required: true, trim: true, maxlength: 60 },
        tokenHash: { type: String, required: true, unique: true },
        lastUsedAt: Date,
    },
    { timestamps: true }
);

export default model('ApiToken', apiTokenSchema);
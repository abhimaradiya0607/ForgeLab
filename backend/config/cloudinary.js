import { v2 as cloudinary } from 'cloudinary';

// Read the .env values when this runs, not when the file loads
function configureCloudinary() {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

// Sends an image buffer to Cloudinary and waits for the result
export function uploadBufferToCloudinary(buffer) {
    configureCloudinary();

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'forgelab/announcements' },
            (err, result) => (err ? reject(err) : resolve(result))
        );
        stream.end(buffer);
    });
}

// Deletes an image from Cloudinary by its public ID
export function deleteFromCloudinary(publicId) {
    configureCloudinary();
    return cloudinary.uploader.destroy(publicId);
}
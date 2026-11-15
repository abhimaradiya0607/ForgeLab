import multer from 'multer';

// Keeps the file in memory, accepts only images up to 5 MB, and reads the field named "banner"
export const uploadBanner = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        cb(null, file.mimetype.startsWith('image/'));
    },
}).single('banner');
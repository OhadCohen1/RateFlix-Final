import type { Request } from 'express';
import multer from 'multer';
import type { FileFilterCallback } from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';

// קונפיג Cloudinary נטען מה-CLOUDINARY_URL.
cloudinary.config({ secure: true });

// שומרים קובץ בזיכרון ומזרימים ישר ל-Cloudinary.
const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

export const saveToMemory = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // עד 5MB
});

// מעלה באפר תמונה ל-Cloudinary ומחזיר תוצאה.
export const uploadImageBuffer = (
  buffer: Buffer,
  folder = 'rateflix/posters'
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload returned no result'));
        } else {
          resolve(result);
        }
      }
    );
    stream.end(buffer);
  });
};

export { cloudinary };

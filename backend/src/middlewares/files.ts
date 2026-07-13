import type { Request } from 'express';
import multer from 'multer';
import type { FileFilterCallback } from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';

// Cloudinary config (course files.ts convention): the SDK configures itself
// automatically from the CLOUDINARY_URL env var (cloudinary://key:secret@name)
cloudinary.config({ secure: true });

// Keep the file in memory as a Buffer - it is streamed straight to Cloudinary,
// so nothing is written to the local disk
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max poster size
});

/**
 * Streams an in-memory file buffer (from Multer) to Cloudinary and resolves
 * with the upload result, including the secure https URL.
 */
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

import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import { env } from '../config/env.js';

let storage;

const isCloudinaryConfigured = 
  env.CLOUDINARY_CLOUD_NAME && 
  env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  env.CLOUDINARY_API_KEY && 
  env.CLOUDINARY_API_KEY !== 'your_api_key';

if (isCloudinaryConfigured) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      const isPdf = file.mimetype === 'application/pdf';
      return {
        folder: 'barberqueue/documents',
        resource_type: isPdf ? 'auto' : 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
      };
    },
  });
} else {
  // Fallback to memory storage if Cloudinary is not configured
  storage = multer.memoryStorage();
}

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Error: Invalid file type. Only JPG, PNG and PDF are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export const uploadDocuments = upload.fields([
  { name: 'establishmentCert', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
  { name: 'shopPhoto', maxCount: 1 },
  { name: 'gstin', maxCount: 1 },
  { name: 'shopProof', maxCount: 1 },
]);

export const uploadShopPhotos = upload.array('photos', 5);

export const uploadAvatar = upload.single('avatar');

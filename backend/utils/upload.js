import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'ayutrace',
    resource_type: 'auto',
    public_id: `${Date.now()}-${file.originalname}`.replace(/[^a-zA-Z0-9-_\.]/g, '_')
  })
});

export const upload = multer({ storage });

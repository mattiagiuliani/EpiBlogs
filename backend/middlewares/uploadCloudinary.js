import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import CloudinaryStorage from 'multer-storage-cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    api_key: process.env.CLOUDINARY_API_KEY?.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
});

const storageCloudinary = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'epiBlogs',
    }
});

const uploadCloudinary = multer({ storage: storageCloudinary });

export default uploadCloudinary;

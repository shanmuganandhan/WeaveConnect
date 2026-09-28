const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/AppError');

const createStorage = ({ folder = 'weave-connect/uploads', maxWidth = 1000 } = {}) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: [{ width: maxWidth, crop: 'limit' }],
    },
  });

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    return cb(null, true);
  }
  cb(new AppError(400, 'Only image files are allowed'));
};

const uploadImages = ({ folder, maxWidth, maxCount = 5 } = {}) => {
  const uploader = multer({
    storage: createStorage({ folder, maxWidth }),
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  }).array('images', maxCount);

  return (req, res, next) => {
    uploader(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return next(new AppError(400, err.message));
        }
        return next(err);
      }
      next();
    });
  };
};

module.exports = uploadImages;

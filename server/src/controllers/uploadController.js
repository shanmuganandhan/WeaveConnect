const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');

const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new AppError(400, 'No images uploaded');
  }

  const urls = req.files.map((file) => file.path);

  success(res, {
    message: 'Images uploaded successfully',
    data: { urls },
  });
});

module.exports = { uploadImages };

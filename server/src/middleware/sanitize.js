const sanitizeObject = (value) => {
  if (Array.isArray(value)) {
    value.forEach(sanitizeObject);
    return value;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete value[key];
      } else {
        sanitizeObject(value[key]);
      }
    }
  }
  return value;
};

const mongoSanitize = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  next();
};

module.exports = mongoSanitize;

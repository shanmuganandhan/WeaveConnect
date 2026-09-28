const success = (res, { statusCode = 200, message = 'Success', data } = {}) => {
  const body = { success: true, message };
  if (data !== undefined) body.data = data;
  res.status(statusCode).json(body);
};

const error = (res, statusCode, message, errors) => {
  const body = { success: false, message };
  if (errors !== undefined) body.errors = errors;
  res.status(statusCode).json(body);
};

module.exports = { success, error };

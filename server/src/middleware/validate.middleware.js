const { errorResponse } = require('../utils/apiResponse');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    if (err.errors) {
      const formattedErrors = err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message
      }));
      return errorResponse(res, 'Validation failed', 400, formattedErrors);
    }
    return errorResponse(res, err.message, 400);
  }
};

module.exports = validate;

const { errorResponse } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Handle Prisma Errors
  if (err.code) {
    switch (err.code) {
      case 'P2002': // Unique constraint failed
        statusCode = 409;
        const targetFields = err.meta?.target ? err.meta.target.join(', ') : 'fields';
        message = `A record with this ${targetFields} already exists.`;
        break;
      case 'P2025': // Record to update not found
        statusCode = 404;
        message = err.meta?.cause || 'Record not found.';
        break;
      default:
        console.error('Prisma Error:', err);
        statusCode = 400;
        message = 'Database operation failed.';
        break;
    }
  }

  // Handle JWT Errors
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Unauthorized: Access token has expired.';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Unauthorized: Invalid access token.';
  }

  // Log full stack trace in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Details:', err);
  }

  return errorResponse(res, message, statusCode, errors);
};

module.exports = errorHandler;

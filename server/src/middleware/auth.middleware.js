const { verifyAccessToken } = require('../utils/jwtHelper');
const { errorResponse } = require('../utils/apiResponse');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Unauthorized: Access token missing.', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // { userId, email, role }
    next();
  } catch (err) {
    next(err); // Pass JWT error to the global handler
  }
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
  } catch (err) {
    // Fail silently for optional auth
  }
  next();
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized: Access token missing.', 401);
    }
    
    // BOTH role allows any RENTER or HOST operation
    const userRole = req.user.role;
    const hasRole = roles.includes(userRole) || userRole === 'BOTH' || userRole === 'ADMIN';

    if (!hasRole) {
      return errorResponse(res, 'Forbidden: You do not have the required permissions.', 403);
    }
    next();
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  requireRole
};

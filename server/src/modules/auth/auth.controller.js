const authService = require('./auth.service');
const { successResponse } = require('../../utils/apiResponse');

const setTokenCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  res.cookie('refreshToken', token, cookieOptions);
};

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    setTokenCookie(res, result.refreshToken);
    return successResponse(res, {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    }, 'User registered successfully. Please verify your email.', 201);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    setTokenCookie(res, result.refreshToken);
    return successResponse(res, {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    }, 'Login successful.');
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    await authService.logout(userId);
    res.clearCookie('refreshToken');
    return successResponse(res, null, 'Logged out successfully.');
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    // Check both cookie and body
    const token = req.body.refreshToken || req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token missing.' });
    }

    const result = await authService.refresh(token);
    setTokenCookie(res, result.refreshToken);
    return successResponse(res, {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    }, 'Token refreshed successfully.');
  } catch (err) {
    next(err);
  }
};

const googleOAuth = async (req, res, next) => {
  try {
    const result = await authService.googleOAuth(req.body);
    setTokenCookie(res, result.refreshToken);
    return successResponse(res, {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    }, 'Google authentication successful.');
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    return successResponse(res, null, 'OTP sent to your registered email.');
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    await authService.resetPassword(email, otp, newPassword);
    return successResponse(res, null, 'Password reset successful. Please login with your new password.');
  } catch (err) {
    next(err);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token missing.' });
    }
    await authService.verifyEmail(token);
    return successResponse(res, null, 'Email verified successfully. You can now login.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  logout,
  refresh,
  googleOAuth,
  forgotPassword,
  resetPassword,
  verifyEmail
};

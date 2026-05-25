const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/jwtHelper');
const { sendEmail } = require('../../utils/emailService');

// In-memory cache to replace Redis
const memCache = new Map();

// Helper for expiring keys
const setCache = (key, value, ttlSeconds) => {
  const expiry = Date.now() + ttlSeconds * 1000;
  memCache.set(key, { value, expiry });
};

const getCache = (key) => {
  const item = memCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    memCache.delete(key);
    return null;
  }
  return item.value;
};

const delCache = (key) => {
  memCache.delete(key);
};

const register = async (userData) => {
  const { email, password, fullName, phone, role, city, state, country } = userData;

  // Check if user already exists
  const orConditions = [{ email }];
  if (phone) orConditions.push({ phone });

  const existingUser = await User.findOne({ $or: orConditions });

  if (existingUser) {
    const error = new Error('Email or phone number is already registered.');
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const user = await User.create({
    email,
    passwordHash,
    fullName,
    phone: phone || null,
    role: role || 'RENTER',
    city,
    state,
    country,
    isVerified: false
  });

  // Generate email verification token
  const token = crypto.randomBytes(32).toString('hex');
  setCache(`verify_email:${token}`, user.id, 24 * 60 * 60); // 24 hours

  // Send verification email
  const verifyLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Welcome to RentAll - Verify Your Email',
    html: `
      <h2>Welcome ${user.fullName}!</h2>
      <p>Thank you for signing up for RentAll. Please verify your email by clicking the link below:</p>
      <a href="${verifyLink}" style="padding: 10px 20px; background-color: #FF5A1F; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
      <p>This link is valid for 24 hours.</p>
    `
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token in memory Cache
  setCache(`refresh:${user.id}`, refreshToken, 7 * 24 * 60 * 60); // 7 days

  const userObj = user.toJSON();
  delete userObj.passwordHash;

  return {
    user: userObj,
    accessToken,
    refreshToken
  };
};

const login = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user || !user.passwordHash) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  setCache(`refresh:${user.id}`, refreshToken, 7 * 24 * 60 * 60);

  const userObj = user.toJSON();
  delete userObj.passwordHash;

  return {
    user: userObj,
    accessToken,
    refreshToken
  };
};

const logout = async (userId) => {
  delCache(`refresh:${userId}`);
  return true;
};

const refresh = async (token) => {
  try {
    const decoded = verifyRefreshToken(token);
    const userId = decoded.userId;

    const storedToken = getCache(`refresh:${userId}`);
    if (!storedToken || storedToken !== token) {
      const error = new Error('Invalid or expired refresh token.');
      error.statusCode = 401;
      throw error;
    }

    const user = await User.findById(userId);

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    setCache(`refresh:${userId}`, newRefreshToken, 7 * 24 * 60 * 60);

    const userObj = user.toJSON();
    delete userObj.passwordHash;

    return {
      user: userObj,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  } catch (err) {
    const error = new Error('Unauthorized refresh attempt.');
    error.statusCode = 401;
    throw error;
  }
};

const googleOAuth = async (profile) => {
  const { googleId, email, fullName, avatarUrl } = profile;

  // Find or create user
  let user = await User.findOne({ email });

  if (user) {
    // Update googleId if not present
    if (!user.googleId) {
      user.googleId = googleId;
      if (avatarUrl) user.avatarUrl = user.avatarUrl || avatarUrl;
      user.isVerified = true;
      await user.save();
    }
  } else {
    // Create new user (skip password hash since it is Google OAuth)
    user = await User.create({
      email,
      fullName,
      googleId,
      avatarUrl,
      isVerified: true,
      city: 'N/A', // Placeholders to be updated by user later
      state: 'N/A',
      country: 'N/A'
    });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  setCache(`refresh:${user.id}`, refreshToken, 7 * 24 * 60 * 60);

  const userObj = user.toJSON();
  delete userObj.passwordHash;

  return {
    user: userObj,
    accessToken,
    refreshToken
  };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    const error = new Error('User with this email does not exist.');
    error.statusCode = 404;
    throw error;
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  setCache(`otp:${email}`, otp, 10 * 60); // 10 minutes TTL

  await sendEmail({
    to: email,
    subject: 'RentAll - Password Reset Verification OTP',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password. Use the following 6-digit One-Time Password (OTP) to complete the action:</p>
      <div style="font-size: 24px; font-weight: bold; color: #FF5A1F; padding: 10px; background-color: #f5f5f5; width: fit-content; border-radius: 5px;">
        ${otp}
      </div>
      <p>This OTP is valid for 10 minutes.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `
  });

  return true;
};

const resetPassword = async (email, otp, newPassword) => {
  const cachedOtp = getCache(`otp:${email}`);
  if (!cachedOtp || cachedOtp !== otp) {
    const error = new Error('Invalid or expired OTP.');
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await User.findOneAndUpdate({ email }, { passwordHash });

  delCache(`otp:${email}`);
  return true;
};

const verifyEmail = async (token) => {
  const userId = getCache(`verify_email:${token}`);
  if (!userId) {
    const error = new Error('Invalid or expired email verification link.');
    error.statusCode = 400;
    throw error;
  }

  await User.findByIdAndUpdate(userId, { isVerified: true });

  delCache(`verify_email:${token}`);
  return true;
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

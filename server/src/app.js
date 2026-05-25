const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

const apiRateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Import routers
const authRouter = require('./modules/auth/auth.routes');
const usersRouter = require('./modules/users/users.routes');
const listingsRouter = require('./modules/listings/listings.routes');
const bookingsRouter = require('./modules/bookings/bookings.routes');
const paymentsRouter = require('./modules/payments/payments.routes');
const messagesRouter = require('./modules/messages/messages.routes');
const reviewsRouter = require('./modules/reviews/reviews.routes');
const searchRouter = require('./modules/search/search.routes');
const wishlistRouter = require('./modules/wishlist/wishlist.routes');
const notificationsRouter = require('./modules/notifications/notifications.routes');

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      process.env.CORS_ORIGIN
    ].filter(Boolean);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));

// Request parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiting
app.use('/api', apiRateLimiter);

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/listings', listingsRouter);
app.use('/api/v1/bookings', bookingsRouter);
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/messages', messagesRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/wishlist', wishlistRouter);
app.use('/api/v1/notifications', notificationsRouter);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to RentAll API v1' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  res.status(200).json(healthCheck);
});

// 404 Not Found Handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;

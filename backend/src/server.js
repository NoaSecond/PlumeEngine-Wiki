const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Database configuration
const DatabaseManager = require('./config/database');

// Routes
const authRoutes = require('./routes/auth');
const activityRoutes = require('./routes/activities');
const wikiRoutes = require('./routes/wiki');
const tagsRoutes = require('./routes/tags');
const permissionsRoutes = require('./routes/permissions');
const commentRoutes = require('./routes/comments');
const exportRoutes = require('./routes/export');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
const dbManager = new DatabaseManager();

// CORS middleware - MUST BE BEFORE HELMET AND OTHER MIDDLEWARE
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5176',
    /^http:\/\/localhost:\d+$/,
    process.env.NODE_ENV === 'production' ? `https://${process.env.HOST || 'localhost'}` : null
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Performance monitoring
const performanceMonitor = require('./middleware/performanceMonitor');
app.use(performanceMonitor);

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit in development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  skip: (req) => req.method === 'OPTIONS' // Skip preflight requests
});
app.use(limiter);

// Parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined'));

// Trust proxy to get real IPs behind reverse proxy
app.set('trust proxy', 1);

// Middleware to attach database to requests
app.use((req, res, next) => {
  req.db = dbManager;
  next();
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/wiki', wikiRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/export', exportRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'Open Book Wiki API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      activities: '/api/activities',
      wiki: '/api/wiki',
      health: '/health'
    }
  });
});

// Swagger Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const logger = require('./utils/logger');

// ... (imports)

const errorHandler = require('./middleware/errorHandler');

// ... (previous code)

// Global error handling middleware
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    logger.info('🚀 Initializing database...');
    await dbManager.connect();
    await dbManager.initializeTables();

    // Start server
    app.listen(PORT, () => {
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const host = process.env.HOST || 'localhost';
      logger.info(`✅ Server started on ${protocol}://${host}:${PORT}`);
      logger.info(`📊 API Interface available at ${protocol}://${host}:${PORT}`);
      logger.info(`🔗 Frontend expected at ${process.env.FRONTEND_URL || `http://${host}:5176`}`);
    });

  } catch (error) {
    logger.error('❌ Error during server startup:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  logger.info('\n🛑 Stopping server...');
  await dbManager.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('\n🛑 Stopping server...');
  await dbManager.close();
  process.exit(0);
});

// Start server if run directly
if (require.main === module) {
  startServer();
}

module.exports = { app, dbManager, startServer };

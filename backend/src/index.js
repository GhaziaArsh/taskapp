/**
 * Task Manager Backend API
 * Enterprise-grade Node.js + Express REST API
 * 
 * Features:
 * - RESTful CRUD operations for tasks
 * - Azure SQL Database integration
 * - Security middleware (Helmet, CORS, Rate Limiting)
 * - Health check endpoint
 * - Structured logging with Morgan
 * - Graceful fallback to in-memory storage for development
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const taskRoutes = require('./routes/tasks');
const healthRoutes = require('./routes/health');
const { initializeDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security Middleware ────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ─── Body Parsing & Logging ────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// ─── Routes ────────────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/tasks', taskRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'TaskApp Backend API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/health',
    endpoints: {
      health: '/api/health',
      tasks: '/api/tasks'
    }
  });
});

// ─── 404 Handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString()
  });
});

// ─── Global Error Handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`, err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ─── Server Startup ────────────────────────────────────────
async function startServer() {
  try {
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.warn('⚠️  Database connection failed, using in-memory fallback:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║         TaskApp Backend API v1.0.0               ║
║──────────────────────────────────────────────────║
║  🚀 Server running on port ${PORT}                ║
║  📦 Environment: ${process.env.NODE_ENV || 'development'}               ║
║  🔗 Health: http://localhost:${PORT}/api/health    ║
║  📋 Tasks:  http://localhost:${PORT}/api/tasks     ║
╚══════════════════════════════════════════════════╝
    `);
  });
}

startServer();

module.exports = app;

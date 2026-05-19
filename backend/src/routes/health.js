/**
 * Health Check Routes
 * Provides health and readiness endpoints for Azure App Service
 */

const express = require('express');
const router = express.Router();
const { getPool, isInMemoryMode } = require('../config/database');

// GET /api/health - Basic health check
router.get('/', async (req, res) => {
  const healthCheck = {
    status: 'healthy',
    service: 'TaskApp Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: !isInMemoryMode(),
      mode: isInMemoryMode() ? 'in-memory' : 'azure-sql'
    }
  };

  // Test database connection if available
  if (!isInMemoryMode()) {
    try {
      const pool = getPool();
      await pool.request().query('SELECT 1 AS healthcheck');
      healthCheck.database.status = 'connected';
    } catch (err) {
      healthCheck.database.status = 'error';
      healthCheck.database.error = err.message;
      healthCheck.status = 'degraded';
    }
  }

  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

// GET /api/health/ready - Readiness probe
router.get('/ready', async (req, res) => {
  if (isInMemoryMode()) {
    return res.status(200).json({ ready: true, mode: 'in-memory' });
  }

  try {
    const pool = getPool();
    await pool.request().query('SELECT 1');
    res.status(200).json({ ready: true, mode: 'azure-sql' });
  } catch (err) {
    res.status(503).json({ ready: false, error: err.message });
  }
});

// GET /api/health/live - Liveness probe
router.get('/live', (req, res) => {
  res.status(200).json({ alive: true, timestamp: new Date().toISOString() });
});

module.exports = router;

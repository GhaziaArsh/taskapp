/**
 * Database Configuration
 * Supports Azure SQL Server with in-memory fallback for local development
 */

const sql = require('mssql');

let pool = null;
let useInMemory = false;

// In-memory store for development/fallback
let inMemoryTasks = [
  {
    id: '1',
    title: 'Set up Azure DevOps Pipeline',
    description: 'Create CI/CD pipeline with multi-stage deployment to Azure App Service',
    status: 'in-progress',
    priority: 'high',
    category: 'devops',
    created_at: new Date('2026-01-15').toISOString(),
    updated_at: new Date('2026-01-15').toISOString(),
    due_date: new Date('2026-02-01').toISOString(),
    completed_at: null
  },
  {
    id: '2',
    title: 'Dockerize Backend Application',
    description: 'Write multi-stage Dockerfile for the Node.js Express backend',
    status: 'completed',
    priority: 'high',
    category: 'devops',
    created_at: new Date('2026-01-10').toISOString(),
    updated_at: new Date('2026-01-12').toISOString(),
    due_date: new Date('2026-01-14').toISOString(),
    completed_at: new Date('2026-01-12').toISOString()
  },
  {
    id: '3',
    title: 'Configure Azure SQL Database',
    description: 'Provision Azure SQL serverless tier and run schema initialization',
    status: 'todo',
    priority: 'medium',
    category: 'infrastructure',
    created_at: new Date('2026-01-16').toISOString(),
    updated_at: new Date('2026-01-16').toISOString(),
    due_date: new Date('2026-02-05').toISOString(),
    completed_at: null
  },
  {
    id: '4',
    title: 'Implement Terraform IaC',
    description: 'Replace manual Azure portal provisioning with Terraform configuration files',
    status: 'todo',
    priority: 'low',
    category: 'infrastructure',
    created_at: new Date('2026-01-17').toISOString(),
    updated_at: new Date('2026-01-17').toISOString(),
    due_date: new Date('2026-02-10').toISOString(),
    completed_at: null
  },
  {
    id: '5',
    title: 'Set up SonarQube SAST',
    description: 'Provision SonarQube on Azure VM and integrate with Azure DevOps pipeline',
    status: 'todo',
    priority: 'medium',
    category: 'security',
    created_at: new Date('2026-01-18').toISOString(),
    updated_at: new Date('2026-01-18').toISOString(),
    due_date: new Date('2026-02-15').toISOString(),
    completed_at: null
  }
];

const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  server: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '1433'),
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true,
    trustServerCertificate: process.env.NODE_ENV === 'development'
  }
};

async function initializeDatabase() {
  try {
    pool = await sql.connect(sqlConfig);
    console.log('📦 Connected to Azure SQL Database');
    
    // Create tasks table if it doesn't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tasks' AND xtype='U')
      CREATE TABLE tasks (
        id NVARCHAR(50) PRIMARY KEY DEFAULT NEWID(),
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        status NVARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'completed')),
        priority NVARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        category NVARCHAR(50) DEFAULT 'general',
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE(),
        due_date DATETIME2,
        completed_at DATETIME2
      )
    `);
    
    useInMemory = false;
    return pool;
  } catch (err) {
    console.warn('⚠️  SQL connection failed, using in-memory store:', err.message);
    useInMemory = true;
    throw err;
  }
}

function getPool() {
  return pool;
}

function isInMemoryMode() {
  return useInMemory;
}

function getInMemoryTasks() {
  return inMemoryTasks;
}

function setInMemoryTasks(tasks) {
  inMemoryTasks = tasks;
}

module.exports = {
  initializeDatabase,
  getPool,
  isInMemoryMode,
  getInMemoryTasks,
  setInMemoryTasks,
  sql
};

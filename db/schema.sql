-- ============================================================
-- TaskApp Database Schema
-- Azure SQL Server Initialization Script
-- ============================================================

-- Create the tasks table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tasks' AND xtype='U')
BEGIN
    CREATE TABLE tasks (
        id NVARCHAR(50) PRIMARY KEY DEFAULT NEWID(),
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        status NVARCHAR(20) DEFAULT 'todo' 
            CHECK (status IN ('todo', 'in-progress', 'completed')),
        priority NVARCHAR(10) DEFAULT 'medium' 
            CHECK (priority IN ('low', 'medium', 'high')),
        category NVARCHAR(50) DEFAULT 'general',
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE(),
        due_date DATETIME2,
        completed_at DATETIME2
    );

    -- Create indexes for common queries
    CREATE INDEX IX_tasks_status ON tasks(status);
    CREATE INDEX IX_tasks_priority ON tasks(priority);
    CREATE INDEX IX_tasks_category ON tasks(category);
    CREATE INDEX IX_tasks_created_at ON tasks(created_at DESC);

    PRINT 'Tasks table created successfully.';
END
ELSE
BEGIN
    PRINT 'Tasks table already exists.';
END
GO

-- ============================================================
-- Insert sample data
-- ============================================================
IF NOT EXISTS (SELECT TOP 1 * FROM tasks)
BEGIN
    INSERT INTO tasks (title, description, status, priority, category, due_date) VALUES
    ('Set up Azure DevOps Pipeline', 
     'Create CI/CD pipeline with multi-stage deployment to Azure App Service', 
     'in-progress', 'high', 'devops', DATEADD(DAY, 14, GETUTCDATE())),

    ('Dockerize Backend Application', 
     'Write multi-stage Dockerfile for the Node.js Express backend', 
     'completed', 'high', 'devops', DATEADD(DAY, 7, GETUTCDATE())),

    ('Configure Azure SQL Database', 
     'Provision Azure SQL serverless tier and run schema initialization', 
     'todo', 'medium', 'infrastructure', DATEADD(DAY, 21, GETUTCDATE())),

    ('Implement Terraform IaC', 
     'Replace manual Azure portal provisioning with Terraform configuration files', 
     'todo', 'low', 'infrastructure', DATEADD(DAY, 28, GETUTCDATE())),

    ('Set up SonarQube SAST', 
     'Provision SonarQube on Azure VM and integrate with Azure DevOps pipeline', 
     'todo', 'medium', 'security', DATEADD(DAY, 35, GETUTCDATE()));

    PRINT 'Sample data inserted successfully.';
END
GO

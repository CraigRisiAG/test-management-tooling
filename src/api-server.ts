/**
 * @file api-server.ts
 * @description REST API server for test-management-tooling
 * Provides HTTP endpoints for all CLI functionality with cloud storage integration
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { UserManager } from './modules/user-manager';
import { IssueManager } from './modules/issue-manager';
import { DefectManager } from './modules/defect-manager';
import { TestManager } from './modules/test-manager';
import { CloudStorageAdapter } from './storage/cloud-storage-adapter';

const app = express();
const PORT = process.env.PORT || 3000;
const USE_CLOUD_STORAGE = process.env.USE_CLOUD_STORAGE === 'true';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize managers with cloud storage if enabled
let userManager: UserManager;
let issueManager: IssueManager;
let defectManager: DefectManager;
let testManager: TestManager;

async function initializeManagers() {
  if (USE_CLOUD_STORAGE) {
    console.log('Initializing with cloud storage (DynamoDB + S3)...');
    const cloudStorage = new CloudStorageAdapter();
    await cloudStorage.initialize();
    
    userManager = new UserManager(cloudStorage);
    issueManager = new IssueManager(cloudStorage);
    defectManager = new DefectManager(cloudStorage);
    testManager = new TestManager(cloudStorage);
  } else {
    console.log('Initializing with local file storage...');
    userManager = new UserManager();
    issueManager = new IssueManager();
    defectManager = new DefectManager();
    testManager = new TestManager();
  }
}

// Health check endpoints
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    storage: USE_CLOUD_STORAGE ? 'cloud' : 'local'
  });
});

app.get('/ready', (req: Request, res: Response) => {
  if (!userManager || !issueManager || !defectManager || !testManager) {
    return res.status(503).json({
      status: 'not ready',
      message: 'Managers not initialized'
    });
  }
  
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint (for Prometheus scraping)
app.get('/metrics', (req: Request, res: Response) => {
  // Basic metrics - can be enhanced with proper metrics library
  res.status(200).send(`
# HELP testmgr_uptime_seconds Application uptime in seconds
# TYPE testmgr_uptime_seconds gauge
testmgr_uptime_seconds ${process.uptime()}

# HELP testmgr_memory_usage_bytes Memory usage in bytes
# TYPE testmgr_memory_usage_bytes gauge
testmgr_memory_usage_bytes ${process.memoryUsage().heapUsed}
  `.trim());
});

// ===========================
// User Management API Routes
// ===========================

app.get('/api/v1/users', async (req: Request, res: Response) => {
  try {
    const users = await userManager.getAllUsers();
    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/v1/users/:username', async (req: Request, res: Response) => {
  try {
    const user = await userManager.getUser(req.params.username);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/v1/users', async (req: Request, res: Response) => {
  try {
    const { username, password, role, permissions } = req.body;
    
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: username, password, role'
      });
    }
    
    await userManager.createUser(username, password, role, permissions);
    res.status(201).json({ success: true, message: 'User created successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/v1/users/:username', async (req: Request, res: Response) => {
  try {
    await userManager.deleteUser(req.params.username);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/v1/users/:username/permissions', async (req: Request, res: Response) => {
  try {
    const { module, permissions } = req.body;
    
    if (!module || !permissions) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: module, permissions'
      });
    }
    
    await userManager.setModulePermissions(req.params.username, module, permissions);
    res.json({ success: true, message: 'Permissions updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===========================
// Test Management API Routes
// ===========================

app.get('/api/v1/tests', async (req: Request, res: Response) => {
  try {
    const tests = await testManager.getAllTests();
    res.json({ success: true, data: tests });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/v1/tests/:id', async (req: Request, res: Response) => {
  try {
    const test = await testManager.getTest(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, error: 'Test not found' });
    }
    res.json({ success: true, data: test });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/v1/tests', async (req: Request, res: Response) => {
  try {
    const { title, description, status, priority, assignee } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: title'
      });
    }
    
    const test = await testManager.createTest(title, description, status, priority, assignee);
    res.status(201).json({ success: true, data: test });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/v1/tests/:id', async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    await testManager.updateTest(req.params.id, updates);
    res.json({ success: true, message: 'Test updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/v1/tests/:id', async (req: Request, res: Response) => {
  try {
    await testManager.deleteTest(req.params.id);
    res.json({ success: true, message: 'Test deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===========================
// Issue Management API Routes
// ===========================

app.get('/api/v1/issues', async (req: Request, res: Response) => {
  try {
    const issues = await issueManager.getAllIssues();
    res.json({ success: true, data: issues });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/v1/issues/:id', async (req: Request, res: Response) => {
  try {
    const issue = await issueManager.getIssue(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found' });
    }
    res.json({ success: true, data: issue });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/v1/issues', async (req: Request, res: Response) => {
  try {
    const { title, description, severity, status, assignee } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: title'
      });
    }
    
    const issue = await issueManager.createIssue(title, description, severity, status, assignee);
    res.status(201).json({ success: true, data: issue });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/v1/issues/:id', async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    await issueManager.updateIssue(req.params.id, updates);
    res.json({ success: true, message: 'Issue updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/v1/issues/:id', async (req: Request, res: Response) => {
  try {
    await issueManager.deleteIssue(req.params.id);
    res.json({ success: true, message: 'Issue deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================
// Defect Management API Routes
// ============================

app.get('/api/v1/defects', async (req: Request, res: Response) => {
  try {
    const defects = await defectManager.getAllDefects();
    res.json({ success: true, data: defects });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/v1/defects/:id', async (req: Request, res: Response) => {
  try {
    const defect = await defectManager.getDefect(req.params.id);
    if (!defect) {
      return res.status(404).json({ success: false, error: 'Defect not found' });
    }
    res.json({ success: true, data: defect });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/v1/defects', async (req: Request, res: Response) => {
  try {
    const { title, description, severity, status, priority, assignee } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: title'
      });
    }
    
    const defect = await defectManager.createDefect(title, description, severity, status, priority, assignee);
    res.status(201).json({ success: true, data: defect });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/v1/defects/:id', async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    await defectManager.updateDefect(req.params.id, updates);
    res.json({ success: true, message: 'Defect updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/v1/defects/:id', async (req: Request, res: Response) => {
  try {
    await defectManager.deleteDefect(req.params.id);
    res.json({ success: true, message: 'Defect deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    path: req.path
  });
});

// Start server
async function startServer() {
  try {
    await initializeManagers();
    
    app.listen(PORT, () => {
      console.log(`✅ API Server running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Storage: ${USE_CLOUD_STORAGE ? 'Cloud (DynamoDB + S3)' : 'Local Files'}`);
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log(`   API: http://localhost:${PORT}/api/v1/`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();

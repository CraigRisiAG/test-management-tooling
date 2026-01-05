# Microservices Implementation Guide

## Quick Start

This guide provides step-by-step instructions to migrate the monolithic test management platform to microservices.

## Directory Structure

```
test-management-tooling/
├── services/
│   ├── api-gateway/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes.ts
│   │   │   └── middleware/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── user-admin/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   └── services/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── agile-board/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   └── services/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── code-tracer/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   └── services/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── pipeline/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   └── services/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── test-mgmt/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   └── services/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── reporting/
│       ├── src/
│       │   ├── index.ts
│       │   ├── routes/
│       │       ├── controllers/
│       │   └── services/
│       ├── Dockerfile
│       ├── package.json
│       └── tsconfig.json
├── shared/
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── logger.ts
│   └── events/
│       ├── event-bus.ts
│       └── events.ts
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
└── kubernetes/
    ├── api-gateway-deployment.yaml
    ├── user-admin-deployment.yaml
    ├── agile-board-deployment.yaml
    ├── code-tracer-deployment.yaml
    ├── pipeline-deployment.yaml
    ├── test-mgmt-deployment.yaml
    └── reporting-deployment.yaml
```

## Phase 1: Project Setup (Day 1)

### Step 1: Create Directory Structure

```bash
# Create services directories
mkdir -p services/api-gateway/src/middleware
mkdir -p services/user-admin/src/{routes,controllers,models,services}
mkdir -p services/agile-board/src/{routes,controllers,models,services}
mkdir -p services/code-tracer/src/{routes,controllers,services}
mkdir -p services/pipeline/src/{routes,controllers,services}
mkdir -p services/test-mgmt/src/{routes,controllers,models,services}
mkdir -p services/reporting/src/{routes,controllers,services}

# Create shared directory
mkdir -p shared/{types,utils,events}

# Create deployment directories
mkdir -p kubernetes
```

### Step 2: Create Shared Event Bus

File: `shared/events/event-bus.ts`

```typescript
export interface Event {
  id: string;
  type: string;
  timestamp: Date;
  source: string;
  data: any;
  correlationId?: string;
}

export class EventBus {
  private static subscribers: Map<string, Array<(event: Event) => void>> = new Map();

  static subscribe(eventType: string, handler: (event: Event) => void): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType)!.push(handler);
  }

  static publish(eventType: string, data: any, source: string, correlationId?: string): void {
    const event: Event = {
      id: this.generateId(),
      type: eventType,
      timestamp: new Date(),
      source,
      data,
      correlationId,
    };

    const handlers = this.subscribers.get(eventType) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error handling event ${eventType}:`, error);
      }
    });
  }

  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

File: `shared/events/events.ts`

```typescript
// Event type constants
export const Events = {
  // Story events
  STORY_CREATED: 'story.created',
  STORY_UPDATED: 'story.updated',
  STORY_DELETED: 'story.deleted',
  
  // Sprint events
  SPRINT_STARTED: 'sprint.started',
  SPRINT_COMPLETED: 'sprint.completed',
  
  // Test events
  TEST_CREATED: 'test.created',
  TEST_EXECUTED: 'test.executed',
  TEST_PASSED: 'test.passed',
  TEST_FAILED: 'test.failed',
  
  // Code events
  CODE_CHANGED: 'code.changed',
  CODE_LINKED: 'code.linked',
  CODE_COMMITTED: 'code.committed',
  
  // Pipeline events
  PIPELINE_STARTED: 'pipeline.started',
  PIPELINE_COMPLETED: 'pipeline.completed',
  DEPLOYMENT_SUCCESS: 'deployment.success',
  DEPLOYMENT_FAILED: 'deployment.failed',
  
  // Defect events
  DEFECT_CREATED: 'defect.created',
  DEFECT_RESOLVED: 'defect.resolved',
  
  // Issue events
  ISSUE_CREATED: 'issue.created',
  ISSUE_UPDATED: 'issue.updated',
};
```

### Step 3: Create Shared Types

File: `shared/types/index.ts`

```typescript
// Copy all interface definitions from current src/types/
export * from '../../src/types';

// Add service-specific types
export interface ServiceConfig {
  port: number;
  serviceName: string;
  apiGatewayUrl?: string;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}
```

## Phase 2: Implement Services (Days 2-5)

### Service Template

Each service follows this template:

File: `services/{service-name}/src/index.ts`

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { EventBus } from '../../../shared/events/event-bus';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 4001;
const SERVICE_NAME = process.env.SERVICE_NAME || 'user-admin';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${SERVICE_NAME}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: SERVICE_NAME });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`[${SERVICE_NAME}] Error:`, err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[${SERVICE_NAME}] Service running on port ${PORT}`);
});
```

### User Admin Service (Port 4001)

File: `services/user-admin/src/routes/index.ts`

```typescript
import express from 'express';
import { UserController } from '../controllers/user-controller';
import { TeamController } from '../controllers/team-controller';

const router = express.Router();
const userController = new UserController();
const teamController = new TeamController();

// User routes
router.post('/users/register', userController.register);
router.post('/users/login', userController.login);
router.get('/users/:id', userController.getUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

// Team routes
router.get('/teams', teamController.getTeams);
router.post('/teams', teamController.createTeam);
router.get('/teams/:id', teamController.getTeam);
router.get('/teams/:id/members', teamController.getTeamMembers);

export default router;
```

File: `services/user-admin/src/controllers/user-controller.ts`

```typescript
import { Request, Response } from 'express';
import { UserManager } from '../services/user-manager';

export class UserController {
  private userManager = new UserManager();

  register = async (req: Request, res: Response) => {
    try {
      const user = await this.userManager.register(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const result = await this.userManager.login(email, password);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  };

  getUser = async (req: Request, res: Response) => {
    try {
      const user = await this.userManager.getUser(req.params.id);
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(404).json({ success: false, error: 'User not found' });
    }
  };

  updateUser = async (req: Request, res: Response) => {
    try {
      const user = await this.userManager.updateUser(req.params.id, req.body);
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  };

  deleteUser = async (req: Request, res: Response) => {
    try {
      await this.userManager.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  };
}
```

File: `services/user-admin/src/services/user-manager.ts`

```typescript
// Copy from src/modules/user-manager.ts and adapt
import { EventBus, Events } from '../../../../shared/events';

export class UserManager {
  // ... existing user-manager.ts logic ...
  
  async register(userData: any) {
    const user = await this.createUser(userData);
    
    // Publish event
    EventBus.publish(Events.USER_CREATED, user, 'user-admin-service');
    
    return user;
  }
}
```

### Agile Board Service (Port 4002)

File: `services/agile-board/src/routes/index.ts`

```typescript
import express from 'express';
import { BoardController } from '../controllers/board-controller';
import { SprintController } from '../controllers/sprint-controller';
import { StoryController } from '../controllers/story-controller';

const router = express.Router();
const boardController = new BoardController();
const sprintController = new SprintController();
const storyController = new StoryController();

// Board routes
router.get('/boards', boardController.getBoards);
router.post('/boards', boardController.createBoard);
router.get('/boards/:id', boardController.getBoard);
router.put('/boards/:id', boardController.updateBoard);
router.delete('/boards/:id', boardController.deleteBoard);

// Sprint routes
router.get('/boards/:boardId/sprints', sprintController.getSprints);
router.post('/boards/:boardId/sprints', sprintController.createSprint);
router.get('/sprints/:id', sprintController.getSprint);
router.post('/sprints/:id/start', sprintController.startSprint);
router.post('/sprints/:id/complete', sprintController.completeSprint);

// Story routes
router.get('/stories', storyController.getStories);
router.post('/stories', storyController.createStory);
router.get('/stories/:id', storyController.getStory);
router.put('/stories/:id', storyController.updateStory);
router.delete('/stories/:id', storyController.deleteStory);
router.post('/stories/:id/move-to-sprint', storyController.moveToSprint);

export default router;
```

File: `services/agile-board/src/services/agile-module.ts`

```typescript
// Copy from src/modules/agile.ts and adapt
import { EventBus, Events } from '../../../../shared/events';

export class AgileModule {
  // ... existing agile.ts logic ...
  
  static async createStory(boardId: string, title: string, options: any) {
    const story = await this.createStoryInternal(boardId, title, options);
    
    // Publish event
    EventBus.publish(Events.STORY_CREATED, story, 'agile-board-service');
    
    return story;
  }
  
  // Subscribe to test execution events
  static init() {
    EventBus.subscribe(Events.TEST_EXECUTED, (event) => {
      console.log('Story received test execution event:', event.data);
      // Update story with test results
    });
  }
}

// Initialize event subscriptions
AgileModule.init();
```

## Phase 3: API Gateway (Days 6-7)

File: `services/api-gateway/src/index.ts`

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rate-limit';
import { loggingMiddleware } from './middleware/logging';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(loggingMiddleware);
app.use(rateLimitMiddleware);

// Service URLs
const services = {
  userAdmin: process.env.USER_ADMIN_URL || 'http://localhost:4001',
  agileBoard: process.env.AGILE_BOARD_URL || 'http://localhost:4002',
  codeTracer: process.env.CODE_TRACER_URL || 'http://localhost:4003',
  pipeline: process.env.PIPELINE_URL || 'http://localhost:4004',
  testMgmt: process.env.TEST_MGMT_URL || 'http://localhost:4005',
  reporting: process.env.REPORTING_URL || 'http://localhost:4006',
};

// Routes
app.use('/api/users', authMiddleware, createProxyMiddleware({
  target: services.userAdmin,
  changeOrigin: true,
  pathRewrite: { '^/api': '/api' },
}));

app.use('/api/teams', authMiddleware, createProxyMiddleware({
  target: services.userAdmin,
  changeOrigin: true,
  pathRewrite: { '^/api': '/api' },
}));

app.use('/api/boards', authMiddleware, createProxyMiddleware({
  target: services.agileBoard,
  changeOrigin: true,
  pathRewrite: { '^/api': '/api' },
}));

app.use('/api/sprints', authMiddleware, createProxyMiddleware({
  target: services.agileBoard,
  changeOrigin: true,
  pathRewrite: { '^/api': '/api' },
}));

app.use('/api/stories', authMiddleware, createProxyMiddleware({
  target: services.agileBoard,
  changeOrigin: true,
  pathRewrite: { '^/api': '/api' },
}));

app.use('/api/code', authMiddleware, createProxyMiddleware({
  target: services.codeTracer,
  changeOrigin: true,
  pathRewrite: { '^/api': '/api' },
}));

app.use('/api/repositories', authMiddleware, createProxyMiddleware({
  target: services.codeTracer,
  changeOrigin: true,
  pathRewrite: { '^/api': '/api' },
}));

app.use('/api/pipelines', authMiddleware, createProxyMiddleware({
  target: services.pipeline,
  changeOrigin: true,
  pathRewrite: { '^/api': '/api' },
}));

app.use('/api/git', authMiddleware, createProxyMiddleware({
  target: services.pipeline,
  changeOrigin: true,
  pathRewrite: { '^/api': '/api' },
}));

app.use('/api/tests', authMiddleware, createProxyMiddleware({
  target: services.testMgmt,
  changeOrigin: true,
  pathRewrite: { '^/api': '/api' },
}));

app.use('/api/defects', authMiddleware, createProxyMiddleware({
  target: services.testMgmt,
  changeOrigin: true,
  pathRewrite: { '^/api': '/api' },
}));

app.use('/api/issues', authMiddleware, createProxyMiddleware({
  target: services.testMgmt,
  changeOrigin: true,
  pathRewrite: { '^/api': '/api' },
}));

app.use('/api/reports', createProxyMiddleware({
  target: services.reporting,
  changeOrigin: true,
  pathRewrite: { '^/api': '/api' },
}));

app.use('/api/metrics', createProxyMiddleware({
  target: services.reporting,
  changeOrigin: true,
  pathRewrite: { '^/api': '/api' },
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'api-gateway' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
```

## Phase 4: Docker Configuration (Day 8)

File: `services/user-admin/Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 4001

CMD ["node", "dist/index.js"]
```

File: `docker-compose.yml`

```yaml
version: '3.8'

services:
  api-gateway:
    build: ./services/api-gateway
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - USER_ADMIN_URL=http://user-admin:4001
      - AGILE_BOARD_URL=http://agile-board:4002
      - CODE_TRACER_URL=http://code-tracer:4003
      - PIPELINE_URL=http://pipeline:4004
      - TEST_MGMT_URL=http://test-mgmt:4005
      - REPORTING_URL=http://reporting:4006
    depends_on:
      - user-admin
      - agile-board
      - code-tracer
      - pipeline
      - test-mgmt
      - reporting

  user-admin:
    build: ./services/user-admin
    ports:
      - "4001:4001"
    environment:
      - NODE_ENV=development
      - PORT=4001
      - SERVICE_NAME=user-admin
    volumes:
      - ./data/user-admin:/data

  agile-board:
    build: ./services/agile-board
    ports:
      - "4002:4002"
    environment:
      - NODE_ENV=development
      - PORT=4002
      - SERVICE_NAME=agile-board
    volumes:
      - ./data/agile-board:/data

  code-tracer:
    build: ./services/code-tracer
    ports:
      - "4003:4003"
    environment:
      - NODE_ENV=development
      - PORT=4003
      - SERVICE_NAME=code-tracer
    volumes:
      - ./data/code-tracer:/data

  pipeline:
    build: ./services/pipeline
    ports:
      - "4004:4004"
    environment:
      - NODE_ENV=development
      - PORT=4004
      - SERVICE_NAME=pipeline
    volumes:
      - ./data/pipeline:/data

  test-mgmt:
    build: ./services/test-mgmt
    ports:
      - "4005:4005"
    environment:
      - NODE_ENV=development
      - PORT=4005
      - SERVICE_NAME=test-mgmt
    volumes:
      - ./data/test-mgmt:/data

  reporting:
    build: ./services/reporting
    ports:
      - "4006:4006"
    environment:
      - NODE_ENV=development
      - PORT=4006
      - SERVICE_NAME=reporting
    volumes:
      - ./data/reporting:/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_PASSWORD=testmgr
      - POSTGRES_DB=testmgr
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

## Phase 5: Deployment Commands

### Development

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up

# Start specific service
docker-compose up agile-board

# View logs
docker-compose logs -f agile-board

# Stop all services
docker-compose down
```

### Production (Kubernetes)

```bash
# Apply all deployments
kubectl apply -f kubernetes/

# Check status
kubectl get pods
kubectl get services

# View logs
kubectl logs -f deployment/agile-board

# Scale service
kubectl scale deployment agile-board --replicas=5
```

## Testing the Migration

### 1. Test Individual Services

```bash
# Test User Admin Service
curl http://localhost:4001/health
curl -X POST http://localhost:4001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test Agile Board Service
curl http://localhost:4002/health
curl -X POST http://localhost:4002/api/boards \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Board"}'
```

### 2. Test API Gateway

```bash
# All requests go through gateway
curl http://localhost:3000/health
curl http://localhost:3000/api/boards
curl http://localhost:3000/api/tests
```

### 3. Test Event Communication

Create a test in Test Management Service and verify:
1. Defect is auto-created
2. Story is updated in Agile Board Service
3. Reporting Service receives metrics update

## Migration Checklist

- [ ] Phase 1: Project setup complete
- [ ] Phase 2: All services extracted and running
- [ ] Phase 3: API Gateway implemented
- [ ] Phase 4: Docker configuration complete
- [ ] Phase 5: Kubernetes manifests created
- [ ] Event bus working between services
- [ ] All existing tests passing
- [ ] New integration tests added
- [ ] Documentation updated
- [ ] CI/CD pipelines updated
- [ ] Deployment tested in staging
- [ ] Production deployment successful

## Rollback Plan

If issues occur:

1. **Immediate**: Route all traffic back to monolith
2. **Short-term**: Disable problematic service, use monolith
3. **Long-term**: Fix issue in service, redeploy

## Support

For questions or issues during migration:
- Check logs: `docker-compose logs -f [service-name]`
- Review events: Add event logging to debug communication
- Test individual services: Bypass gateway for debugging


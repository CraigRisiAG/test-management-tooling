# Test Management Platform - Microservices Architecture

## Overview

This document outlines the microservices architecture for splitting the monolithic test management platform into independently deployable services.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         API Gateway / BFF                               │
│                    (Express + CORS + Helmet)                            │
│                         Port: 3000                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
        ┌───────────▼────┐  ┌──────▼─────┐  ┌─────▼──────┐
        │ Event Bus      │  │  Service    │  │  Service   │
        │ (Redis/RabbitMQ│  │  Registry   │  │  Discovery │
        │   or In-Memory)│  │             │  │            │
        └───────┬────────┘  └─────────────┘  └────────────┘
                │
    ┌───────────┼───────────┬────────────┬────────────┬────────────┐
    │           │           │            │            │            │
┌───▼────┐  ┌──▼─────┐  ┌──▼──────┐  ┌─▼──────┐  ┌─▼──────┐  ┌─▼──────┐
│ User   │  │ Agile  │  │  Code   │  │Pipeline│  │  Test  │  │Report  │
│ Admin  │  │ Board  │  │  Tracer │  │/GitOps │  │  Mgmt  │  │Service │
│Service │  │Service │  │ Service │  │Service │  │Service │  │        │
│:4001   │  │:4002   │  │  :4003  │  │ :4004  │  │ :4005  │  │ :4006  │
└────┬───┘  └───┬────┘  └────┬────┘  └────┬───┘  └───┬────┘  └───┬────┘
     │          │            │            │          │           │
     └──────────┴────────────┴────────────┴──────────┴───────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
            ┌───────▼────────┐  ┌──▼───────┐  ┌───▼─────────┐
            │ Shared Database│  │  S3/Blob │  │   Cache     │
            │ (PostgreSQL or │  │  Storage │  │   (Redis)   │
            │  JSON files)   │  │          │  │             │
            └────────────────┘  └──────────┘  └─────────────┘
```

## Microservices Breakdown

### 1. User Admin Service (Port 4001)
**Responsibility:** User authentication, authorization, team management, role-based access control

**Modules:**
- `user-manager.ts`
- `team-hierarchy.ts`

**API Endpoints:**
- `POST /api/users/register`
- `POST /api/users/login`
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
- `GET /api/teams`
- `POST /api/teams`
- `GET /api/teams/:id/members`

**Database Schema:**
- Users table
- Teams table
- Roles table
- Permissions table

**Tech Stack:**
- Express.js
- JWT for authentication
- bcrypt for password hashing
- PostgreSQL or JSON files

---

### 2. Agile Board Service (Port 4002)
**Responsibility:** Agile boards, sprints, stories, backlogs, velocity tracking

**Modules:**
- `agile.ts`
- `agile-hierarchy.ts`

**API Endpoints:**
- `GET /api/boards`
- `POST /api/boards`
- `GET /api/boards/:id`
- `PUT /api/boards/:id`
- `DELETE /api/boards/:id`
- `GET /api/boards/:id/sprints`
- `POST /api/boards/:id/sprints`
- `GET /api/sprints/:id`
- `POST /api/sprints/:id/start`
- `POST /api/sprints/:id/complete`
- `GET /api/stories`
- `POST /api/stories`
- `PUT /api/stories/:id`
- `DELETE /api/stories/:id`
- `GET /api/stories/:id/metrics`

**Database Schema:**
- Boards table
- Sprints table
- Stories table
- Story_Tests table (join)
- Story_Repositories table (join)

**Events Published:**
- `story.created`
- `story.updated`
- `sprint.started`
- `sprint.completed`

**Events Consumed:**
- `test.executed` (from Test Management Service)
- `code.committed` (from Pipeline Service)

---

### 3. Code Tracer Service (Port 4003)
**Responsibility:** Code traceability, change detection, code-to-test linkage

**Modules:**
- `code-tracer.ts`
- `repository-viewer.ts`

**API Endpoints:**
- `POST /api/code/references`
- `GET /api/code/references/:id`
- `GET /api/code/references/:id/changed`
- `GET /api/code/file/:filePath/tests`
- `POST /api/code/link-to-story`
- `GET /api/repositories`
- `GET /api/repositories/:id/files`

**Database Schema:**
- Code_References table
- File_Hashes table
- Code_Story_Links table

**Events Published:**
- `code.changed`
- `code.linked`

**Events Consumed:**
- `story.created` (from Agile Board Service)

---

### 4. Pipeline/GitOps Service (Port 4004)
**Responsibility:** CI/CD pipeline integration, git operations, deployment tracking

**Modules:**
- `gitops.ts`

**API Endpoints:**
- `POST /api/pipelines`
- `GET /api/pipelines/:id`
- `POST /api/pipelines/:id/trigger`
- `GET /api/pipelines/:id/status`
- `POST /api/git/commits`
- `GET /api/git/commits/:sha`
- `POST /api/deployments`
- `GET /api/deployments/:id`

**Database Schema:**
- Pipelines table
- Pipeline_Runs table
- Git_Commits table
- Deployments table

**Events Published:**
- `pipeline.started`
- `pipeline.completed`
- `deployment.success`
- `deployment.failed`
- `code.committed`

**Events Consumed:**
- `test.passed` (from Test Management Service)
- `test.failed` (from Test Management Service)

---

### 5. Test Management Service (Port 4005)
**Responsibility:** Test execution, test registry, defect tracking, issue management

**Modules:**
- `test-registry.ts`
- `test-executor.ts`
- `defect-manager.ts`
- `issue-manager.ts`
- `lifecycle.ts`

**API Endpoints:**
- `POST /api/tests`
- `GET /api/tests/:id`
- `PUT /api/tests/:id`
- `DELETE /api/tests/:id`
- `POST /api/tests/:id/execute`
- `POST /api/tests/batch-execute`
- `GET /api/tests/story/:storyId`
- `POST /api/defects`
- `GET /api/defects/:id`
- `PUT /api/defects/:id`
- `GET /api/defects/health-score`
- `POST /api/issues`
- `GET /api/issues/:id`
- `PUT /api/issues/:id`
- `POST /api/issues/:id/comments`
- `GET /api/traceability-matrix`

**Database Schema:**
- Tests table
- Test_Results table
- Test_Story_Links table
- Defects table
- Issues table
- Issue_Comments table

**Events Published:**
- `test.created`
- `test.executed`
- `test.passed`
- `test.failed`
- `defect.created`
- `defect.resolved`
- `issue.created`
- `issue.updated`

**Events Consumed:**
- `story.created` (from Agile Board Service)
- `code.changed` (from Code Tracer Service)

---

### 6. Reporting Service (Port 4006)
**Responsibility:** Dashboard generation, metrics calculation, report generation

**Modules:**
- `dashboard-reporter.ts`
- `ui.ts` (web interface)

**API Endpoints:**
- `GET /api/reports/dashboard`
- `GET /api/reports/json`
- `GET /api/reports/traceability-matrix`
- `GET /api/metrics/coverage`
- `GET /api/metrics/velocity`
- `GET /api/metrics/quality`
- `GET /api/metrics/health-score`
- `GET /api/ui/dashboard` (HTML)

**Database Schema:**
- Metrics_Cache table
- Report_Snapshots table

**Events Consumed:**
- All events (for metrics calculation)

---

## API Gateway / BFF (Port 3000)

**Responsibility:** 
- Single entry point for all clients
- Request routing
- Authentication/authorization validation
- Rate limiting
- CORS handling
- Request/response logging

**Routes:**
```
/api/users/*        → User Admin Service (4001)
/api/teams/*        → User Admin Service (4001)
/api/boards/*       → Agile Board Service (4002)
/api/sprints/*      → Agile Board Service (4002)
/api/stories/*      → Agile Board Service (4002)
/api/code/*         → Code Tracer Service (4003)
/api/repositories/* → Code Tracer Service (4003)
/api/pipelines/*    → Pipeline Service (4004)
/api/git/*          → Pipeline Service (4004)
/api/tests/*        → Test Management Service (4005)
/api/defects/*      → Test Management Service (4005)
/api/issues/*       → Test Management Service (4005)
/api/reports/*      → Reporting Service (4006)
/api/metrics/*      → Reporting Service (4006)
```

---

## Event Bus Architecture

### Option 1: In-Memory Event Bus (Development)
```typescript
class EventBus {
  private subscribers: Map<string, Array<(data: any) => void>> = new Map();
  
  subscribe(event: string, handler: (data: any) => void): void
  publish(event: string, data: any): void
}
```

### Option 2: Redis Pub/Sub (Production)
- Fast in-memory messaging
- Persistence optional
- Simple pub/sub model

### Option 3: RabbitMQ (Enterprise)
- Message durability
- Complex routing
- Guaranteed delivery

### Event Schema
```typescript
interface Event {
  id: string;
  type: string;
  timestamp: Date;
  source: string;
  data: any;
  correlationId?: string;
}
```

---

## Service Communication Patterns

### 1. Synchronous (REST API)
- Used for: Direct queries, immediate responses
- Example: API Gateway → Service calls

### 2. Asynchronous (Events)
- Used for: Loosely coupled updates, notifications
- Example: Test execution → Defect creation → Story update

### 3. Data Consistency
- **Eventual Consistency:** Services update asynchronously via events
- **Saga Pattern:** For complex multi-service transactions

---

## Database Strategy

### Option 1: Database per Service (Microservices Best Practice)
```
user-admin-db (PostgreSQL)
agile-board-db (PostgreSQL)
code-tracer-db (PostgreSQL)
pipeline-db (PostgreSQL)
test-mgmt-db (PostgreSQL)
reporting-db (PostgreSQL)
```

**Pros:**
- True service independence
- Technology flexibility per service
- Better scalability

**Cons:**
- Data duplication
- Complex joins require service calls
- Eventual consistency challenges

### Option 2: Shared Database (Simpler Migration)
```
test-mgmt-platform-db (PostgreSQL)
├── users schema
├── agile schema
├── code schema
├── pipelines schema
├── tests schema
└── reports schema
```

**Pros:**
- Easier to implement
- ACID transactions across services
- Simpler queries

**Cons:**
- Service coupling
- Deployment coordination needed
- Single point of failure

### Option 3: Hybrid Approach (Recommended)
- **Core transactional data:** Separate databases per service
- **Read-only reporting:** Shared read replica for reporting service
- **Caching layer:** Redis for frequently accessed data

---

## Deployment Architecture

### Docker Compose (Development/Testing)
```yaml
version: '3.8'
services:
  api-gateway:
    build: ./services/api-gateway
    ports: ["3000:3000"]
  
  user-admin:
    build: ./services/user-admin
    ports: ["4001:4001"]
  
  agile-board:
    build: ./services/agile-board
    ports: ["4002:4002"]
  
  code-tracer:
    build: ./services/code-tracer
    ports: ["4003:4003"]
  
  pipeline:
    build: ./services/pipeline
    ports: ["4004:4004"]
  
  test-mgmt:
    build: ./services/test-mgmt
    ports: ["4005:4005"]
  
  reporting:
    build: ./services/reporting
    ports: ["4006:4006"]
  
  postgres:
    image: postgres:15
    ports: ["5432:5432"]
  
  redis:
    image: redis:7
    ports: ["6379:6379"]
```

### Kubernetes (Production)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: user-admin-service
spec:
  selector:
    app: user-admin
  ports:
  - port: 4001
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-admin
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: user-admin
        image: testmgr/user-admin:latest
        ports:
        - containerPort: 4001
```

---

## Migration Strategy

### Phase 1: Extract Services (Week 1-2)
1. Create separate folders for each service
2. Extract modules into services
3. Create basic Express servers
4. Implement REST APIs

### Phase 2: Implement API Gateway (Week 3)
1. Create gateway with routing
2. Add authentication middleware
3. Implement rate limiting
4. Add logging

### Phase 3: Event Bus Integration (Week 4)
1. Implement event bus (start with in-memory)
2. Add event publishers
3. Add event subscribers
4. Test async communication

### Phase 4: Database Separation (Week 5-6)
1. Create separate database schemas
2. Migrate data
3. Update service DAOs
4. Test data integrity

### Phase 5: Containerization (Week 7)
1. Create Dockerfiles for each service
2. Create docker-compose.yml
3. Test local deployment
4. Document deployment process

### Phase 6: Production Deployment (Week 8)
1. Create Kubernetes manifests
2. Set up CI/CD pipelines
3. Deploy to staging
4. Deploy to production

---

## Benefits of Microservices Architecture

### 1. Independent Deployment
- Deploy agile board changes without affecting test execution
- Rollback individual services on issues
- Faster release cycles

### 2. Technology Flexibility
- Use different databases per service
- Upgrade Node.js version per service
- Experiment with new technologies

### 3. Scalability
- Scale reporting service independently during heavy dashboard usage
- Scale test execution service during batch runs
- Optimize resource allocation

### 4. Team Autonomy
- Different teams own different services
- Parallel development
- Clear boundaries and contracts

### 5. Fault Isolation
- Pipeline service down doesn't affect test execution
- Reporting service issues don't block agile board
- Better resilience

---

## Challenges and Mitigations

### 1. Increased Complexity
- **Challenge:** More moving parts
- **Mitigation:** 
  - Good documentation
  - Service mesh (Istio) for observability
  - Centralized logging (ELK stack)

### 2. Network Latency
- **Challenge:** Inter-service calls add latency
- **Mitigation:**
  - Cache frequently accessed data
  - Use async messaging where possible
  - Optimize API payloads

### 3. Data Consistency
- **Challenge:** Eventual consistency issues
- **Mitigation:**
  - Implement saga pattern
  - Add retry mechanisms
  - Design for idempotency

### 4. Testing Complexity
- **Challenge:** End-to-end testing harder
- **Mitigation:**
  - Contract testing (Pact)
  - Service virtualization
  - Comprehensive integration tests

---

## Service Interface Contracts

Each service will define its contract using OpenAPI 3.0 specification. Example:

```yaml
openapi: 3.0.0
info:
  title: Agile Board Service API
  version: 1.0.0
paths:
  /api/boards:
    get:
      summary: Get all boards
      responses:
        '200':
          description: List of boards
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Board'
```

---

## Monitoring and Observability

### Logging
- **Centralized:** All services log to ELK stack
- **Format:** JSON with correlation IDs
- **Levels:** ERROR, WARN, INFO, DEBUG

### Metrics
- **Tool:** Prometheus + Grafana
- **Metrics:** 
  - Request rate
  - Error rate
  - Latency (p50, p95, p99)
  - Service health

### Tracing
- **Tool:** Jaeger or Zipkin
- **Distributed tracing:** Track requests across services
- **Correlation IDs:** Link all service calls for a request

---

## Security Considerations

### 1. Authentication
- JWT tokens issued by User Admin Service
- API Gateway validates tokens
- Services trust gateway-validated requests

### 2. Authorization
- Role-based access control (RBAC)
- Service-level permissions
- Resource-level permissions

### 3. Network Security
- Services communicate on private network
- Only API Gateway exposed publicly
- TLS for all communications

### 4. Data Security
- Encrypt sensitive data at rest
- Secure credential management (Vault/AWS Secrets Manager)
- Audit logging for sensitive operations

---

## Cost Considerations

### Development Environment
- Docker Compose on single machine
- In-memory event bus
- SQLite or JSON files

### Staging Environment
- 1-2 instances per service
- Shared PostgreSQL
- Redis for events

### Production Environment
- 3+ instances per service (HA)
- Managed database services
- Managed Redis/RabbitMQ
- Load balancers

**Estimated Costs:**
- Development: $0 (local)
- Staging: $50-100/month (AWS/Azure)
- Production: $500-1000/month (depending on scale)

---

## Next Steps

1. Review this architecture with team
2. Choose database strategy (per-service vs shared)
3. Choose event bus (in-memory → Redis → RabbitMQ)
4. Create service directory structure
5. Implement Phase 1: Extract Services
6. Set up CI/CD for microservices
7. Create deployment documentation

---

## References

- [Microservices Patterns](https://microservices.io/patterns/index.html)
- [API Gateway Pattern](https://microservices.io/patterns/apigateway.html)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- [Database per Service](https://microservices.io/patterns/data/database-per-service.html)

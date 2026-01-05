# Test Management Platform - Microservices Setup

## 🎯 Overview

This directory contains the microservices architecture for the Test Management Platform. The monolithic application has been split into 6 independently deployable services + API Gateway.

## 🏗️ Architecture

```
                    ┌─────────────────────┐
                    │   API Gateway       │
                    │   Port: 3000        │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼────────┐    ┌───────▼────────┐    ┌───────▼────────┐
│ User Admin     │    │ Agile Board    │    │ Code Tracer    │
│ Port: 4001     │    │ Port: 4002     │    │ Port: 4003     │
└────────────────┘    └────────────────┘    └────────────────┘

┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│ Pipeline       │    │ Test Mgmt      │    │ Reporting      │
│ Port: 4004     │    │ Port: 4005     │    │ Port: 4006     │
└────────────────┘    └────────────────┘    └────────────────┘
```

## 📦 Services

| Service | Port | Responsibility | Modules |
|---------|------|----------------|---------|
| **API Gateway** | 3000 | Request routing, auth validation | - |
| **User Admin** | 4001 | Authentication, teams, users | user-manager, team-hierarchy |
| **Agile Board** | 4002 | Boards, sprints, stories | agile, agile-hierarchy |
| **Code Tracer** | 4003 | Code traceability, change detection | code-tracer, repository-viewer |
| **Pipeline** | 4004 | CI/CD, GitOps | gitops |
| **Test Management** | 4005 | Tests, defects, issues | test-registry, test-executor, defect-manager, issue-manager, lifecycle |
| **Reporting** | 4006 | Dashboards, metrics | dashboard-reporter, ui |

## 🚀 Quick Start

### Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose
- Node.js 18+ (for local development)
- PowerShell (Windows) or Bash (Linux/Mac)

### Option 1: Using PowerShell (Windows)

```powershell
# Quick start (build + start all services)
.\microservices.ps1 quickstart

# Or manually:
.\microservices.ps1 build
.\microservices.ps1 up
.\microservices.ps1 health
```

### Option 2: Using Make (Linux/Mac/Windows with make installed)

```bash
# Quick start
make quickstart

# Or manually:
make build
make up
make health
```

### Option 3: Using Docker Compose directly

```bash
# Build all services
docker-compose -f docker-compose.microservices.yml build

# Start all services
docker-compose -f docker-compose.microservices.yml up -d

# Check status
docker-compose -f docker-compose.microservices.yml ps
```

## 🌐 Access Points

After starting services:

- **API Gateway:** http://localhost:3000
- **User Admin:** http://localhost:4001
- **Agile Board:** http://localhost:4002
- **Code Tracer:** http://localhost:4003
- **Pipeline:** http://localhost:4004
- **Test Management:** http://localhost:4005
- **Reporting:** http://localhost:4006

## 📚 Documentation

- **[MICROSERVICES_ARCHITECTURE.md](./MICROSERVICES_ARCHITECTURE.md)** - Complete architectural design
- **[MICROSERVICES_IMPLEMENTATION.md](./MICROSERVICES_IMPLEMENTATION.md)** - Step-by-step implementation guide
- **[MICROSERVICES_MIGRATION_SUMMARY.md](./MICROSERVICES_MIGRATION_SUMMARY.md)** - Migration plan and checklist

## 🔧 Common Commands

### PowerShell (Windows)

```powershell
# Start services
.\microservices.ps1 up

# Stop services
.\microservices.ps1 down

# View logs
.\microservices.ps1 logs

# Check health
.\microservices.ps1 health

# Clean up
.\microservices.ps1 clean

# Reset database
.\microservices.ps1 db-reset
```

### Make (Linux/Mac)

```bash
# Start services
make up

# Stop services
make down

# View logs
make logs

# Check health
make health

# Clean up
make clean

# Reset database
make db-reset
```

## 🧪 Testing

### Health Checks

```bash
# Check all services
curl http://localhost:3000/health
curl http://localhost:4001/health
curl http://localhost:4002/health
curl http://localhost:4003/health
curl http://localhost:4004/health
curl http://localhost:4005/health
curl http://localhost:4006/health
```

### API Testing

```bash
# Create a board (through API Gateway)
curl -X POST http://localhost:3000/api/boards \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Board","description":"My test board"}'

# Get all boards
curl http://localhost:3000/api/boards

# Create a story
curl -X POST http://localhost:3000/api/stories \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Story","boardId":"<board-id>"}'
```

## 🗄️ Database

### PostgreSQL

The setup uses PostgreSQL with separate databases for each service:

- `testmgr_users` - User Admin Service
- `testmgr_agile` - Agile Board Service
- `testmgr_code` - Code Tracer Service
- `testmgr_pipeline` - Pipeline Service
- `testmgr_tests` - Test Management Service
- `testmgr_reports` - Reporting Service

### Accessing Database

```bash
# Using PowerShell
docker-compose -f docker-compose.microservices.yml exec postgres psql -U testmgr -d testmgr

# Using Make
make db-shell
```

### Reset Database

```bash
# PowerShell
.\microservices.ps1 db-reset

# Make
make db-reset
```

## 📊 Monitoring

### View Logs

```bash
# All services
docker-compose -f docker-compose.microservices.yml logs -f

# Specific service
docker-compose -f docker-compose.microservices.yml logs -f agile-board
docker-compose -f docker-compose.microservices.yml logs -f test-mgmt

# Using PowerShell
.\microservices.ps1 logs

# Using Make
make logs-agile
make logs-tests
```

### Container Status

```bash
# PowerShell
.\microservices.ps1 ps

# Make
make ps

# Docker Compose
docker-compose -f docker-compose.microservices.yml ps
```

## 🔄 Event-Driven Communication

Services communicate via an event bus (Redis Pub/Sub):

```
Test Execution → test.failed event → Agile Board updates story
Story Created → story.created event → Test Management links tests
Code Changed → code.changed event → Test Management runs affected tests
```

### Monitor Events

```bash
# Connect to Redis
docker-compose -f docker-compose.microservices.yml exec redis redis-cli

# Monitor all events
MONITOR
```

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check if ports are in use
netstat -ano | findstr :3000
netstat -ano | findstr :4001

# Clean up and restart
.\microservices.ps1 clean
.\microservices.ps1 up
```

### Database Connection Errors

```bash
# Reset database
.\microservices.ps1 db-reset

# Check PostgreSQL logs
docker-compose -f docker-compose.microservices.yml logs postgres
```

### Service Not Responding

```bash
# Check service logs
docker-compose -f docker-compose.microservices.yml logs <service-name>

# Restart specific service
docker-compose -f docker-compose.microservices.yml restart <service-name>

# Check health
.\microservices.ps1 health
```

## 📈 Performance

### Resource Requirements

- **Development:** 4GB RAM, 2 CPU cores
- **Production:** 8GB+ RAM, 4+ CPU cores

### Scaling Services

```bash
# Scale specific service
docker-compose -f docker-compose.microservices.yml up -d --scale agile-board=3

# In Kubernetes
kubectl scale deployment agile-board --replicas=5
```

## 🚢 Deployment

### Development

```bash
# PowerShell
.\microservices.ps1 quickstart

# Make
make deploy-dev
```

### Production

See [MICROSERVICES_IMPLEMENTATION.md](./MICROSERVICES_IMPLEMENTATION.md) for Kubernetes deployment guide.

## 📋 Migration Status

Current implementation status:

- [x] Architecture designed
- [x] Documentation complete
- [x] Docker Compose configuration
- [x] Database schema
- [x] Helper scripts created
- [ ] Services implemented
- [ ] API Gateway implemented
- [ ] Event bus implemented
- [ ] Tests written
- [ ] Deployed to staging
- [ ] Deployed to production

## 🤝 Contributing

### Service Development

Each service follows this structure:

```
services/<service-name>/
├── src/
│   ├── index.ts          # Entry point
│   ├── routes/           # API routes
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   └── models/           # Data models
├── Dockerfile
├── package.json
└── tsconfig.json
```

### Adding a New Service

1. Create service directory
2. Implement Express server
3. Add to `docker-compose.microservices.yml`
4. Update API Gateway routes
5. Add health check
6. Write tests

## 🔐 Security

### Authentication

- JWT tokens issued by User Admin Service
- API Gateway validates all requests
- Services trust validated requests

### Network Security

- Services communicate on private network
- Only API Gateway exposed publicly
- Use environment variables for secrets

## 📞 Support

For questions or issues:

1. Check documentation in `MICROSERVICES_*.md` files
2. Review logs: `.\microservices.ps1 logs`
3. Check health: `.\microservices.ps1 health`
4. Raise issue on GitHub

## 🎓 Learning Resources

- [Microservices Patterns](https://microservices.io/patterns/)
- [API Gateway Pattern](https://microservices.io/patterns/apigateway.html)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 📝 License

MIT License - See LICENSE file for details

---

**Created:** January 5, 2026  
**Status:** Ready for Implementation  
**Next Steps:** Begin service extraction (see MICROSERVICES_IMPLEMENTATION.md)

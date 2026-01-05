# Test Management Platform - Microservices Makefile
# Provides convenient commands for managing the microservices architecture

.PHONY: help build up down logs clean test migrate deploy

# Default target
help:
	@echo "Test Management Platform - Microservices Commands"
	@echo "=================================================="
	@echo ""
	@echo "Development Commands:"
	@echo "  make build              - Build all services"
	@echo "  make up                 - Start all services"
	@echo "  make down               - Stop all services"
	@echo "  make restart            - Restart all services"
	@echo "  make logs               - View logs from all services"
	@echo "  make logs-[service]     - View logs from specific service"
	@echo ""
	@echo "Service Commands:"
	@echo "  make start-gateway      - Start API Gateway only"
	@echo "  make start-users        - Start User Admin service only"
	@echo "  make start-agile        - Start Agile Board service only"
	@echo "  make start-code         - Start Code Tracer service only"
	@echo "  make start-pipeline     - Start Pipeline service only"
	@echo "  make start-tests        - Start Test Management service only"
	@echo "  make start-reporting    - Start Reporting service only"
	@echo ""
	@echo "Database Commands:"
	@echo "  make db-migrate         - Run database migrations"
	@echo "  make db-seed            - Seed database with test data"
	@echo "  make db-reset           - Reset all databases"
	@echo "  make db-shell           - Open PostgreSQL shell"
	@echo ""
	@echo "Testing Commands:"
	@echo "  make test               - Run all tests"
	@echo "  make test-unit          - Run unit tests"
	@echo "  make test-integration   - Run integration tests"
	@echo "  make test-e2e           - Run end-to-end tests"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make clean              - Clean up containers and volumes"
	@echo "  make clean-all          - Deep clean (including images)"
	@echo "  make health             - Check health of all services"
	@echo "  make ps                 - Show running containers"
	@echo ""
	@echo "Deployment Commands:"
	@echo "  make deploy-dev         - Deploy to development environment"
	@echo "  make deploy-staging     - Deploy to staging environment"
	@echo "  make deploy-prod        - Deploy to production environment"
	@echo ""

# Build all services
build:
	@echo "Building all services..."
	docker-compose -f docker-compose.microservices.yml build

# Build specific service
build-%:
	@echo "Building $* service..."
	docker-compose -f docker-compose.microservices.yml build $*

# Start all services
up:
	@echo "Starting all services..."
	docker-compose -f docker-compose.microservices.yml up -d
	@echo "Services started. API Gateway available at http://localhost:3000"
	@echo "Run 'make logs' to view logs"
	@echo "Run 'make health' to check service health"

# Start services in foreground (with logs)
up-fg:
	@echo "Starting all services (foreground)..."
	docker-compose -f docker-compose.microservices.yml up

# Stop all services
down:
	@echo "Stopping all services..."
	docker-compose -f docker-compose.microservices.yml down

# Restart all services
restart: down up

# View logs from all services
logs:
	docker-compose -f docker-compose.microservices.yml logs -f

# View logs from specific service
logs-gateway:
	docker-compose -f docker-compose.microservices.yml logs -f api-gateway

logs-users:
	docker-compose -f docker-compose.microservices.yml logs -f user-admin

logs-agile:
	docker-compose -f docker-compose.microservices.yml logs -f agile-board

logs-code:
	docker-compose -f docker-compose.microservices.yml logs -f code-tracer

logs-pipeline:
	docker-compose -f docker-compose.microservices.yml logs -f pipeline

logs-tests:
	docker-compose -f docker-compose.microservices.yml logs -f test-mgmt

logs-reporting:
	docker-compose -f docker-compose.microservices.yml logs -f reporting

logs-redis:
	docker-compose -f docker-compose.microservices.yml logs -f redis

logs-postgres:
	docker-compose -f docker-compose.microservices.yml logs -f postgres

# Start individual services
start-gateway:
	docker-compose -f docker-compose.microservices.yml up -d api-gateway

start-users:
	docker-compose -f docker-compose.microservices.yml up -d user-admin

start-agile:
	docker-compose -f docker-compose.microservices.yml up -d agile-board

start-code:
	docker-compose -f docker-compose.microservices.yml up -d code-tracer

start-pipeline:
	docker-compose -f docker-compose.microservices.yml up -d pipeline

start-tests:
	docker-compose -f docker-compose.microservices.yml up -d test-mgmt

start-reporting:
	docker-compose -f docker-compose.microservices.yml up -d reporting

# Database commands
db-migrate:
	@echo "Running database migrations..."
	docker-compose -f docker-compose.microservices.yml exec postgres psql -U testmgr -d testmgr -f /docker-entrypoint-initdb.d/init.sql

db-seed:
	@echo "Seeding database with test data..."
	# Add seed script execution here

db-reset:
	@echo "Resetting all databases..."
	docker-compose -f docker-compose.microservices.yml down -v
	docker-compose -f docker-compose.microservices.yml up -d postgres
	@sleep 5
	$(MAKE) db-migrate

db-shell:
	@echo "Opening PostgreSQL shell..."
	docker-compose -f docker-compose.microservices.yml exec postgres psql -U testmgr -d testmgr

# Clean up
clean:
	@echo "Cleaning up containers and volumes..."
	docker-compose -f docker-compose.microservices.yml down -v

clean-all:
	@echo "Deep cleaning (removing images)..."
	docker-compose -f docker-compose.microservices.yml down -v --rmi all

# Health checks
health:
	@echo "Checking service health..."
	@echo ""
	@echo "API Gateway:"
	@curl -s http://localhost:3000/health || echo "  ❌ Not responding"
	@echo ""
	@echo "User Admin:"
	@curl -s http://localhost:4001/health || echo "  ❌ Not responding"
	@echo ""
	@echo "Agile Board:"
	@curl -s http://localhost:4002/health || echo "  ❌ Not responding"
	@echo ""
	@echo "Code Tracer:"
	@curl -s http://localhost:4003/health || echo "  ❌ Not responding"
	@echo ""
	@echo "Pipeline:"
	@curl -s http://localhost:4004/health || echo "  ❌ Not responding"
	@echo ""
	@echo "Test Management:"
	@curl -s http://localhost:4005/health || echo "  ❌ Not responding"
	@echo ""
	@echo "Reporting:"
	@curl -s http://localhost:4006/health || echo "  ❌ Not responding"

# Show running containers
ps:
	docker-compose -f docker-compose.microservices.yml ps

# Testing
test:
	@echo "Running all tests..."
	npm test

test-unit:
	@echo "Running unit tests..."
	npm run test:unit

test-integration:
	@echo "Running integration tests..."
	npm run test:integration

test-e2e:
	@echo "Running end-to-end tests..."
	npm run test:e2e

# Deployment
deploy-dev:
	@echo "Deploying to development environment..."
	$(MAKE) build
	$(MAKE) up
	@echo "Development deployment complete!"

deploy-staging:
	@echo "Deploying to staging environment..."
	# Add staging deployment commands here
	@echo "Staging deployment would happen here"

deploy-prod:
	@echo "⚠️  Production deployment requires approval!"
	@echo "Please run: make deploy-prod-confirmed"

deploy-prod-confirmed:
	@echo "Deploying to production environment..."
	# Add production deployment commands here
	@echo "Production deployment would happen here"

# Development helpers
dev-setup:
	@echo "Setting up development environment..."
	npm install
	$(MAKE) build
	$(MAKE) db-reset
	@echo "Development environment ready!"

# Monitor services
monitor:
	@echo "Opening service monitoring dashboard..."
	@echo "Visit: http://localhost:3000/metrics"

# Performance testing
perf-test:
	@echo "Running performance tests..."
	# Add performance testing commands here

# Security scan
security-scan:
	@echo "Running security scan..."
	npm audit
	docker scan testmgr-api-gateway || true

# Generate API documentation
docs:
	@echo "Generating API documentation..."
	# Add documentation generation here

# Backup data
backup:
	@echo "Backing up data..."
	docker-compose -f docker-compose.microservices.yml exec postgres pg_dump -U testmgr testmgr > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup complete!"

# Restore data
restore:
	@echo "⚠️  This will overwrite existing data!"
	@read -p "Enter backup file name: " file; \
	docker-compose -f docker-compose.microservices.yml exec -T postgres psql -U testmgr -d testmgr < $$file

# Update all services
update:
	@echo "Updating all services..."
	git pull
	$(MAKE) build
	$(MAKE) restart
	@echo "Services updated!"

# Shell into service container
shell-%:
	@echo "Opening shell in $* service..."
	docker-compose -f docker-compose.microservices.yml exec $* /bin/sh

# Debugging helpers
debug-gateway:
	@echo "Debugging API Gateway..."
	docker-compose -f docker-compose.microservices.yml logs -f api-gateway | grep -i error

debug-events:
	@echo "Monitoring event bus..."
	docker-compose -f docker-compose.microservices.yml exec redis redis-cli monitor

# Quick start for new developers
quickstart:
	@echo "🚀 Quick Start Guide"
	@echo "==================="
	@echo ""
	@echo "1. Building services..."
	$(MAKE) build
	@echo ""
	@echo "2. Starting services..."
	$(MAKE) up
	@echo ""
	@echo "3. Waiting for services to be ready..."
	@sleep 10
	@echo ""
	@echo "4. Checking health..."
	$(MAKE) health
	@echo ""
	@echo "✅ Setup complete!"
	@echo ""
	@echo "Access points:"
	@echo "  API Gateway: http://localhost:3000"
	@echo "  User Admin:  http://localhost:4001"
	@echo "  Agile Board: http://localhost:4002"
	@echo "  Code Tracer: http://localhost:4003"
	@echo "  Pipeline:    http://localhost:4004"
	@echo "  Test Mgmt:   http://localhost:4005"
	@echo "  Reporting:   http://localhost:4006"
	@echo ""
	@echo "Next steps:"
	@echo "  - Run 'make logs' to view logs"
	@echo "  - Run 'make test' to run tests"
	@echo "  - Check documentation in MICROSERVICES_ARCHITECTURE.md"

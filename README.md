<h1 align="center">Delivery Management Toolkit</h1>

A lightweight, cloud-ready software delivery management platform that unifies requirements, agile delivery, code management and manual and automated testing, issue/defect tracking, and release reporting. Built with TypeScript, Express, and AWS-first storage (DynamoDB + S3) with optional local JSON storage for quick starts.

## Highlights

- **Unified test lifecycle**: manage test cases, executions, issues, and defects in one place.
- **Dual storage modes**: local JSON for fast prototyping, or DynamoDB + S3 for cloud scale.
- **REST API**: 20+ endpoints with JWT auth, validation, rate limiting, and Prometheus metrics.
- **Infrastructure as Code**: Terraform modules for VPC, IAM, DynamoDB, S3, CloudWatch, ECS/Fargate, and API Gateway. Kubernetes manifests and Dockerfiles included.
- **Docs as code**: MkDocs + mike for versioned documentation (see `docs/` and `mkdocs.yml`).

## Fast Start (local JSON storage)

```bash
npm install
npm run build
npm start -- --help
```

To run the API locally with JSON storage:

```bash
export USE_CLOUD_STORAGE=false
npm run dev
# API defaults to http://localhost:3000
```

## Deploy to AWS (DynamoDB + S3 + ECS)

```bash
cd terraform
terraform init
terraform apply
```

Provisioned components: VPC, DynamoDB table, S3 bucket, IAM roles, CloudWatch log group, ECS/Fargate service with ALB, API Gateway with VPC Link. Outputs include API endpoint and service URLs.

## Key Paths

- API server: [src/api-server.ts](src/api-server.ts)
- Cloud storage adapters: [src/storage/](src/storage)
- Terraform IaC: [terraform/](terraform)
- Kubernetes manifests: [k8s/](k8s)
- Documentation: [docs/](docs) (MkDocs + mike), site config in [mkdocs.yml](mkdocs.yml)

## Documentation

- Quick start: [QUICKSTART_TYPESCRIPT.md](QUICKSTART_TYPESCRIPT.md)
- Deployment: [CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md) and [CLOUD_INFRASTRUCTURE_COMPLETE.md](CLOUD_INFRASTRUCTURE_COMPLETE.md)
- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md) and [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
- Wiki versioning: [docs/versioning.md](docs/versioning.md)

## GitOps CI/CD

- Workflow: [.github/workflows/gitops-delivery.yml](.github/workflows/gitops-delivery.yml)
- What it validates per change:
	- Lint/test/build for the TypeScript services
	- Docs build (MkDocs + mike) to keep the wiki versionable
	- Terraform fmt/validate for IaC sanity
- Outputs a run summary in GitHub Actions with test, docs, and IaC status.

## License

Code - MIT

Docs - Creative Commons Attribution 4.0 International

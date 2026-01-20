# UK2ME Revamp

Production-ready monorepo for UK2ME Revamp with client, admin, and backend services.

## Structure
- `apps/client` - customer experience (Next.js App Router)
- `apps/admin` - admin console (Next.js App Router)
- `apps/backend` - API-only Next.js service
- `packages/shared` - shared types
- `infra/terraform` - AWS infrastructure
- `docs` - architecture, API, deployment
- `tasks` - execution checklists

## Local Development

1) Install dependencies:

```bash
pnpm install
```

2) Copy env files:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/client/.env.example apps/client/.env
cp apps/admin/.env.example apps/admin/.env
```

3) Start databases & services:

```bash
docker-compose up -d postgres redis
pnpm --filter @uk2me/backend prisma:migrate
pnpm dev
```

Worker (separate terminal):

```bash
pnpm --filter @uk2me/backend worker
```

Services:
- Client: http://localhost:3000
- Admin: http://localhost:3001/admin
- Backend: http://localhost:4000

## Scripts
- `pnpm dev` runs all apps
- `pnpm lint` runs lint across workspaces
- `pnpm typecheck` runs TypeScript checks

## Prisma

Generate client:

```bash
pnpm --filter @uk2me/backend prisma:generate
```

Create migration:

```bash
pnpm --filter @uk2me/backend prisma:migrate
```

## CI/CD (Backend)

Workflow: `.github/workflows/deploy-backend.yml`

Required GitHub secrets:
- `AWS_ROLE_TO_ASSUME` - IAM role ARN for GitHub OIDC
- `AWS_REGION` - AWS region
- `ECR_REPOSITORY` - ECR repo name
- `ECS_CLUSTER` - ECS cluster name
- `ECS_SERVICE` - ECS service name

Infrastructure outputs provide the ECR repo, cluster, and service names.

## AWS Notes
- Terraform provisions ECR, ECS, ALB, IAM, and SSM parameters.
- If you change the project name or region, update `infra/ecs-task-definition.json`.

See `docs/deployment.md` for details.

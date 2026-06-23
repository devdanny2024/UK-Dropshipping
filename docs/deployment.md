# Deployment

## Overview
- **Frontend (client)**: Vercel — auto-deploys on push to `main`
- **Backend**: VPS via Docker Compose — deployed by GitHub Actions on push to `main`

## GitHub Secrets required
Set these in the repo → Settings → Secrets → Actions:

| Secret | Example | Description |
|--------|---------|-------------|
| `VPS_HOST` | `123.45.67.89` | VPS IP address |
| `VPS_USER` | `root` | SSH username |
| `VPS_SSH_KEY` | *(private key contents)* | SSH private key (paste full key) |
| `VPS_PROJECT_PATH` | `/home/danny/uk2me` | Path to project on server |

## First-time server setup
```bash
# On the VPS — clone repo and create prod env file
git clone https://github.com/devdanny2024/UK-Dropshipping.git /home/danny/uk2me
cd /home/danny/uk2me
cp apps/backend/.env.example apps/backend/.env.prod
nano apps/backend/.env.prod   # fill in real values

# Initial build and migration
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml run --rm backend-migrate
docker compose -f docker-compose.prod.yml up -d
```

## Subsequent deploys
Handled automatically by GitHub Actions on every push to `main`:
1. Pulls latest code
2. Rebuilds Docker image
3. Runs `prisma migrate deploy`
4. Restarts backend + worker containers

## Manual migration (if needed)
```bash
cd /home/danny/uk2me
docker compose -f docker-compose.prod.yml run --rm backend-migrate
```

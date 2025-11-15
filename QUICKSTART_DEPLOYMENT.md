# Quick Start: Backend Deployment

This document provides a quick reference for deploying the InFocus backend API.

## For Developers

### Local Testing with Docker

Test the deployment locally before pushing to production:

```bash
# Build Docker image
docker build -t infocus-api:latest -f apps/api/Dockerfile .

# Run with Docker Compose (includes PostgreSQL)
docker-compose up --build

# Test health endpoint
curl http://localhost:3000/health

# Clean up
docker-compose down
```

### CI/CD Pipeline

The GitHub Actions pipeline runs automatically on push to `main` or `develop`:

```
1. Install Dependencies
2. Lint (ESLint)
3. Type Check (TypeScript)
4. Test (Jest with PostgreSQL)
5. Build (Docker image)
6. Deploy (on main branch only)
```

Monitor pipeline status: https://github.com/[owner]/[repo]/actions

## For DevOps/Infrastructure

### Railway Deployment

```bash
# 1. Create Railway project and add PostgreSQL
# 2. Configure environment variables in Railway dashboard
# 3. Set secrets in GitHub: Settings → Secrets → RAILWAY_TOKEN
# 4. Push to main branch - automatic deployment!

# Manual deployment (if needed)
npm install -g @railway/cli
railway login
railway deploy
```

### Render Deployment

```bash
# 1. Create new Web Service in Render dashboard
# 2. Connect GitHub repository
# 3. Set Root Directory: apps/api
# 4. Environment variables configured in dashboard
# 5. Set secrets in GitHub: Settings → Secrets → RENDER_DEPLOY_HOOK_URL
# 6. Push to main branch - automatic deployment!
```

## Environment Variables

**Required for production:**

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/infocus

# Authentication (generate with: openssl rand -hex 32)
JWT_ACCESS_SECRET=<random-secret>
JWT_REFRESH_SECRET=<random-secret>

# API
PORT=3000
NODE_ENV=production

# TMDB
TMDB_API_KEY=<your-api-key>
```

**Generate secure secrets:**

```bash
openssl rand -hex 32  # For JWT secrets
```

## Key Files

- **Dockerfile** - Multi-stage production build (`apps/api/Dockerfile`)
- **Procfile** - Deployment configuration (`apps/api/Procfile`)
- **CI/CD Pipeline** - GitHub Actions (`.github/workflows/ci-cd.yml`)
- **Documentation** - Full guide (`DEPLOYMENT.md`)

## Troubleshooting

### Docker Build Issues

```bash
# Clear Docker cache
docker builder prune

# Rebuild fresh
docker build --no-cache -t infocus-api:latest -f apps/api/Dockerfile .
```

### Database Connection

```bash
# Verify connection string format
postgresql://user:password@host:port/database

# Test with psql
psql "postgresql://user:password@host:port/database" -c "SELECT 1"
```

### Migrations Failed

```bash
# Check migration status
prisma migrate status

# Deploy migrations manually
cd apps/api
pnpm run migrate:prod
```

## Next Steps

1. **Prepare Secrets**: Generate JWT secrets and prepare environment variables
2. **Test Locally**: Run `docker-compose up` to test deployment locally
3. **Configure Platform**: Set up Railway or Render project
4. **Set GitHub Secrets**: Add deployment tokens to GitHub repository
5. **Deploy**: Push to main branch and monitor CI/CD pipeline

For detailed information, see [DEPLOYMENT.md](DEPLOYMENT.md)

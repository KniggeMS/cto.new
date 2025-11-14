# Deployment Guide

This document describes how to deploy the InFocus backend API to production environments.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Variables](#environment-variables)
4. [Local Deployment Testing](#local-deployment-testing)
5. [Docker Setup](#docker-setup)
6. [Railway Deployment](#railway-deployment)
7. [Render Deployment](#render-deployment)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Database Migrations](#database-migrations)
10. [Troubleshooting](#troubleshooting)

## Overview

The InFocus API is containerized using Docker and designed for deployment on modern PaaS platforms like Railway or Render. The deployment process includes:

- **Multi-stage Docker builds** for optimized production images
- **Automated CI/CD pipeline** using GitHub Actions
- **Database migrations** executed automatically during deployment
- **Health checks** built into the container

## Prerequisites

### Local Development

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose (for local testing)
- Git

### Production Deployment

- Railway or Render account
- PostgreSQL 14+ database
- GitHub repository with secrets configured
- Environment variables prepared

## Environment Variables

### Required Variables

The following environment variables must be set in production:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Secrets (use strong random values)
JWT_ACCESS_SECRET=<generate-with: openssl rand -hex 32>
JWT_REFRESH_SECRET=<generate-with: openssl rand -hex 32>

# Node Environment
NODE_ENV=production

# API Port
PORT=3000

# TMDB API Key
TMDB_API_KEY=<your-api-key-from-themoviedb.org>
```

### Generating Secure Secrets

Generate JWT secrets using OpenSSL:

```bash
# Generate access secret
openssl rand -hex 32

# Generate refresh secret
openssl rand -hex 32
```

Or using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Optional Variables

- `LOG_LEVEL` - Logging level (default: info)
- `CORS_ORIGIN` - CORS origin for frontend (default: * in production disables CORS)

## Local Deployment Testing

Test the deployment locally using Docker before deploying to production.

### Build Docker Image

```bash
cd apps/api
docker build -t infocus-api:latest .
```

### Create Network

```bash
docker network create infocus-net
```

### Run PostgreSQL Database

```bash
docker run -d \
  --name infocus-postgres \
  --network infocus-net \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=infocus \
  -p 5432:5432 \
  postgres:15
```

### Run API Container

```bash
docker run -d \
  --name infocus-api \
  --network infocus-net \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://postgres:postgres@infocus-postgres:5432/infocus \
  -e NODE_ENV=production \
  -e JWT_ACCESS_SECRET=test-secret-change-in-prod \
  -e JWT_REFRESH_SECRET=test-secret-change-in-prod \
  -e TMDB_API_KEY=your-tmdb-key \
  infocus-api:latest
```

### Verify Deployment

```bash
# Check container logs
docker logs infocus-api

# Test health endpoint
curl http://localhost:3000/health

# Clean up
docker rm -f infocus-api infocus-postgres
docker network rm infocus-net
```

## Docker Setup

### Dockerfile Structure

The Dockerfile uses a multi-stage build process:

1. **Installer Stage**: Installs all dependencies
2. **Builder Stage**: Builds TypeScript code and generates Prisma client
3. **Pruner Stage**: Prunes dependencies to production-only packages
4. **Runtime Stage**: Final minimal image with only necessary files

### Build Arguments

The Docker image can be customized during build:

```bash
docker build \
  -t infocus-api:v1.0.0 \
  --build-arg NODE_VERSION=18 \
  apps/api
```

### Image Details

- **Base Image**: `node:18-alpine`
- **Size**: ~150-200MB (after multi-stage optimization)
- **Health Check**: Every 30 seconds
- **Exposed Port**: 3000

## Railway Deployment

### Prerequisites

- Railway CLI installed: `npm install -g @railway/cli`
- Railway project created
- PostgreSQL plugin added to Railway project

### Deployment Steps

#### 1. Login to Railway

```bash
railway login
```

#### 2. Link Project

```bash
cd /home/engine/project
railway link
```

#### 3. Configure Environment Variables

```bash
# Set required variables
railway variables set DATABASE_URL "postgresql://..." \
  JWT_ACCESS_SECRET "..." \
  JWT_REFRESH_SECRET "..." \
  NODE_ENV "production" \
  TMDB_API_KEY "..."
```

Or use the Railway dashboard to set variables in the project settings.

#### 4. Deploy

```bash
railway deploy
```

The deployment will:
- Build the Docker image
- Run migrations (via Procfile release phase)
- Start the application

#### 5. Verify Deployment

```bash
# Check deployment status
railway status

# View logs
railway logs

# Check health
curl https://your-railway-domain.railway.app/health
```

### Rolling Back

```bash
railway rollback
```

### Troubleshooting Railway

Check logs for migration errors:

```bash
railway logs --service infocus-api
```

View environment variables:

```bash
railway variables list
```

## Render Deployment

### Prerequisites

- Render account
- GitHub repository connected to Render
- PostgreSQL database created in Render

### Deployment Steps

#### 1. Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Configure settings:
   - **Name**: infocus-api
   - **Root Directory**: apps/api
   - **Runtime**: Node
   - **Build Command**: `pnpm install && pnpm run build && pnpm run migrate:prod`
   - **Start Command**: `node dist/index.js`

#### 2. Set Environment Variables

In the Render dashboard, go to Environment:

```
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
NODE_ENV=production
TMDB_API_KEY=your-api-key
PORT=3000
```

#### 3. Configure Procfile (Optional)

Render can automatically use the Procfile if present:

```
release: pnpm run migrate:prod
web: node dist/index.js
```

#### 4. Deploy

Push to the connected GitHub branch (usually main):

```bash
git push origin main
```

Render will automatically:
- Build the image
- Run migrations
- Deploy the application

#### 5. Verify Deployment

```bash
# View in Render dashboard or curl the health endpoint
curl https://your-render-domain.onrender.com/health
```

### Custom Domains

1. Go to Web Service settings
2. Add custom domain
3. Configure DNS records (instructions provided by Render)

## CI/CD Pipeline

### GitHub Actions Workflow

The project includes a comprehensive CI/CD pipeline (`.github/workflows/ci-cd.yml`):

#### Pipeline Stages

1. **Install Dependencies**: Caches and installs all dependencies
2. **Lint**: Runs ESLint on all packages
3. **Type Check**: Runs TypeScript compiler in check mode
4. **Test**: Runs Jest tests with PostgreSQL database
5. **Build**: Builds Docker image and uploads artifact
6. **Deploy**: Deploys to Railway/Render on main branch push

#### Secrets Configuration

Configure these secrets in GitHub repository settings:

- `RAILWAY_TOKEN` - Railway API token for deployments
- `RENDER_DEPLOY_HOOK_URL` - Webhook URL for Render deployments

### Configuring Secrets

#### For Railway

1. Generate Railway token at https://railway.app/account/tokens
2. Go to GitHub repository → Settings → Secrets
3. Add `RAILWAY_TOKEN` with the generated token

#### For Render

1. Get deploy hook URL from Render service settings
2. Go to GitHub repository → Settings → Secrets
3. Add `RENDER_DEPLOY_HOOK_URL` with the webhook URL

### Workflow Triggers

The pipeline runs on:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

Deploy step only runs on push to `main` branch.

### Skipping CI

To skip the CI pipeline for a commit:

```bash
git commit --message "Fix typo [skip ci]"
```

## Database Migrations

### Automatic Migrations

Migrations run automatically during deployment via the Procfile release phase:

```
release: pnpm run migrate:prod
```

### Manual Migration (If Needed)

If migrations don't run automatically:

```bash
# Via Railway
railway run pnpm run migrate:prod

# Via Render (SSH into container)
render exec pnpm run migrate:prod

# Local testing
cd apps/api
DATABASE_URL="your-prod-db-url" pnpm run migrate:prod
```

### Creating New Migrations

During development:

```bash
cd apps/api

# Create a new migration after schema changes
pnpm run migrate
```

This creates a migration file in `prisma/migrations/`.

### Viewing Migration History

```bash
cd apps/api

# List applied migrations
pnpm run prisma -- migrate status
```

## Troubleshooting

### Application Won't Start

1. Check environment variables are set correctly
2. Verify DATABASE_URL is accessible
3. Check logs for migration errors

```bash
# Railway
railway logs

# Render
# Check logs in dashboard
```

### Database Connection Issues

- Verify DATABASE_URL format: `postgresql://user:password@host:port/database`
- Check database server is running
- Verify firewall rules allow connection
- Test locally first

### Migrations Fail

1. Check Prisma schema is valid
2. Verify migration files exist and are correct
3. Check database permissions
4. Review migration logs

### Build Timeouts

- Increase timeout limits in CI/CD
- Clean Docker cache: `docker builder prune`
- Check for network issues

### Port Conflicts

- Ensure port 3000 is available
- Change PORT environment variable if needed
- Check for existing process: `lsof -i :3000`

### Out of Memory

- Increase container memory limit
- Check for memory leaks in application
- Enable swap space (for Linux)

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Use strong JWT secrets** - Generate with `openssl rand -hex 32`
3. **Enable HTTPS** - Platform should handle this automatically
4. **Update dependencies** - Keep Node.js and packages updated
5. **Database backups** - Configure automatic backups in production
6. **Monitor logs** - Set up log aggregation and alerts
7. **API rate limiting** - Consider adding rate limiting middleware
8. **CORS configuration** - Restrict to trusted origins

## Performance Optimization

1. **Database connection pooling** - PostgreSQL supports connection pooling
2. **Caching** - Consider implementing Redis for caching
3. **CDN** - Frontend assets should be served from CDN
4. **Monitoring** - Set up error tracking (Sentry, etc.)
5. **Logging** - Use structured logging for better observability

## Additional Resources

- [Prisma Deployment Guide](https://www.prisma.io/docs/orm/prisma-client/deployment)
- [Railway Documentation](https://railway.app/docs)
- [Render Documentation](https://render.com/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [GitHub Actions](https://docs.github.com/en/actions)

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

**For comprehensive Railway deployment verification, see [RAILWAY_DEPLOYMENT_VERIFICATION.md](./RAILWAY_DEPLOYMENT_VERIFICATION.md)**

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

# API Port (defaults to 3000)
PORT=3000

# TMDB API Key
TMDB_API_KEY=<your-api-key-from-themoviedb.org>

# CORS Origin(s) - comma-separated list of allowed origins
# Required for production to restrict cross-origin requests
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
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
- `CORS_ORIGIN` - Already covered in required variables above

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
railway variables set \
  DATABASE_URL "postgresql://user:password@host:port/infocus" \
  JWT_ACCESS_SECRET "$(openssl rand -hex 32)" \
  JWT_REFRESH_SECRET "$(openssl rand -hex 32)" \
  NODE_ENV "production" \
  PORT "3000" \
  TMDB_API_KEY "your-tmdb-api-key" \
  CORS_ORIGIN "https://app.yourdomain.com"
```

Or use the Railway dashboard to set variables in the project settings. Ensure `CORS_ORIGIN` matches your frontend domain exactly.

#### 4. Deploy

```bash
railway deploy
```

The deployment will:

- Build the Docker image
- Run migrations automatically (via Procfile release phase)
- Start the application on port 3000
- Apply CORS configuration from `CORS_ORIGIN` environment variable

#### 5. Verify Deployment

```bash
# Check deployment status
railway status

# View logs (check for successful migrations and startup messages)
railway logs

# Check health endpoint
curl https://your-railway-domain.railway.app/health

# Verify CORS configuration (should include Access-Control-Allow-Origin header)
curl -H "Origin: https://app.yourdomain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://your-railway-domain.railway.app/auth/login -v
```

If deployment fails, check logs for migration errors:

```bash
railway logs --service infocus-api
```

### Rolling Back

```bash
railway rollback
```

### End-to-End Verification Checklist

After deployment, run these smoke tests to verify the Railway deployment is fully functional:

#### 1. Health Check

```bash
RAILWAY_DOMAIN="your-railway-domain.railway.app"

# Test health endpoint (should return { status: 'ok', timestamp: ... })
curl -s https://$RAILWAY_DOMAIN/health | jq .
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

#### 2. Migration Verification

Check that migrations have been applied:

```bash
# View recent logs to confirm migrations ran
railway logs | grep -i "migration\|prisma" | head -20

# Or manually check the database
railway run pnpm run prisma -- migrate status
```

#### 3. Authentication Flow Test

```bash
RAILWAY_DOMAIN="your-railway-domain.railway.app"
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123!"

# Step 1: Register a new user
REGISTER_RESPONSE=$(curl -s -X POST https://$RAILWAY_DOMAIN/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"Test User\"
  }")

echo "Register Response: $REGISTER_RESPONSE"
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.accessToken')

# Step 2: Login with the same credentials
LOGIN_RESPONSE=$(curl -s -X POST https://$RAILWAY_DOMAIN/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

echo "Login Response: $LOGIN_RESPONSE"
NEW_ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')

# Verify login returned a valid token
if [ -z "$NEW_ACCESS_TOKEN" ] || [ "$NEW_ACCESS_TOKEN" = "null" ]; then
  echo "❌ Login failed: No access token returned"
  exit 1
else
  echo "✓ Login successful, got access token"
fi
```

#### 4. Database Connectivity Test (Watchlist CRUD)

```bash
RAILWAY_DOMAIN="your-railway-domain.railway.app"

# Using the access token from previous login
ACCESS_TOKEN="your-access-token-here"

# Create a watchlist entry
CREATE_RESPONSE=$(curl -s -X POST https://$RAILWAY_DOMAIN/watchlist \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tmdbId": 550,
    "tmdbType": "movie",
    "status": "watching",
    "rating": 5,
    "notes": "Classic film",
    "metadata": {
      "title": "Fight Club",
      "description": "An insomniac office worker and a devil-may-care soap maker",
      "posterPath": "/path/to/poster.jpg",
      "releaseDate": "1999-10-15",
      "rating": 8.5,
      "genres": ["Drama", "Thriller"],
      "streamingProviders": []
    }
  }')

echo "Create Watchlist Entry Response: $CREATE_RESPONSE"
ENTRY_ID=$(echo $CREATE_RESPONSE | jq -r '.data.id')

# Read the watchlist
curl -s -X GET https://$RAILWAY_DOMAIN/watchlist \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

# Update the watchlist entry
curl -s -X PUT https://$RAILWAY_DOMAIN/watchlist/$ENTRY_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "rating": 5
  }' | jq .

# Delete the watchlist entry
curl -s -X DELETE https://$RAILWAY_DOMAIN/watchlist/$ENTRY_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
```

#### 5. CORS Validation

```bash
RAILWAY_DOMAIN="your-railway-domain.railway.app"
FRONTEND_DOMAIN="your-frontend-domain.vercel.app"

# Send CORS preflight request
curl -s -X OPTIONS https://$RAILWAY_DOMAIN/auth/login \
  -H "Origin: https://$FRONTEND_DOMAIN" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1 | grep -i "access-control-allow-origin"
```

Expected response header:
```
access-control-allow-origin: https://your-frontend-domain.vercel.app
```

If this header is missing, the frontend will encounter CORS errors. Ensure `CORS_ORIGIN` environment variable is correctly set to match your frontend domain.

#### 6. Troubleshooting Deployment Issues

If any of the above tests fail:

**Health Check Fails:**
- Check that the service is running: `railway status`
- View logs: `railway logs --service infocus-api --tail 100`
- Verify PORT is set to 3000: `railway variables get PORT`

**Migration Errors:**
- Check recent logs: `railway logs | grep -i "migration\|error"`
- Manually run migrations: `railway run pnpm run migrate:prod`
- Check database connectivity: `railway run pnpm run prisma -- db push`

**Authentication/Database Errors:**
- Verify DATABASE_URL is set correctly: `railway variables get DATABASE_URL`
- Check database is accessible: `railway run pnpm run prisma -- db validate`
- View application logs: `railway logs --service infocus-api --follow`

**CORS Errors:**
- Verify CORS_ORIGIN is set to frontend domain: `railway variables get CORS_ORIGIN`
- Update if needed: `railway variables set CORS_ORIGIN "https://your-frontend-domain.vercel.app"`
- Redeploy: `railway up --detach`

**Log Streaming for Debugging:**
```bash
# Real-time log streaming
railway logs --follow

# Get logs with timestamps
railway logs --timestamp

# Get last N lines
railway logs --tail 50

# Filter by service
railway logs --service infocus-api
```

**Manual Rollback:**
```bash
# If deployment is broken, rollback to previous version
railway rollback

# View deployment history
railway deployments
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

In the Render dashboard, go to Environment and set all required variables:

```
DATABASE_URL=postgresql://user:password@host:port/infocus
JWT_ACCESS_SECRET=<generated-with: openssl rand -hex 32>
JWT_REFRESH_SECRET=<generated-with: openssl rand -hex 32>
NODE_ENV=production
TMDB_API_KEY=your-tmdb-api-key
PORT=3000
CORS_ORIGIN=https://app.yourdomain.com
```

Ensure `CORS_ORIGIN` is set to your frontend domain to allow API requests.

#### 3. Configure Procfile

Render can automatically use the Procfile if present:

```
release: pnpm run migrate:prod
web: node dist/index.js
```

This ensures migrations run automatically during deployment before the application starts.

#### 4. Deploy

Push to the connected GitHub branch (usually main):

```bash
git push origin main
```

Render will automatically:

- Build the image
- Run migrations via the release phase
- Deploy the application on port 3000
- Apply CORS configuration from environment variables

#### 5. Verify Deployment

```bash
# Check health endpoint
curl https://your-render-domain.onrender.com/health

# Verify CORS configuration (look for Access-Control-Allow-Origin header)
curl -H "Origin: https://app.yourdomain.com" \
  -H "Access-Control-Request-Method: POST" \
  https://your-render-domain.onrender.com/auth/login -v

# Check Render logs in dashboard for migration success and startup messages
```

If migrations fail to run automatically, you can manually execute them:

```bash
# Via Render shell
render exec pnpm run migrate:prod

# Or directly using your production DATABASE_URL
DATABASE_URL="your-prod-db-url" pnpm run migrate:prod
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

Configure these secrets in GitHub repository settings to enable automated deployments:

**For Railway Deployment:**
- `RAILWAY_TOKEN` - Railway API token for automated deployments

**For Render Deployment (Optional):**
- `RENDER_DEPLOY_HOOK_URL` - Webhook URL for Render deployments

### Configuring Secrets

#### For Railway (Recommended)

1. Generate Railway token at https://railway.app/account/tokens
2. Go to GitHub repository → Settings → Secrets and variables → Actions
3. Create new secret: `RAILWAY_TOKEN` with the generated token
4. The CI/CD pipeline will automatically deploy to Railway when you push to main

#### For Render (Optional)

1. Get deploy hook URL from Render service → Settings → Deploy Hook
2. Go to GitHub repository → Settings → Secrets and variables → Actions
3. Create new secret: `RENDER_DEPLOY_HOOK_URL` with the webhook URL
4. Render will deploy automatically when the webhook is triggered

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

Both Railway and Render support this pattern. The release phase executes before the application starts, ensuring your database schema is up-to-date.

### Verifying Migration Status

After deployment, verify that migrations completed successfully:

```bash
# Railway
railway logs

# Render
# Check logs in the Render dashboard

# Both: Test the health endpoint to confirm the app is running
curl https://your-deployed-domain.com/health
```

Look for log messages indicating successful migration (e.g., "migrations completed" or no prisma migration errors).

### Manual Migration (If Needed)

If migrations don't run automatically or you need to troubleshoot:

```bash
# Via Railway
railway run pnpm run migrate:prod

# Via Render
render exec pnpm run migrate:prod

# Local testing with production database
cd apps/api
DATABASE_URL="your-prod-db-url" pnpm run migrate:prod
```

### Checking Pending Migrations

To see if there are any pending migrations:

```bash
cd apps/api
DATABASE_URL="your-db-url" pnpm run prisma -- migrate status
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

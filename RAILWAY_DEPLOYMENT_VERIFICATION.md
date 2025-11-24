# Railway Deployment Verification Guide

This document provides a comprehensive verification checklist and troubleshooting guide for Railway deployments of the InFocus API.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Deployment Process](#deployment-process)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Smoke Test Suite](#smoke-test-suite)
6. [Troubleshooting](#troubleshooting)
7. [CI/CD Integration](#cicd-integration)

## Pre-Deployment Checklist

Before deploying to Railway, ensure the following:

- [ ] Railway account created and project initialized
- [ ] PostgreSQL plugin added to the Railway project
- [ ] `railway.json` present in project root with correct Dockerfile reference
- [ ] GitHub repository secrets configured (`RAILWAY_TOKEN`)
- [ ] All required environment variables documented
- [ ] Local testing completed with Docker
- [ ] Code pushed to a branch (main triggers CI/CD deploy)

## Environment Configuration

### Required Environment Variables for Railway

The following environment variables **must** be set in the Railway project:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/infocus

# Node Environment
NODE_ENV=production

# JWT Secrets (generate using: openssl rand -hex 32)
JWT_ACCESS_SECRET=<64-character-hex-string>
JWT_REFRESH_SECRET=<64-character-hex-string>

# API Configuration
PORT=3000

# TMDB API
TMDB_API_KEY=<your-tmdb-api-key>

# CORS Configuration (comma-separated list of allowed origins)
CORS_ORIGIN=https://app.yourdomain.com
```

### Setting Variables via Railway CLI

```bash
# Login to Railway
railway login

# Link to your project
railway link

# Set all required variables at once
railway variables set \
  NODE_ENV "production" \
  PORT "3000" \
  JWT_ACCESS_SECRET "$(openssl rand -hex 32)" \
  JWT_REFRESH_SECRET "$(openssl rand -hex 32)" \
  TMDB_API_KEY "your-api-key" \
  CORS_ORIGIN "https://app.yourdomain.com"

# Verify variables are set
railway variables list
```

### Setting Variables via Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app)
2. Select your project
3. Go to "Variables" tab
4. Add each variable using the input form
5. Click "Deploy" to apply changes

## Deployment Process

### Manual Deployment

```bash
# Ensure you're in the project root
cd /home/engine/project

# Link to Railway project if not already linked
railway link

# Deploy to Railway
railway up --detach
```

### Automated Deployment via CI/CD

When you push to the `main` branch, the GitHub Actions CI/CD pipeline will:

1. Run linting and type checks
2. Execute test suite with PostgreSQL
3. Build Docker image
4. Deploy to Railway (if all checks pass)

To verify the deployment was triggered:

1. Go to GitHub repository → Actions
2. Find the latest workflow run
3. Check that all jobs completed successfully
4. Verify the "Deploy to Production" job ran without errors

## Post-Deployment Verification

### Immediate Checks (5 minutes after deployment)

```bash
# 1. Check deployment status
railway status

# 2. View recent logs to confirm startup
railway logs --tail 50

# 3. Verify service name in logs
railway logs | grep "infocus-api"
```

### Health Verification (10 minutes after deployment)

```bash
# Get your Railway domain
RAILWAY_DOMAIN=$(railway variables get RAILWAY_URL | sed 's/https:\/\///' | sed 's/\/.*//')

# Or manually check Railway dashboard for the domain

# Test health endpoint
curl -s https://${RAILWAY_DOMAIN}/health | jq .
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

### Database Migration Verification

```bash
# Check logs for migration success
railway logs | grep -i "migration\|prisma" | head -20

# Should see messages like:
# - "Database connected successfully"
# - Prisma migration messages
# - "InFocus API server running on port 3000"
```

## Smoke Test Suite

Run these comprehensive tests to verify the deployment is fully functional.

### Test 1: Health Endpoint

```bash
RAILWAY_DOMAIN="your-railway-domain"

echo "Testing health endpoint..."
HEALTH=$(curl -s https://${RAILWAY_DOMAIN}/health | jq -r '.status')

if [ "$HEALTH" = "ok" ]; then
  echo "✓ Health check passed"
else
  echo "✗ Health check failed"
  exit 1
fi
```

### Test 2: User Registration

```bash
RAILWAY_DOMAIN="your-railway-domain"
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123!"

echo "Testing user registration..."
REGISTER=$(curl -s -X POST https://${RAILWAY_DOMAIN}/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"Test User\"
  }")

echo "Register response: $REGISTER"

# Extract access token
ACCESS_TOKEN=$(echo $REGISTER | jq -r '.accessToken')

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
  echo "✗ Registration failed: No access token returned"
  exit 1
else
  echo "✓ Registration passed, access token: ${ACCESS_TOKEN:0:20}..."
fi
```

### Test 3: User Login

```bash
RAILWAY_DOMAIN="your-railway-domain"
TEST_EMAIL="your-test-email@example.com"
TEST_PASSWORD="TestPassword123!"

echo "Testing user login..."
LOGIN=$(curl -s -X POST https://${RAILWAY_DOMAIN}/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

echo "Login response: $LOGIN"

LOGIN_TOKEN=$(echo $LOGIN | jq -r '.accessToken')

if [ -z "$LOGIN_TOKEN" ] || [ "$LOGIN_TOKEN" = "null" ]; then
  echo "✗ Login failed"
  exit 1
else
  echo "✓ Login passed"
fi
```

### Test 4: Protected Route Access

```bash
RAILWAY_DOMAIN="your-railway-domain"
ACCESS_TOKEN="your-access-token-from-login"

echo "Testing protected route access..."
PROFILE=$(curl -s -X GET https://${RAILWAY_DOMAIN}/api/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Protected route response: $PROFILE"

if echo $PROFILE | jq -e '.user' > /dev/null; then
  echo "✓ Protected route access granted"
else
  echo "✗ Protected route access denied"
  exit 1
fi
```

### Test 5: Watchlist CRUD Operations

```bash
RAILWAY_DOMAIN="your-railway-domain"
ACCESS_TOKEN="your-access-token"

echo "Testing watchlist CRUD operations..."

# CREATE
echo "1. Creating watchlist entry..."
CREATE=$(curl -s -X POST https://${RAILWAY_DOMAIN}/watchlist \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tmdbId": 550,
    "tmdbType": "movie",
    "status": "watching",
    "rating": 5,
    "notes": "Test entry",
    "metadata": {
      "title": "Fight Club",
      "description": "A classic film",
      "posterPath": "/path.jpg",
      "releaseDate": "1999-10-15",
      "rating": 8.5,
      "genres": ["Drama", "Thriller"]
    }
  }')

ENTRY_ID=$(echo $CREATE | jq -r '.data.id')
if [ -z "$ENTRY_ID" ] || [ "$ENTRY_ID" = "null" ]; then
  echo "✗ Create watchlist entry failed"
  exit 1
fi
echo "✓ Create passed (ID: $ENTRY_ID)"

# READ
echo "2. Reading watchlist..."
READ=$(curl -s -X GET https://${RAILWAY_DOMAIN}/watchlist \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo $READ | jq -e '.data | length > 0' > /dev/null; then
  echo "✓ Read watchlist passed"
else
  echo "✗ Read watchlist failed"
  exit 1
fi

# UPDATE
echo "3. Updating watchlist entry..."
UPDATE=$(curl -s -X PUT https://${RAILWAY_DOMAIN}/watchlist/$ENTRY_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "rating": 4
  }')

if echo $UPDATE | jq -e '.data' > /dev/null; then
  echo "✓ Update passed"
else
  echo "✗ Update failed"
  exit 1
fi

# DELETE
echo "4. Deleting watchlist entry..."
DELETE=$(curl -s -X DELETE https://${RAILWAY_DOMAIN}/watchlist/$ENTRY_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if [ "$(echo $DELETE | jq -r '.message')" = "Watchlist entry deleted successfully" ]; then
  echo "✓ Delete passed"
else
  echo "✗ Delete failed"
  exit 1
fi

echo "✓ All CRUD operations passed"
```

### Test 6: CORS Configuration

```bash
RAILWAY_DOMAIN="your-railway-domain"
FRONTEND_DOMAIN="app.yourdomain.com"

echo "Testing CORS configuration..."

# Send CORS preflight request
CORS=$(curl -s -w "\n%{http_code}" -X OPTIONS \
  https://${RAILWAY_DOMAIN}/auth/login \
  -H "Origin: https://$FRONTEND_DOMAIN" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type")

STATUS_CODE=$(echo "$CORS" | tail -1)
HEADERS=$(echo "$CORS" | head -n -1)

if echo "$HEADERS" | grep -q "Access-Control-Allow-Origin"; then
  ALLOW_ORIGIN=$(echo "$HEADERS" | grep -i "access-control-allow-origin" | cut -d' ' -f2-)
  echo "✓ CORS enabled, Access-Control-Allow-Origin: $ALLOW_ORIGIN"
  
  if [[ "$ALLOW_ORIGIN" == *"$FRONTEND_DOMAIN"* ]]; then
    echo "✓ CORS allows your frontend domain"
  else
    echo "✗ CORS does not allow your frontend domain ($FRONTEND_DOMAIN)"
    echo "  Set CORS_ORIGIN environment variable to match frontend domain"
    exit 1
  fi
else
  echo "✗ CORS headers not found"
  exit 1
fi
```

### Test 7: Database Connectivity

```bash
# Verify migrations have been applied
railway run pnpm run prisma -- migrate status

# Should show all migrations as applied with timestamps
# Example output:
# Status: OK
# Applied migrations:
#   20240101000001_init
#   20240102000001_add_features
```

## Troubleshooting

### Issue: Health Check Fails (Connection Refused)

**Symptoms:**
- `curl: (7) Failed to connect`
- Service not accessible at domain

**Solutions:**
```bash
# 1. Check service status
railway status

# 2. Verify service is running
railway logs --tail 20

# 3. Check if deployment is still in progress
railway deployments

# 4. Wait 2-3 minutes for deployment to complete if still "in progress"
```

### Issue: 502 Bad Gateway

**Symptoms:**
- API responds with 502 error
- Application crashed or not accepting connections

**Solutions:**
```bash
# 1. Check logs for errors
railway logs --follow

# 2. Look for:
# - Failed database connection
# - JavaScript/TypeScript errors
# - Missing environment variables

# 3. Verify all required env vars are set
railway variables list

# 4. Check database connectivity
railway run pnpm run prisma -- db push
```

### Issue: Authentication Fails (Invalid Token)

**Symptoms:**
- Login returns but token doesn't work
- Protected routes return 401 Unauthorized

**Solutions:**
```bash
# 1. Verify JWT secrets are set
railway variables get JWT_ACCESS_SECRET
railway variables get JWT_REFRESH_SECRET

# 2. If empty, regenerate and set them
railway variables set \
  JWT_ACCESS_SECRET "$(openssl rand -hex 32)" \
  JWT_REFRESH_SECRET "$(openssl rand -hex 32)"

# 3. Redeploy application
railway up --detach

# 4. Wait for deployment to complete before testing
```

### Issue: CORS Errors in Browser

**Symptoms:**
- `Access to XMLHttpRequest has been blocked by CORS policy`
- Frontend cannot communicate with API

**Solutions:**
```bash
# 1. Verify CORS_ORIGIN is set to your frontend domain
railway variables get CORS_ORIGIN

# 2. Update if needed (use exact domain from Vercel)
railway variables set CORS_ORIGIN "https://app-abc123.vercel.app"

# 3. Redeploy
railway up --detach

# 4. Test CORS headers
curl -s -X OPTIONS https://${RAILWAY_DOMAIN}/auth/login \
  -H "Origin: https://app-abc123.vercel.app" \
  -v 2>&1 | grep -i access-control
```

### Issue: Database Migration Fails

**Symptoms:**
- Startup logs show "migration failed"
- `prisma migrate` errors in logs

**Solutions:**
```bash
# 1. Check recent logs
railway logs | grep -i "migration\|error"

# 2. Manually check migration status
railway run pnpm run prisma -- migrate status

# 3. If stuck, try resolving:
railway run pnpm run prisma -- migrate resolve

# 4. Force migration
railway run pnpm run prisma -- migrate deploy --skip-generate

# 5. If database is corrupted, full reset may be needed
# WARNING: This deletes all data!
# railway run pnpm run prisma -- db push --skip-generate
```

### Issue: Out of Memory or Slow Response

**Symptoms:**
- API responses very slow
- Memory usage constantly high
- `out of memory` errors in logs

**Solutions:**
```bash
# 1. Check service logs for memory issues
railway logs | grep -i "memory\|heap"

# 2. Scale up RAM in Railway dashboard
# - Go to Service Settings
# - Increase Memory allocation
# - Redeploy

# 3. Check for database query issues
# - Review logs for slow queries
# - Add database indexes if needed

# 4. Monitor resource usage
railway logs --follow | grep -i "memory\|cpu"
```

### Issue: Service Keeps Restarting

**Symptoms:**
- Service starts and immediately crashes
- Logs show repeated startup messages

**Solutions:**
```bash
# 1. Check startup logs
railway logs | head -50

# 2. Look for errors in:
# - Environment variable parsing
# - Database connection
# - File permissions

# 3. Verify DATABASE_URL format is correct
railway variables get DATABASE_URL

# 4. Test database connection manually
railway run pnpm run prisma -- db validate

# 5. Check for missing dependencies
railway logs | grep -i "error\|require\|cannot find"
```

## Log Streaming & Debugging

### Real-Time Log Monitoring

```bash
# Follow logs in real-time
railway logs --follow

# Watch with timestamps
railway logs --follow --timestamp

# Last 100 lines
railway logs --tail 100

# Filter by service
railway logs --service infocus-api --tail 50
```

### Common Log Patterns

```bash
# Look for successful startup
railway logs | grep "InFocus API server running"

# Check for database connection success
railway logs | grep "Database connected successfully"

# Find errors
railway logs | grep -i "error"

# Check migration progress
railway logs | grep -i "migration"

# Monitor for crashes
railway logs | grep -i "sigterm\|sigkill\|exit"
```

## CI/CD Integration

### GitHub Actions Deployment Flow

The `.github/workflows/ci-cd.yml` workflow:

1. **Install Dependencies** - Caches and installs pnpm packages
2. **Lint** - Runs ESLint on all code
3. **Type Check** - Runs TypeScript compiler
4. **Test** - Runs Jest with PostgreSQL test database
5. **Build** - Builds Docker image
6. **Deploy** - Runs only on main branch push:
   ```bash
   railway up --service infocus-api --detach
   ```

### Triggering Deployment

**Option 1: Push to main branch**
```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

**Option 2: Manual dispatch (if configured)**
- Go to GitHub Actions
- Select CI/CD Pipeline workflow
- Click "Run workflow"

### Verifying Deployment from CI/CD

1. Go to GitHub repository → Actions
2. Find the latest workflow run for the `main` branch push
3. Check these jobs pass:
   - ✓ Install Dependencies
   - ✓ Lint
   - ✓ Type Check
   - ✓ Test
   - ✓ Build API
   - ✓ Deploy to Production

4. If Deploy job failed, click on it to see error details

### Troubleshooting CI/CD Deployments

**Deploy job shows "skipped":**
- Likely triggered on non-main branch or PR
- The deploy only runs on `git push origin main`

**RAILWAY_TOKEN not found:**
- GitHub Secrets not configured
- Add to repository: Settings → Secrets and variables → Actions
- Create `RAILWAY_TOKEN` with Railway API token from https://railway.app/account/tokens

**Build fails:**
- Check Docker build logs in the "Build API" job
- Fix TypeScript/Lint errors shown in earlier jobs
- Usually cache issues or dependency problems

## Success Criteria

A successful Railway deployment should have:

- ✓ Health check endpoint responding with `{ status: 'ok' }`
- ✓ User registration and login working
- ✓ Protected routes requiring valid authentication token
- ✓ Watchlist CRUD operations functioning
- ✓ Database migrations applied successfully
- ✓ CORS headers correctly configured
- ✓ Logs showing no errors or warnings
- ✓ Response times under 500ms for normal operations
- ✓ CI/CD pipeline showing green/passing status

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway CLI Reference](https://docs.railway.app/reference/cli-api)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

# Railway Deployment Setup Checklist

This checklist ensures all necessary configurations are in place before and after deploying to Railway.

## Pre-Deployment Setup

### Railway Project Configuration

- [ ] Railway account created at https://railway.app
- [ ] New project created in Railway dashboard
- [ ] PostgreSQL plugin added to the project
- [ ] Project ID noted: `_________________`
- [ ] PostgreSQL database accessible and initialized

### Local Repository Setup

- [ ] Repository cloned locally
- [ ] Branch `verify-railway-deploy` checked out
- [ ] All changes committed to the branch
- [ ] Code pushed to remote

### Environment Variables Configuration

Set the following variables in the Railway project (via CLI or Dashboard):

#### Required Variables

- [ ] `DATABASE_URL` = `_____________________________`
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3000`
- [ ] `JWT_ACCESS_SECRET` = `[64-char hex string]` (generated with: `openssl rand -hex 32`)
- [ ] `JWT_REFRESH_SECRET` = `[64-char hex string]` (generated with: `openssl rand -hex 32`)
- [ ] `TMDB_API_KEY` = `_____________________________`
- [ ] `CORS_ORIGIN` = `_____________________________`

#### Commands to Set Variables

```bash
railway login
railway link
railway variables set \
  NODE_ENV "production" \
  PORT "3000" \
  JWT_ACCESS_SECRET "$(openssl rand -hex 32)" \
  JWT_REFRESH_SECRET "$(openssl rand -hex 32)" \
  TMDB_API_KEY "your-api-key" \
  CORS_ORIGIN "https://your-frontend-domain.vercel.app"

# Verify
railway variables list
```

- [ ] All variables confirmed to be set correctly

### GitHub Configuration

- [ ] GitHub repository secrets configured
- [ ] `RAILWAY_TOKEN` secret added:
  - [ ] Generated from https://railway.app/account/tokens
  - [ ] Added to GitHub repository Settings → Secrets and variables → Actions
  - [ ] Secret name: `RAILWAY_TOKEN`

### Deployment Configuration Files

- [ ] `railway.json` present in project root
- [ ] `railway.json` references correct Dockerfile: `apps/api/Dockerfile`
- [ ] `apps/api/Procfile` contains:
  - [ ] `release: pnpm run migrate:prod`
  - [ ] `web: node dist/index.js`
- [ ] `apps/api/Dockerfile` is multi-stage build with health checks
- [ ] `.dockerignore` is properly configured to exclude unnecessary files

### Code Quality Checks

- [ ] `pnpm lint` passes locally
- [ ] `pnpm run typecheck` passes locally
- [ ] `pnpm run test` passes locally (with PostgreSQL test database)
- [ ] No uncommitted changes that need to be pushed

## Deployment Process

### Manual Deployment Steps

```bash
# From project root
cd /home/engine/project

# Ensure on verify-railway-deploy branch
git checkout verify-railway-deploy

# Login to Railway
railway login

# Link to Railway project
railway link

# Deploy
railway up --detach

# Monitor deployment
railway logs --follow
```

- [ ] Deployment initiated successfully
- [ ] Logs show no errors during build
- [ ] Application starts without failures

### Automated Deployment (CI/CD)

For automated deployment via GitHub Actions:

```bash
# Ensure all changes are committed
git add .
git commit -m "chore: railway deployment verification"

# Push to main branch to trigger CI/CD
git push origin main
```

- [ ] Push triggered GitHub Actions workflow
- [ ] All workflow jobs passed:
  - [ ] Install Dependencies ✓
  - [ ] Lint ✓
  - [ ] Type Check ✓
  - [ ] Test ✓
  - [ ] Build API ✓
  - [ ] Deploy to Production ✓

## Post-Deployment Verification

### Immediate Checks (5 minutes after deployment)

```bash
# Check deployment status
railway status

# Verify service is running
railway logs --tail 20
```

- [ ] Service status shows "deployed" or "running"
- [ ] No error messages in recent logs
- [ ] Database connection confirmed in logs
- [ ] Migrations completed successfully in logs

### Get Railway Domain

```bash
# Get the public URL for your service
railway domains list

# Or check the Railway dashboard for the domain
# Example: infocus-api-abc123.railway.app
```

- [ ] Railway domain URL noted: `_______________________________`

### Health Check Verification

```bash
RAILWAY_DOMAIN="your-railway-domain"

# Test health endpoint
curl -s https://${RAILWAY_DOMAIN}/health | jq .
```

- [ ] Health endpoint responds with `{ status: "ok", timestamp: "..." }`
- [ ] Response code is 200 OK

### Authentication Testing

```bash
RAILWAY_DOMAIN="your-railway-domain"
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123!"

# Register new user
curl -s -X POST https://${RAILWAY_DOMAIN}/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"Test User\"
  }" | jq .
```

- [ ] User registration successful
- [ ] Access token returned in response
- [ ] No database errors in logs

### Login Verification

```bash
RAILWAY_DOMAIN="your-railway-domain"

# Login with registered user
curl -s -X POST https://${RAILWAY_DOMAIN}/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"your-test-email@example.com\",
    \"password\": \"TestPassword123!\"
  }" | jq .
```

- [ ] Login successful
- [ ] Valid JWT access token returned
- [ ] User data included in response

### Protected Route Access

```bash
RAILWAY_DOMAIN="your-railway-domain"
ACCESS_TOKEN="your-jwt-token-from-login"

# Access protected route
curl -s https://${RAILWAY_DOMAIN}/api/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
```

- [ ] Protected route returns user data
- [ ] No 401 Unauthorized errors
- [ ] Response includes user information

### Database Connectivity Testing

```bash
RAILWAY_DOMAIN="your-railway-domain"
ACCESS_TOKEN="your-jwt-token-from-login"

# Create watchlist entry
curl -s -X POST https://${RAILWAY_DOMAIN}/watchlist \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tmdbId": 550,
    "tmdbType": "movie",
    "status": "watching",
    "rating": 5,
    "notes": "Test",
    "metadata": {
      "title": "Fight Club",
      "description": "Test",
      "releaseDate": "1999-10-15",
      "genres": []
    }
  }' | jq .
```

- [ ] Watchlist entry created successfully
- [ ] Entry ID returned in response
- [ ] No database errors in logs

### CORS Configuration Verification

```bash
RAILWAY_DOMAIN="your-railway-domain"
FRONTEND_DOMAIN="your-frontend-domain.vercel.app"

# Test CORS preflight
curl -s -X OPTIONS https://${RAILWAY_DOMAIN}/auth/login \
  -H "Origin: https://$FRONTEND_DOMAIN" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1 | grep -i "access-control-allow-origin"
```

- [ ] Response includes `Access-Control-Allow-Origin` header
- [ ] Header value matches frontend domain
- [ ] CORS preflight returns 200 OK (or 204 No Content)

### Migration Verification

```bash
# Check migration status
railway run pnpm run prisma -- migrate status
```

- [ ] All migrations marked as "applied"
- [ ] Migration dates and names correct
- [ ] No "pending" migrations

### Performance and Response Time

```bash
RAILWAY_DOMAIN="your-railway-domain"

# Time health endpoint response
time curl -s https://${RAILWAY_DOMAIN}/health > /dev/null
```

- [ ] Response time under 500ms
- [ ] No timeout errors
- [ ] Consistent response times across multiple requests

## Production Readiness

### Frontend Integration

- [ ] Frontend `NEXT_PUBLIC_API_URL` configured to Railway domain
- [ ] Frontend deployed to Vercel
- [ ] Frontend `CORS_ORIGIN` environment variable matches Vercel domain
- [ ] Frontend authentication flow tested end-to-end

### Monitoring and Logs

- [ ] Railway logging enabled and accessible
- [ ] Can view logs via CLI: `railway logs --follow`
- [ ] Understand log format and common messages
- [ ] Know how to filter logs for errors

### Security Verification

- [ ] All environment variables use strong random values
- [ ] No secrets committed to repository
- [ ] GitHub Actions has proper secret configuration
- [ ] Railway project has appropriate access controls
- [ ] Database backups configured (if using managed PostgreSQL)

### Documentation

- [ ] DEPLOYMENT.md reviewed and current
- [ ] RAILWAY_DEPLOYMENT_VERIFICATION.md bookmarked
- [ ] Troubleshooting guide reviewed
- [ ] Team members have access to documentation

## Troubleshooting Scenarios

If any check fails, mark the corresponding row and take corrective action:

| Issue | Checked | Status | Notes |
|-------|---------|--------|-------|
| Health check fails | [ ] | _____ | ___________________________________ |
| Auth register fails | [ ] | _____ | ___________________________________ |
| Auth login fails | [ ] | _____ | ___________________________________ |
| Protected routes blocked | [ ] | _____ | ___________________________________ |
| CORS errors | [ ] | _____ | ___________________________________ |
| Database connection fails | [ ] | _____ | ___________________________________ |
| Migrations not applied | [ ] | _____ | ___________________________________ |
| Slow response times | [ ] | _____ | ___________________________________ |
| Memory/CPU issues | [ ] | _____ | ___________________________________ |
| Service keeps crashing | [ ] | _____ | ___________________________________ |

## Sign-Off

Once all checks are complete and passing:

- [ ] All checklist items verified and passing
- [ ] No outstanding issues or failures
- [ ] Ready for production use
- [ ] Deployment Date: `_______________________`
- [ ] Verified By: `_______________________`
- [ ] Notes: `_________________________________`

---

## Quick Reference Commands

```bash
# Login and link
railway login
railway link

# Check status
railway status
railway logs --tail 50

# Set variables
railway variables set KEY "value"
railway variables list
railway variables get KEY

# View domains
railway domains list

# Redeploy
railway up --detach

# Rollback
railway rollback

# View deployments
railway deployments

# Manual commands
railway run pnpm run migrate:prod
railway run pnpm run prisma -- migrate status

# Real-time logs
railway logs --follow

# Filter logs
railway logs | grep "error"
railway logs | grep "migration"
```

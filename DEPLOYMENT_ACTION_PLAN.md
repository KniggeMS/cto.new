# InFocus Deployment Action Plan

**Generated:** November 29, 2024  
**Based on:** PR #59 Repository Health Report  
**Overall Health Score:** 8.5/10 ⭐

---

## Executive Summary

### 🎯 Deployment Readiness Status

| Platform | Status | Readiness | Action Required |
|----------|--------|-----------|-----------------|
| **Railway (Backend API)** | ✅ PRODUCTION READY | 100% | Deploy & Verify |
| **Vercel (Frontend Web)** | ⚠️ CONFIGURATION NEEDED | 40% | Setup Required |

### 📊 Key Findings from PR #59

- ✅ **Main Branch:** Stable with all lint/typecheck errors resolved
- ✅ **CI/CD Pipeline:** Complete and production-ready
- ✅ **Code Quality:** Excellent (10/10 score)
- ✅ **Documentation:** Comprehensive and complete
- ⚠️ **Branch Cleanup:** 38 unmerged branches need attention
- ⚠️ **GitHub Secrets:** Verification needed for deployment tokens

---

## Priority Matrix

### 🔴 CRITICAL BLOCKERS (Must Fix Before Deployment)

1. **Configure Vercel for Web App**
   - Missing `vercel.json` configuration
   - No Vercel project setup
   - Environment variables not configured

2. **Verify GitHub Secrets**
   - Confirm `RAILWAY_TOKEN` is valid
   - Verify test secrets (JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, TMDB_API_KEY)

### 🟡 HIGH PRIORITY (Should Fix Before Deployment)

3. **Security Audit**
   - Run `pnpm audit` and address vulnerabilities
   - Update dependencies if needed

4. **Branch Cleanup**
   - Review and archive 38 stale branches
   - Document active feature branches

### 🟢 NICE-TO-HAVE (Can Deploy Without These)

5. **CI/CD Enhancements**
   - Add status badges to README
   - Enable branch protection rules
   - Set up deployment notifications

6. **Monitoring & Observability**
   - Add error tracking (Sentry)
   - Configure uptime monitoring
   - Set up log aggregation

---

## Railway Deployment Checklist & Procedure

### ✅ PRE-DEPLOYMENT VERIFICATION

#### Environment Setup
- [ ] Railway account created and project initialized
- [ ] PostgreSQL plugin added to Railway project
- [ ] Database connection string available
- [ ] Railway CLI installed locally (`npm install -g @railway/cli`)

#### Required Environment Variables (Railway Dashboard → Variables)
```env
DATABASE_URL=<railway-postgresql-connection-string>
JWT_ACCESS_SECRET=<generate-new-64-char-hex>
JWT_REFRESH_SECRET=<generate-new-64-char-hex>
NODE_ENV=production
PORT=3000
TMDB_API_KEY=<themoviedb.org-api-key>
CORS_ORIGIN=<frontend-domain-url>
LOG_LEVEL=info
```

#### GitHub Secrets (Settings → Secrets → Actions)
- [ ] `RAILWAY_TOKEN` - Valid Railway API token
- [ ] `JWT_ACCESS_SECRET` - For CI/CD tests
- [ ] `JWT_REFRESH_SECRET` - For CI/CD tests
- [ ] `TMDB_API_KEY` - For CI/CD tests

### 🚀 DEPLOYMENT PROCEDURE

#### Option 1: Automatic Deployment (Recommended)
1. **Ensure main branch is ready**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Verify CI/CD pipeline passes**
   - Visit: https://github.com/KniggeMS/cto.new/actions
   - Confirm all jobs pass: lint, typecheck, test, build
   - Check for any failing runs

3. **Push to main branch**
   ```bash
   git push origin main
   ```
   - CI/CD will automatically deploy to Railway

#### Option 2: Manual Deployment
1. **Login to Railway**
   ```bash
   railway login
   railway link
   ```

2. **Deploy manually**
   ```bash
   railway up --service infocus-api --detach
   ```

3. **Monitor deployment**
   ```bash
   railway logs --follow
   railway status
   ```

### ✅ POST-DEPLOYMENT VERIFICATION

#### Health Checks
```bash
# Basic health endpoint
curl https://<your-railway-domain>.railway.app/health

# Expected response: {"status": "ok", "timestamp": "..."}
```

#### API Endpoints Verification
```bash
# Test authentication endpoints
curl -X POST https://<your-railway-domain>.railway.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Test media endpoints
curl https://<your-railway-domain>.railway.app/media/search?query=avengers
```

#### Database Verification
- [ ] Migrations applied successfully (check Railway logs)
- [ ] Seed data populated (if using seed script)
- [ ] Database accessible from application

#### CORS Configuration
- [ ] Frontend can successfully call API endpoints
- [ ] CORS headers properly configured
- [ ] No browser console errors

---

## Vercel Deployment Checklist & Procedure

### ⚠️ CONFIGURATION SETUP REQUIRED

#### Step 1: Create Vercel Configuration
Create `apps/web/vercel.json`:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd ../.. && pnpm install && cd apps/web && pnpm build",
  "installCommand": "echo 'Skipping install, using buildCommand'",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://<your-railway-domain>.railway.app/api/$1"
    }
  ]
}
```

#### Step 2: Vercel Project Setup
1. **Connect Repository**
   - Visit https://vercel.com/new
   - Connect GitHub repository: `KniggeMS/cto.new`
   - Set Root Directory: `apps/web`
   - Framework: Next.js (auto-detected)

2. **Configure Build Settings**
   - Build Command: `cd ../.. && pnpm install && pnpm build`
   - Output Directory: `.next`
   - Install Command: Leave blank (handled in build command)

3. **Environment Variables (Vercel Dashboard → Settings → Environment Variables)**
   ```env
   NEXT_PUBLIC_API_URL=https://<your-railway-domain>.railway.app
   NEXT_PUBLIC_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
   NODE_ENV=production
   ```

### 🚀 DEPLOYMENT PROCEDURE

#### Initial Deployment
1. **Trigger First Deployment**
   - Push changes to main branch (includes vercel.json)
   - Or trigger manual deployment from Vercel dashboard

2. **Monitor Build Process**
   - Check Vercel build logs
   - Verify all dependencies install correctly
   - Confirm build completes successfully

#### Subsequent Deployments
- **Automatic:** Deploy on push to main branch
- **Manual:** "Redeploy" button in Vercel dashboard

### ✅ POST-DEPLOYMENT VERIFICATION

#### Basic Functionality
```bash
# Check homepage loads
curl https://<your-vercel-domain>.vercel.app

# Check API connectivity
curl https://<your-vercel-domain>.vercel.app/api/health
```

#### Browser Testing
- [ ] Homepage loads without errors
- [ ] Login/Registration forms work
- [ ] Search functionality connects to API
- [ ] Watchlist features functional
- [ ] Responsive design works on mobile

#### API Integration
- [ ] All API calls from frontend succeed
- [ ] Authentication flow works end-to-end
- [ ] CORS issues resolved
- [ ] Error handling displays properly

---

## Rollback Procedures

### Railway Rollback
```bash
# Option 1: Use Railway CLI
railway rollback

# Option 2: Redeploy previous commit
git checkout <previous-commit-hash>
git push origin main --force

# Option 3: Railway dashboard rollback
# Visit Railway project → Deployments → Select previous deployment → Redeploy
```

### Vercel Rollback
```bash
# Option 1: Vercel CLI
vercel rollback

# Option 2: Vercel dashboard
# Visit Vercel project → Deployments → Find previous successful deployment → Promote to Production
```

### Emergency Rollback
1. **Identify last known good commit**
   ```bash
   git log --oneline -10
   ```

2. **Rollback both platforms**
   ```bash
   git checkout <last-good-commit>
   git push origin main --force
   ```

3. **Verify both services are working**
   - Railway API health check
   - Vercel frontend functionality

---

## Verification Commands & Scripts

### Railway Verification Script
```bash
#!/bin/bash
# verify-railway-deployment.sh

RAILWAY_DOMAIN="your-domain.railway.app"

echo "🔍 Verifying Railway deployment..."

# Health check
echo "1. Health endpoint..."
curl -f https://$RAILWAY_DOMAIN/health || exit 1

# API endpoints
echo "2. API endpoints..."
curl -f https://$RAILWAY_DOMAIN/api/media/search?query=test || exit 1

# Database connectivity
echo "3. Database connectivity..."
curl -f https://$RAILWAY_DOMAIN/api/users || exit 1

echo "✅ Railway deployment verified!"
```

### Vercel Verification Script
```bash
#!/bin/bash
# verify-vercel-deployment.sh

VERCEL_DOMAIN="your-domain.vercel.app"

echo "🔍 Verifying Vercel deployment..."

# Homepage
echo "1. Homepage..."
curl -f https://$VERCEL_DOMAIN || exit 1

# API connectivity
echo "2. API connectivity..."
curl -f https://$VERCEL_DOMAIN/api/health || exit 1

echo "✅ Vercel deployment verified!"
```

### End-to-End Verification
```bash
#!/bin/bash
# verify-full-deployment.sh

echo "🚀 Full deployment verification..."

# Test 1: Backend health
echo "1. Testing Railway backend..."
curl -f https://api.yourdomain.com/health || exit 1

# Test 2: Frontend loads
echo "2. Testing Vercel frontend..."
curl -f https://app.yourdomain.com || exit 1

# Test 3: API integration
echo "3. Testing API integration..."
curl -f "https://app.yourdomain.com/api/media/search?query=test" || exit 1

echo "✅ Full deployment verified successfully!"
```

---

## Timeline & Next Steps

### 📅 IMMEDIATE ACTIONS (Today)
- [ ] **Configure Vercel** (2 hours)
  - Create vercel.json
  - Set up Vercel project
  - Configure environment variables
- [ ] **Verify GitHub Secrets** (30 minutes)
  - Check RAILWAY_TOKEN validity
  - Verify test secrets
- [ ] **Deploy to Railway** (30 minutes)
  - Trigger deployment
  - Run verification scripts

### 📅 THIS WEEK
- [ ] **Security Audit** (1 hour)
  - Run `pnpm audit`
  - Address critical vulnerabilities
- [ ] **Branch Cleanup** (2 hours)
  - Review 38 stale branches
  - Archive/delete obsolete branches
- [ ] **End-to-End Testing** (2 hours)
  - Full integration testing
  - User acceptance testing

### 📅 NEXT WEEK
- [ ] **Monitoring Setup** (4 hours)
  - Configure error tracking
  - Set up uptime monitoring
  - Add deployment notifications
- [ ] **Documentation Updates** (2 hours)
  - Add CI/CD status badges
  - Update README with deployment URLs
  - Create troubleshooting guide

---

## Success Criteria

### ✅ Deployment Success Defined As

1. **Railway (Backend)**
   - Health endpoint returns 200 OK
   - All API endpoints functional
   - Database migrations applied
   - CORS configured correctly

2. **Vercel (Frontend)**
   - Homepage loads without errors
   - All pages accessible
   - API integration working
   - Mobile responsive design functional

3. **Integration**
   - Complete user authentication flow
   - Search functionality working
   - Watchlist features operational
   - No console errors in browser

4. **Performance**
   - Page load times < 3 seconds
   - API response times < 1 second
   - No 500 errors in production

---

## Contact & Support

### 🆘 Emergency Contacts
- **DevOps Lead:** [Contact Information]
- **Backend Lead:** [Contact Information]
- **Frontend Lead:** [Contact Information]

### 📚 Documentation References
- `DEPLOYMENT.md` - Comprehensive deployment guide
- `RAILWAY_DEPLOYMENT_VERIFICATION.md` - Detailed Railway verification
- `QUICKSTART_DEPLOYMENT.md` - Quick reference guide
- `INFRASTRUCTURE.md` - Infrastructure documentation

### 🔧 Useful Commands
```bash
# Railway commands
railway status
railway logs --follow
railway up --service infocus-api

# Vercel commands
vercel ls
vercel logs
vercel --prod

# Local testing
docker-compose up --build
pnpm run test
pnpm run audit
```

---

**Status:** ✅ READY FOR EXECUTION  
**Next Review:** December 6, 2024  
**Document Version:** 1.0
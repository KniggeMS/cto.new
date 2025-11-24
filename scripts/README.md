# Deployment Scripts

This directory contains utility scripts for deploying and verifying InFocus deployments.

## verify-railway-deployment.sh

Comprehensive smoke testing script for Railway deployments.

### Usage

```bash
./scripts/verify-railway-deployment.sh <railway-domain> [access-token]
```

### Examples

#### Test with registration (creates test user):
```bash
./scripts/verify-railway-deployment.sh infocus-api-abc123.railway.app
```

#### Test with existing access token:
```bash
./scripts/verify-railway-deployment.sh infocus-api-abc123.railway.app "eyJhbGc..."
```

### What It Tests

1. **Health Check** - Verifies `/health` endpoint responds
2. **User Registration** - Creates test user and obtains access token
3. **Protected Routes** - Tests that authenticated endpoints require valid token
4. **Watchlist CRUD** - Tests Create, Read, Update, Delete operations
5. **CORS Configuration** - Verifies CORS headers are properly configured

### Output

The script provides colored output indicating:
- ✓ (green) - Test passed
- ✗ (red) - Test failed
- ⊘ (yellow) - Test skipped
- → (blue) - Test in progress

### Example Output

```
===============================================
Railway Deployment Verification
Domain: infocus-api-abc123.railway.app
===============================================

→ Testing: Health check
✓ Health check passed
  Response: {"status":"ok","timestamp":"2024-01-15T10:30:45.123Z"}

→ Testing: User registration
✓ User registration passed
  Token: eyJhbGciOiJIUzI1NiIs...

...

===============================================
Test Summary
===============================================
Passed: 10
Failed: 0
✓ All tests passed!
```

### Getting Your Railway Domain

```bash
# List available domains
railway domains list

# Or check Railway dashboard:
# 1. Go to railway.app
# 2. Select your project
# 3. Find the public domain URL
```

### Getting an Access Token

If you already have a test user:

```bash
# Login to get access token
curl -X POST https://your-railway-domain/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }' | jq -r '.accessToken'
```

Or let the script create one during registration testing.

### Prerequisites

- `curl` - For HTTP requests
- `jq` - For JSON parsing
- Railway domain is publicly accessible

### Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed

### Troubleshooting

**Script fails to connect:**
- Verify Railway domain is correct: `railway domains list`
- Ensure service is running: `railway status`
- Check deployment status: `railway logs --tail 20`

**Authentication tests fail:**
- Verify JWT secrets are set: `railway variables get JWT_ACCESS_SECRET`
- Check database connectivity: `railway run pnpm run prisma -- db push`
- Review logs: `railway logs | grep -i "error\|auth"`

**CORS tests skip:**
- CORS may be configured differently
- Check CORS_ORIGIN variable: `railway variables get CORS_ORIGIN`
- Ensure frontend domain is listed in CORS_ORIGIN

## Adding New Scripts

When adding deployment scripts:

1. Add to `scripts/` directory
2. Make executable: `chmod +x scripts/your-script.sh`
3. Add documentation here with usage examples
4. Reference in main deployment documentation
5. Ensure script uses proper error handling and colored output
6. Include comments for complex logic

## References

- [Railway Deployment Verification Guide](../RAILWAY_DEPLOYMENT_VERIFICATION.md)
- [Railway Setup Checklist](../RAILWAY_SETUP_CHECKLIST.md)
- [Deployment Guide](../DEPLOYMENT.md)

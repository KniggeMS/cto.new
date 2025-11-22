# Vercel Deployment Guide

This guide describes how to deploy the InFocus web application to Vercel after the backend API is live.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Variables](#environment-variables)
4. [Vercel Project Setup](#vercel-project-setup)
5. [Git Integration](#git-integration)
6. [Build Configuration](#build-configuration)
7. [Preview vs Production Environments](#preview-vs-production-environments)
8. [CORS Configuration](#cors-configuration)
9. [Post-Deployment Validation](#post-deployment-validation)
10. [Troubleshooting](#troubleshooting)

## Overview

The InFocus web application is a Next.js 13+ app designed for seamless deployment to Vercel. The deployment process includes:

- **Automatic builds** from Git repository
- **Preview deployments** for every pull request
- **Environment-specific configuration** for development/staging/production
- **Optimized builds** with Vercel's Edge Network
- **Zero-config deployment** with sensible defaults

## Prerequisites

### Before You Begin

1. **Backend API Deployed**: Ensure the InFocus API is deployed and accessible
2. **Vercel Account**: Create a free account at [vercel.com](https://vercel.com)
3. **GitHub Repository**: The web app code must be in a GitHub repository
4. **API URL**: Have the production API URL ready (e.g., `https://api.infocus.app`)

### Required Information

- **Production API URL**: The deployed backend API URL
- **Vercel Team** (optional): If using a Vercel team account
- **Custom Domain** (optional): If using a custom domain

## Environment Variables

### Required Variables

Configure these environment variables in your Vercel project:

```env
# Production API URL (without /api prefix)
NEXT_PUBLIC_API_URL=https://your-api-domain.com

# Optional: Custom API URL for preview deployments
NEXT_PUBLIC_API_URL_PREVIEW=https://your-staging-api.com
```

### Setting Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the variables for the appropriate environments:

#### For Production
- **Environment**: Production
- **Key**: `NEXT_PUBLIC_API_URL`
- **Value**: `https://your-production-api.com`
- **Type**: Plain

#### For Preview (Optional)
- **Environment**: Preview, Development
- **Key**: `NEXT_PUBLIC_API_URL_PREVIEW`
- **Value**: `https://your-staging-api.com`
- **Type**: Plain

### Environment-Specific Values

Vercel allows different values for different environments:

- **Production**: Live production environment
- **Preview**: Deployments from pull requests
- **Development**: Local development (if using `vc dev`)

## Vercel Project Setup

### Option 1: Import from GitHub (Recommended)

1. **Log in to Vercel**
   ```bash
   npx vercel login
   ```

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import the GitHub repository
   - Set **Root Directory** to `apps/web`
   - Vercel will automatically detect Next.js

3. **Configure Project Settings**
   ```
   Project Name: infocus-web
   Framework Preset: Next.js
   Root Directory: apps/web
   Build Command: npm run build (auto-detected)
   Output Directory: .next (auto-detected)
   Install Command: npm install (auto-detected)
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be available at `https://infocus-web.vercel.app`

### Option 2: CLI Deployment

1. **Navigate to Web App Directory**
   ```bash
   cd apps/web
   ```

2. **Link and Deploy**
   ```bash
   # Link to existing project or create new
   npx vercel link
   
   # Deploy
   npx vercel --prod
   ```

### Project Configuration

Vercel automatically creates a `vercel.json` configuration file if needed. For most Next.js apps, no additional configuration is required.

## Git Integration

### Automatic Deployments

Once connected to GitHub, Vercel will:

1. **Preview Deployments**: Create a deployment for every pull request
2. **Production Deployments**: Deploy when pushing to the main branch
3. **Branch Previews**: Deploy other branches with unique URLs

### Branch Protection

Configure branch protection in GitHub to ensure:

- Pull requests are required for main branch changes
- CI/CD checks pass before merging
- Deployments are successful before allowing merges

### Deployment Hooks

Vercel provides webhooks for:

- **Deployment Started**: When build begins
- **Deployment Ready**: When deployment is live
- **Deployment Error**: When build fails

Configure these in GitHub repository settings for notifications.

## Build Configuration

### Next.js Configuration

The app uses `next.config.js` with optimized settings:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimizations for Vercel
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Image optimization
  images: {
    domains: ['image.tmdb.org'],
  },
};

module.exports = nextConfig;
```

### Build Optimizations

Vercel automatically applies:

- **Edge Network**: Global CDN distribution
- **ISR (Incremental Static Regeneration)**: For static pages
- **Image Optimization**: Automatic image resizing and optimization
- **Function Caching**: Cached serverless functions

### Build Performance

Typical build times:

- **First Build**: 2-3 minutes
- **Incremental Builds**: 30-60 seconds
- **Cold Start**: < 1 second for serverless functions

## Preview vs Production Environments

### Environment Strategy

Use different API URLs for different environments:

```env
# Production (live site)
NEXT_PUBLIC_API_URL=https://api.infocus.app

# Preview (pull requests)
NEXT_PUBLIC_API_URL=https://staging-api.infocus.app

# Development (local)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Preview Deployment Benefits

- **Testing**: Test changes against production-like environment
- **Collaboration**: Share preview URLs with team members
- **Validation**: Verify changes before merging to main
- **Isolation**: Each PR gets its own isolated environment

### Environment Detection in Code

The app can detect the environment:

```typescript
const getApiUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }
  
  // For preview deployments, use preview API if available
  if (process.env.VERCEL_ENV === 'preview' && process.env.NEXT_PUBLIC_API_URL_PREVIEW) {
    return process.env.NEXT_PUBLIC_API_URL_PREVIEW;
  }
  
  return process.env.NEXT_PUBLIC_API_URL;
};
```

## CORS Configuration

### Backend CORS Setup

Ensure your backend API allows requests from your Vercel domain:

```env
# In your API environment variables
CORS_ORIGIN=https://your-domain.vercel.app,https://your-custom-domain.com
```

### Multiple Origins

For multiple environments:

```
CORS_ORIGIN=https://infocus-web.vercel.app,https://staging-infocus.vercel.app,https://www.infocus.app
```

### Local Development

For local development, include localhost:

```
CORS_ORIGIN=http://localhost:3000,https://infocus-web.vercel.app
```

### Testing CORS

Test CORS configuration:

```bash
# Test from browser console
fetch('https://your-api.com/health')
  .then(r => r.json())
  .then(console.log);

# Test with curl
curl -H "Origin: https://your-domain.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://your-api.com/health
```

## Post-Deployment Validation

### Smoke Tests

After deployment, perform these validation steps:

#### 1. Basic Functionality

```bash
# Test homepage loads
curl https://your-domain.vercel.app

# Check response headers
curl -I https://your-domain.vercel.app
```

#### 2. Authentication Flow

1. **Navigate to Login**: Visit `/login`
2. **Attempt Login**: Use valid credentials
3. **Verify Redirect**: Should redirect to `/watchlist`
4. **Check Token Storage**: Verify tokens in localStorage
5. **Test Protected Route**: Access `/settings` while authenticated

#### 3. API Integration

```javascript
// Test API connectivity from browser console
fetch('/api/health')  // Should be proxied to backend
  .then(r => r.json())
  .then(console.log);
```

#### 4. Protected Routes

Test these routes while authenticated:

- `/watchlist` - Should load user's watchlist
- `/search` - Should search functionality
- `/family` - Should load family groups
- `/settings` - Should load user settings

#### 5. Data Fetching

Verify data fetching works:

```javascript
// Test watchlist data
fetch('/watchlist', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
})
.then(r => r.json())
.then(console.log);
```

### Automated Validation

Create a simple test script:

```javascript
// test-deployment.js
const tests = [
  () => fetch('/').then(r => r.ok ? '✓ Homepage loads' : '✗ Homepage failed'),
  () => fetch('/login').then(r => r.ok ? '✓ Login page loads' : '✗ Login page failed'),
  () => fetch('/api/health').then(r => r.ok ? '✓ API health check' : '✗ API health failed'),
];

Promise.all(tests.map(test => test().catch(e => `✗ Error: ${e.message}`)))
  .then(results => console.log(results.join('\n')));
```

### Performance Validation

Check performance metrics:

1. **Lighthouse Score**: Run Lighthouse audit in Chrome DevTools
2. **Core Web Vitals**: Check LCP, FID, CLS metrics
3. **Bundle Size**: Verify bundle size is reasonable (< 1MB gzipped)
4. **Load Time**: First contentful paint should be < 2 seconds

## Troubleshooting

### Common Issues

#### CORS Errors

**Symptoms**: Browser console shows CORS errors

**Solutions**:
1. Verify `CORS_ORIGIN` includes your Vercel domain
2. Check for typos in domain names
3. Ensure API is deployed and accessible
4. Test with curl to verify CORS headers

```bash
# Check CORS headers
curl -H "Origin: https://your-domain.vercel.app" \
     -I https://your-api.com/health
```

#### API Connection Issues

**Symptoms**: 404/500 errors when calling API

**Solutions**:
1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Check API is deployed and running
3. Test API directly: `curl https://your-api.com/health`
4. Check Vercel function logs

#### Build Failures

**Symptoms**: Deployment fails during build

**Solutions**:
1. Check build logs in Vercel dashboard
2. Verify `package.json` scripts are correct
3. Ensure all dependencies are installed
4. Check TypeScript compilation errors

#### Environment Variable Issues

**Symptoms**: App loads but API calls fail

**Solutions**:
1. Verify environment variables are set for correct environment
2. Check variable names (NEXT_PUBLIC_ prefix is required)
3. Ensure values don't have extra spaces or quotes
4. Redeploy after changing environment variables

#### Authentication Issues

**Symptoms**: Login fails or tokens don't work

**Solutions**:
1. Verify API URL is correct and accessible
2. Check backend JWT secrets match frontend expectations
3. Test authentication flow with API directly
4. Check browser console for error messages

### Debugging Tools

#### Vercel Logs

Access logs in Vercel dashboard:

1. Go to project → **Functions** tab
2. Filter by function or time range
3. Check real-time logs during testing

#### Browser DevTools

Use browser developer tools:

1. **Network Tab**: Check API requests and responses
2. **Console Tab**: Look for JavaScript errors
3. **Application Tab**: Verify localStorage tokens
4. **Elements Tab**: Check DOM structure

#### Environment Debugging

Print environment for debugging:

```javascript
// Add temporarily for debugging
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL_URL: process.env.VERCEL_URL,
});
```

### Getting Help

1. **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
2. **Next.js Deployment**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
3. **Vercel Support**: Support available in Vercel dashboard
4. **Community Forums**: GitHub Discussions, Stack Overflow

### Performance Optimization

If performance is poor:

1. **Enable ISR**: Use `revalidate` in `getStaticProps`
2. **Optimize Images**: Use Next.js Image component
3. **Bundle Analysis**: Use `@next/bundle-analyzer`
4. **Edge Functions**: Consider Edge Runtime for some functions
5. **Caching**: Implement proper caching strategies

## Next Steps

1. **Deploy**: Follow the setup steps to deploy to Vercel
2. **Configure**: Set up environment variables and CORS
3. **Test**: Run the validation checklist
4. **Monitor**: Set up error tracking and monitoring
5. **Optimize**: Analyze performance and optimize as needed

## Related Documentation

- [Backend Deployment Guide](../../DEPLOYMENT.md)
- [API Documentation](../api/docs/)
- [Web App README](README.md)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
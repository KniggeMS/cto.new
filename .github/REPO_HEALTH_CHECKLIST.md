# Repository Health Check Checklist

Use this checklist for regular repository health reviews (recommended: weekly).

## 📋 Weekly Health Check

### Git Repository Status
- [ ] Main branch is clean and up to date
- [ ] No uncommitted changes in working directory
- [ ] Latest commit is recent (within last week)
- [ ] All branches synced with remote

### Open PRs
- [ ] Review all open pull requests
- [ ] Check for PRs requiring review
- [ ] Identify any blocked or stale PRs
- [ ] Ensure no merge conflicts exist
- [ ] Verify CI/CD checks passing on all PRs

### Branch Management
- [ ] Review remote branches (>7 days old)
- [ ] Identify merged branches to delete
- [ ] Archive stale feature branches
- [ ] Document active feature branches
- [ ] Verify branch naming conventions followed

### CI/CD Pipeline
- [ ] Check GitHub Actions workflow status
- [ ] Review recent workflow runs (last 7 days)
- [ ] Identify and fix any failed runs
- [ ] Verify all jobs completing successfully
- [ ] Check deployment job execution (main branch)

### Code Quality
- [ ] Run lint: `pnpm run lint`
- [ ] Run typecheck: `pnpm run typecheck`
- [ ] Run tests: `pnpm run test`
- [ ] Review test coverage reports
- [ ] Check for TypeScript or ESLint errors

### Security
- [ ] Run security audit: `pnpm audit`
- [ ] Review dependency vulnerabilities
- [ ] Update critical security patches
- [ ] Check for outdated dependencies
- [ ] Verify secrets are not committed

### Deployment Status
- [ ] Verify Railway deployment health
- [ ] Check Railway logs for errors
- [ ] Test health endpoint: `/health`
- [ ] Verify Vercel deployment (web app)
- [ ] Test frontend application
- [ ] Verify CORS configuration

### Documentation
- [ ] Review and update README if needed
- [ ] Update deployment documentation
- [ ] Document new features or changes
- [ ] Update API documentation
- [ ] Check for broken links in docs

---

## 🔍 Monthly Deep Dive

### Repository Metrics
- [ ] Count total branches (should be <20)
- [ ] Review commit frequency and patterns
- [ ] Check contributor activity
- [ ] Analyze code churn and complexity

### Dependency Management
- [ ] Review all package.json files
- [ ] Update non-breaking dependencies
- [ ] Plan major version upgrades
- [ ] Check for deprecated packages
- [ ] Review pnpm audit report thoroughly

### Infrastructure
- [ ] Review Railway configuration and usage
- [ ] Check Vercel project settings
- [ ] Verify environment variables are current
- [ ] Review database migrations
- [ ] Check log aggregation and monitoring

### Security Deep Dive
- [ ] Review GitHub security alerts
- [ ] Check Dependabot PRs
- [ ] Verify branch protection rules
- [ ] Review access controls and permissions
- [ ] Test authentication and authorization flows

### Performance
- [ ] Review API response times
- [ ] Check database query performance
- [ ] Analyze bundle sizes (web app)
- [ ] Review CI/CD pipeline execution times
- [ ] Optimize Docker image sizes

### Documentation Audit
- [ ] Verify all documentation is current
- [ ] Check for outdated screenshots
- [ ] Update version numbers
- [ ] Review and update architecture diagrams
- [ ] Ensure runbooks are accurate

---

## 🚨 Emergency Health Check

Use this when issues are suspected or after major changes:

### Immediate Checks
- [ ] Verify main branch builds successfully
- [ ] Check production deployments are live
- [ ] Test critical API endpoints
- [ ] Verify database connectivity
- [ ] Check error monitoring dashboards

### Rollback Readiness
- [ ] Identify last known good commit
- [ ] Verify rollback procedures documented
- [ ] Test rollback in staging (if available)
- [ ] Notify team of rollback if needed

### Incident Response
- [ ] Document the issue in GitHub Issues
- [ ] Create hotfix branch if needed
- [ ] Fast-track PR review and merge
- [ ] Deploy hotfix to production
- [ ] Verify fix resolves issue
- [ ] Post-mortem documentation

---

## 📊 Health Metrics to Track

### Git Metrics
- Number of open PRs
- Average PR merge time
- Number of remote branches
- Commit frequency per week
- Number of stale branches

### CI/CD Metrics
- Workflow success rate (%)
- Average build time
- Test pass rate (%)
- Deployment frequency
- Failed deployment rate

### Code Quality Metrics
- TypeScript errors: 0
- ESLint warnings: <10
- Test coverage: >80%
- Security vulnerabilities: 0 critical
- Outdated dependencies: <5

### Deployment Metrics
- API uptime (%)
- API response time (p95)
- Error rate (%)
- Deployment success rate
- Rollback frequency

---

## 🎯 Success Criteria

Repository is considered "healthy" when:

- ✅ Main branch is clean and building
- ✅ All CI/CD checks passing
- ✅ Zero critical security vulnerabilities
- ✅ <10 open PRs (all with recent activity)
- ✅ <20 total remote branches
- ✅ Production deployments are stable
- ✅ Test coverage >80%
- ✅ Documentation is up to date
- ✅ No stale branches (>14 days)
- ✅ All GitHub Actions workflows passing

---

## 📝 Useful Commands

### Git Commands
```bash
# View branch status
git branch -a
git for-each-ref --sort=-committerdate refs/remotes/origin --format='%(refname:short) - %(committerdate:relative)'

# Check for merged branches
git branch -r --merged origin/main

# Delete remote branch
git push origin --delete <branch-name>

# View recent commits
git log --oneline --decorate -20
```

### pnpm Commands
```bash
# Security audit
pnpm audit
pnpm audit --fix

# Update dependencies
pnpm update
pnpm outdated

# Clean install
pnpm install --frozen-lockfile

# Run quality checks
pnpm run lint
pnpm run typecheck
pnpm run test
```

### Railway Commands
```bash
# Check deployment status
railway status
railway logs --follow
railway logs --tail 100

# Deploy manually
railway up --service infocus-api --detach

# Check variables
railway variables list
```

### GitHub CLI Commands
```bash
# List open PRs
gh pr list
gh pr status

# View workflow runs
gh run list --workflow="CI/CD Pipeline"
gh run view <run-id>

# View security alerts
gh api /repos/:owner/:repo/security-advisories
```

---

## 📅 Schedule

### Daily (If Active Development)
- Check open PRs
- Review CI/CD status
- Monitor production logs

### Weekly
- Full health check (use checklist above)
- Branch cleanup
- Security audit
- Update REPO_HEALTH_SUMMARY.md

### Monthly
- Deep dive health check
- Dependency updates
- Documentation audit
- Infrastructure review
- Generate full health report

### Quarterly
- Architecture review
- Performance optimization
- Security audit by external tools
- Team process retrospective

---

**Last Updated:** November 29, 2024  
**Next Review:** December 6, 2024

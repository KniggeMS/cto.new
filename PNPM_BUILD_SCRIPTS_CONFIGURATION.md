# pnpm Build Script Approval Configuration

## Overview

This document explains the pnpm build script approval configuration for the InFocus monorepo.

## Problem

Vercel deployments were failing due to pnpm's security feature that requires explicit approval for packages that execute install/postinstall scripts. The following packages were being ignored:

- `@prisma/client`
- `@prisma/engines`
- `prisma`
- `detox`
- `dtrace-provider`

## Solution

We've configured pnpm to approve build scripts for these specific packages using the `onlyBuiltDependencies` configuration in `pnpm-workspace.yaml`.

## Files Modified

### 1. `pnpm-workspace.yaml`

Added the `onlyBuiltDependencies` section to explicitly allow build scripts:

```yaml
packages:
  - apps/*
  - packages/*

# Allow install/build scripts only for the dependencies that require them.
# This keeps pnpm's security feature intact while ensuring Prisma and Detox work.
onlyBuiltDependencies:
  - '@prisma/client'
  - '@prisma/engines'
  - detox
  - dtrace-provider
  - prisma
```

### 2. `.pnpmrc` (New File)

Created a pnpm configuration file with documentation and workspace settings:

```ini
# pnpm configuration for InFocus monorepo

# Build Script Approval Configuration
# -------------------------------------
# pnpm requires explicit approval for packages that run install/postinstall scripts
# for security reasons. The approved packages are configured in pnpm-workspace.yaml
# under the 'onlyBuiltDependencies' field.
#
# Approved packages:
# - @prisma/client: Generates Prisma client code for database access
# - @prisma/engines: Downloads native database engine binaries
# - prisma: CLI tool that generates schema and migrations
# - detox: E2E testing framework for React Native (mobile app)
# - dtrace-provider: Optional native tracing module (safe to fail)
#
# To approve additional packages, run: pnpm approve-builds

# Workspace Configuration
# ------------------------
# Link workspace packages for monorepo development
link-workspace-packages=true

# Hoist patterns for shared dependencies
# Uncomment if needed for better hoisting control
# public-hoist-pattern[]=*eslint*
# public-hoist-pattern[]=*prettier*
# public-hoist-pattern[]=*typescript*

# Strict peer dependencies to avoid version conflicts
auto-install-peers=true
```

### 3. `README.md`

Added documentation about pnpm build script approvals in the "Getting Started" section.

## Why Each Package Needs Build Scripts

### Prisma Packages

- **@prisma/client**: Generates TypeScript types and the Prisma client based on your schema
- **@prisma/engines**: Downloads platform-specific database engine binaries
- **prisma**: CLI tool that orchestrates schema generation and migrations

These are essential for the API app (`apps/api`) to access the PostgreSQL database.

### Detox

- **detox**: E2E testing framework for React Native that requires native setup

Used by the mobile app (`apps/mobile`) for end-to-end testing on iOS/Android simulators.

### dtrace-provider

- **dtrace-provider**: Optional native tracing module (may fail safely if platform doesn't support DTrace)

Transitive dependency that's safe to allow; gracefully handles platforms without DTrace support.

## How to Approve Additional Packages

If you add a new dependency that requires build scripts, you'll see a warning like:

```
╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: <package-name>.                                    │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed    │
│   to run scripts.                                                           │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
```

To fix this:

1. Run `pnpm approve-builds` in the repository root
2. Select the packages you want to approve (use space to select, Enter to confirm)
3. Confirm the approval when prompted
4. Commit the updated `pnpm-workspace.yaml` file

Example:

```bash
cd /home/engine/project
pnpm approve-builds
# Select packages with spacebar, press Enter
# Confirm with 'y'
git add pnpm-workspace.yaml
git commit -m "chore: approve build scripts for <package-name>"
```

## Testing

To verify the configuration works correctly:

```bash
# Clean install
rm -rf node_modules
pnpm install

# Should complete without warnings about ignored build scripts

# Test building specific workspaces
pnpm --filter @infocus/web run build
pnpm --filter @infocus/api run build
pnpm --filter @infocus/mobile run build

# Test building all workspaces
pnpm build
```

> Note: The API workspace currently has TypeScript issues that are unrelated to
> the pnpm build script approvals. Running `pnpm --filter @infocus/api run
> build` (or `pnpm build`) may fail until those errors are addressed.

## Vercel Deployment

This configuration will be automatically used by Vercel when deploying the web app. The `pnpm-workspace.yaml` file is committed to the repository, so Vercel will respect the approved build scripts during deployment.

## Security Considerations

The `onlyBuiltDependencies` configuration maintains pnpm's security posture by:

1. **Explicit allowlist**: Only specified packages can run scripts
2. **Version control**: Changes to the allowlist are tracked in git
3. **Code review**: Any new approvals are visible in pull requests
4. **Minimal permissions**: Only packages that genuinely need scripts are approved

All approved packages are from trusted sources:
- Prisma packages are from Prisma Labs (database ORM)
- Detox is from Wix (testing framework)
- dtrace-provider is optional and fails gracefully

## References

- [pnpm Scripts Documentation](https://pnpm.io/cli/install#--ignore-scripts)
- [pnpm Workspace Configuration](https://pnpm.io/pnpm-workspace_yaml)
- [pnpm approve-builds Command](https://pnpm.io/cli/approve-builds)

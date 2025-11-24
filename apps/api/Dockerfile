# Multi-stage build for InFocus API
# Build from project root: docker build -t infocus-api -f apps/api/Dockerfile .

# Stage 1: Install dependencies
FROM node:18-alpine AS installer

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.22.0

# Copy workspace configuration and package files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY apps/api/ ./apps/api/
COPY packages/ ./packages/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @infocus/api

# Stage 2: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.22.0

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY turbo.json ./

# Copy app files
COPY apps/api ./apps/api
COPY packages ./packages

# Install all dependencies (needed for building)
RUN pnpm install --frozen-lockfile --filter @infocus/api

# Generate Prisma client
RUN cd apps/api && pnpm run prisma:generate

# Build the application using the build-focused tsconfig
RUN pnpm run build --filter @infocus/api

# Stage 3: Production prune
FROM node:18-alpine AS pruner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.22.0

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copy built app
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules

# Prune dependencies for production
RUN pnpm prune --prod --filter @infocus/api

# Stage 4: Runtime
FROM node:18-alpine

WORKDIR /app

# Install pnpm for runtime migrations
RUN npm install -g pnpm@10.22.0

# Copy pruned dependencies and built code
COPY --from=pruner /app/node_modules ./node_modules
COPY --from=pruner /app/apps/api ./apps/api
COPY --from=pruner /app/packages ./packages
COPY --from=pruner /app/pnpm-lock.yaml ./
COPY --from=pruner /app/pnpm-workspace.yaml ./
COPY --from=pruner /app/package.json ./

WORKDIR /app/apps/api

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "dist/index.js"]

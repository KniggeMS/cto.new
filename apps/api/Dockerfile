# Multi-stage build for InFocus API
# Build from project root: docker build -t infocus-api -f apps/api/Dockerfile .

# Stage 1: Install dependencies
FROM node:18-alpine AS installer

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

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
RUN npm install -g pnpm@9

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY turbo.json ./

# Copy app files
COPY apps/api ./apps/api
COPY packages ./packages

# Install all dependencies (needed for building)
RUN pnpm install --frozen-lockfile --filter @infocus/api --filter @infocus/shared

# Build shared package
RUN pnpm run build --filter @infocus/shared

# Generate Prisma client
RUN cd apps/api && pnpm run prisma:generate

# Build the application using the build-focused tsconfig
RUN pnpm run build --filter @infocus/api

# Stage 3: Deployer
FROM node:18-alpine AS deployer

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy workspace files from builder
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Deploy the app to a specific directory
# We use --prod to only install production dependencies
RUN pnpm deploy --filter @infocus/api --prod /app/deployed

# Install prisma globally to generate client (pinned version)
# Add libc6-compat for Alpine compatibility
RUN npm install -g prisma@5.21.1 && \
  apk add --no-cache openssl libc6-compat

# Generate Prisma client in the deployed app
RUN cd /app/deployed && prisma generate

# Manually copy the built dist folder
COPY --from=builder /app/apps/api/dist /app/deployed/dist

# Stage 4: Runtime
FROM node:18-alpine

WORKDIR /app

# Install pnpm and openssl/libc6-compat (needed for Prisma)
RUN npm install -g pnpm@9 && \
  apk add --no-cache openssl libc6-compat

# Copy the deployed app
COPY --from=deployer /app/deployed .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application with debug listing
CMD ["sh", "-c", "ls -R /app && node dist/index.js"]

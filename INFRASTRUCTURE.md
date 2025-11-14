# Infrastructure Setup Reference

This document provides reference information for setting up and managing InFocus infrastructure components.

## Table of Contents

1. [Docker Setup](#docker-setup)
2. [Kubernetes Configuration](#kubernetes-configuration)
3. [PostgreSQL Setup](#postgresql-setup)
4. [Monitoring & Logging](#monitoring--logging)
5. [Security Configuration](#security-configuration)
6. [Scaling Considerations](#scaling-considerations)

## Docker Setup

### Development Environment

Use docker-compose for local development:

```yaml
# docker-compose.yml (example)
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: infocus
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build: ./apps/api
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/infocus
      NODE_ENV: development
      JWT_ACCESS_SECRET: dev-secret
      JWT_REFRESH_SECRET: dev-secret
      TMDB_API_KEY: ${TMDB_API_KEY}
    ports:
      - "3000:3000"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

### Production Dockerfile

The Dockerfile uses a multi-stage build:

1. **Installer**: Installs dependencies
2. **Builder**: Builds TypeScript and generates Prisma client
3. **Pruner**: Removes development dependencies
4. **Runtime**: Final minimal image

Key features:
- Alpine Linux base (small image size)
- Multi-stage optimization
- Health checks configured
- Graceful shutdown handling

### Image Optimization

```bash
# Build for production
docker build -t infocus-api:prod apps/api

# Check image size
docker images infocus-api:prod

# Expected: ~150-200MB
```

## Kubernetes Configuration

### Deployment Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: infocus-api
  labels:
    app: infocus
spec:
  replicas: 3
  selector:
    matchLabels:
      app: infocus
  template:
    metadata:
      labels:
        app: infocus
    spec:
      containers:
      - name: api
        image: infocus-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: infocus-secrets
              key: database-url
        - name: NODE_ENV
          value: production
        - name: JWT_ACCESS_SECRET
          valueFrom:
            secretKeyRef:
              name: infocus-secrets
              key: jwt-access-secret
        - name: JWT_REFRESH_SECRET
          valueFrom:
            secretKeyRef:
              name: infocus-secrets
              key: jwt-refresh-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: infocus-api
spec:
  type: LoadBalancer
  selector:
    app: infocus
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
```

## PostgreSQL Setup

### Development Database

```bash
# Using Docker
docker run -d \
  --name infocus-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=infocus_dev \
  -p 5432:5432 \
  postgres:15-alpine

# Create migration directory if not exists
mkdir -p apps/api/prisma/migrations
```

### Production Database

For production, use managed services:

- **Railway PostgreSQL**: Built-in PostgreSQL plugin
- **Render PostgreSQL**: Managed database service
- **AWS RDS**: Managed relational database
- **Azure Database**: Managed PostgreSQL

### Connection String Format

```
postgresql://[user[:password]@][netloc][:port][/dbname][?param1=value1&...]
```

Example:
```
postgresql://postgres:password@localhost:5432/infocus?schema=public
```

### Backup Strategy

For Render or Railway:

```bash
# Backup from production database
pg_dump -U username -h host infocus > backup.sql

# Restore to another database
psql -U username -h host infocus < backup.sql
```

### Connection Pooling

For high-traffic applications, use PgBouncer:

```
# pgbouncer.ini
[databases]
infocus = host=hostname port=5432 dbname=infocus

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

## Monitoring & Logging

### Application Monitoring

#### Health Checks

All deployments should monitor the health endpoint:

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Metrics to Track

1. **Response Time**: API latency percentiles (p50, p95, p99)
2. **Error Rate**: Failed requests percentage
3. **Throughput**: Requests per second
4. **Database**: Connection pool usage, query times
5. **Memory**: Heap usage, GC frequency
6. **CPU**: CPU usage percentage

### Logging

#### Log Levels

- `ERROR` - Critical errors requiring immediate attention
- `WARN` - Warnings about potential issues
- `INFO` - General informational messages
- `DEBUG` - Detailed debugging information

#### Log Aggregation

Use external logging services:

1. **CloudWatch** (AWS)
   ```javascript
   // Send logs to CloudWatch
   import winston from 'winston';
   ```

2. **Datadog**
   ```bash
   npm install --save dd-trace
   ```

3. **ELK Stack** (Elasticsearch, Logstash, Kibana)
4. **Grafana Loki**

#### Sample Log Query

```bash
# View recent logs
railway logs -n 100

# Filter errors
railway logs | grep ERROR
```

### Error Tracking

Integrate error tracking service:

```javascript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

## Security Configuration

### Environment Variables

Never commit secrets. Use environment variable management:

**Railway:**
- Set via dashboard or CLI
- Automatically encrypted

**Render:**
- Set via dashboard
- Shown only once on creation

**GitHub Actions:**
- Set in repository secrets
- Injected as environment variables

### SSL/TLS

Both Railway and Render provide automatic SSL/TLS certificates.

For self-hosted:
```bash
# Using Let's Encrypt with certbot
certbot certonly --standalone -d yourdomain.com
```

### Secret Rotation

Rotate secrets periodically:

```bash
# Generate new JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update in deployment platform
railway variables set JWT_ACCESS_SECRET "new-secret"
```

### API Authentication

Endpoints require valid JWT tokens:

```bash
# Include Authorization header
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/profile
```

### CORS Configuration

For production, restrict CORS:

```typescript
// In server.ts
cors({
  origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],
  credentials: true,
})
```

### Database Security

- Use strong passwords
- Enable encryption at rest
- Enable backup encryption
- Use connection strings over direct passwords
- Enable audit logging (if available)

## Scaling Considerations

### Horizontal Scaling

The API is stateless and designed for horizontal scaling:

```yaml
# Kubernetes - scale to 5 replicas
kubectl scale deployment infocus-api --replicas=5
```

### Database Optimization

1. **Index Strategy**
   - Index frequently queried columns
   - Monitor slow queries
   - Analyze execution plans

2. **Connection Pooling**
   - Use PgBouncer for connection pooling
   - Set appropriate pool sizes
   - Monitor connection count

3. **Query Optimization**
   - Use Prisma select() for specific fields
   - Implement pagination for large datasets
   - Cache frequently accessed data

### Caching

Consider adding Redis for:

```typescript
// Cache layer example
import redis from 'redis';

const client = redis.createClient({
  host: process.env.REDIS_URL,
});

// Cache user profile
const cacheKey = `user:${userId}`;
const cached = await client.get(cacheKey);
if (cached) return JSON.parse(cached);
```

### Load Balancing

Both Railway and Render handle load balancing automatically.

For self-hosted, use nginx:

```nginx
upstream infocus_backend {
  server api1.example.com:3000;
  server api2.example.com:3000;
  server api3.example.com:3000;
}

server {
  listen 80;
  server_name api.yourdomain.com;

  location / {
    proxy_pass http://infocus_backend;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

### Performance Tuning

1. **Node.js Flags**
   ```bash
   node --max-old-space-size=2048 dist/index.js
   ```

2. **Database Tuning**
   - Increase shared_buffers
   - Adjust work_mem
   - Monitor and vacuum tables

3. **Response Compression**
   ```typescript
   import compression from 'compression';
   app.use(compression());
   ```

## Emergency Procedures

### Database Recovery

If database becomes corrupted:

```bash
# 1. Check backups
railway database backups

# 2. Restore from backup
railway database restore backup-id

# 3. Verify data integrity
pnpm run prisma -- db push
```

### Rollback Deployment

```bash
# Railway
railway rollback

# Render
# Use deployment history in dashboard
```

### Clear Cache

If using Redis:

```bash
redis-cli FLUSHALL
```

### Emergency Hotfix

For critical bugs:

```bash
# 1. Create fix branch
git checkout -b hotfix/critical-issue

# 2. Apply fix and push
git push origin hotfix/critical-issue

# 3. Create pull request
# 4. After merge, automatic deployment

# 5. If needed, manual deploy
railway deploy
```

## Monitoring Dashboards

### Key Metrics Dashboard

Display:
- Request rate (req/sec)
- Error rate (%)
- Response time (ms)
- Database connections
- Memory usage
- CPU usage

### Alerting Rules

1. **Error Rate > 1%** - Page on-call
2. **Response Time > 1000ms** - Alert team
3. **Database Connections > 80%** - Scale database
4. **Memory Usage > 80%** - Scale container
5. **Disk Usage > 80%** - Review logs/backups

## Additional Resources

- [Railway Documentation](https://railway.app/docs)
- [Render Documentation](https://render.com/docs)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance.html)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

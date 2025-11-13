# InFocus API

Backend API server for the InFocus media tracking platform, built with Node.js, TypeScript, and Prisma ORM.

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm

### Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Configure database connection**:
Create `.env` file (or update from `.env.example`):
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/infocus_dev"
```

3. **Create PostgreSQL database** (if using Docker):
```bash
docker run --name postgres-infocus \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:15
```

Then create the database:
```bash
docker exec postgres-infocus createdb infocus_dev -U postgres
```

4. **Run migrations**:
```bash
npm run migrate
```

5. **Seed demo data**:
```bash
npm run seed
```

6. **Start development server**:
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run migrate` - Create or update database migrations
- `npm run migrate:prod` - Deploy migrations to production database
- `npm run seed` - Populate database with demo data
- `npm run prisma:generate` - Generate Prisma client types
- `npm run prisma:studio` - Open Prisma Studio (visual DB editor)

## Project Structure

```
apps/api/
├── src/
│   └── index.ts                 # Application entry point
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── seed.ts                  # Seeding script
│   └── migrations/              # Migration history (auto-generated)
├── .env                         # Local environment config (git-ignored)
├── .env.example                 # Environment template
├── package.json
├── tsconfig.json
├── SCHEMA.md                    # Database schema documentation
└── README.md                    # This file
```

## Database Schema

The application models the following core entities:

- **User** - User accounts with authentication
- **Profile** - User profiles with preferences
- **MediaItem** - Movies and TV shows (TMDB integrated)
- **WatchlistEntry** - User's watched/watching/completed items
- **Family** - Groups for collaborative features
- **FamilyMembership** - User membership in families
- **FamilyInvitation** - Invitation tracking
- **Recommendation** - User-to-user media recommendations
- **Session** - Active login sessions
- **RefreshToken** - Token rotation for security
- **StreamingProvider** - Media availability tracking

See [SCHEMA.md](SCHEMA.md) for complete documentation including entity relationships, constraints, and design decisions.

## Development Workflow

### Creating New Migrations

After modifying `prisma/schema.prisma`:

```bash
npm run migrate
```

This will:
1. Display a diff of schema changes
2. Create a new migration file
3. Apply it to the local database

### Exploring Data

Open Prisma Studio to visually browse and edit data:

```bash
npm run prisma:studio
```

This opens http://localhost:5555 with an interactive database explorer.

### Adding Demo Data

To modify demo data, edit `prisma/seed.ts` and re-run:

```bash
npm run seed
```

## Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string

**Optional:**
- `NODE_ENV` - Environment mode (development|production)

See `.env.example` for template.

## Troubleshooting

### Migration Issues

If migrations fail to apply:

```bash
# Reset local database (DELETES ALL DATA)
npx prisma migrate reset

# Verify schema syntax
npx prisma validate
```

### Connection Issues

Verify PostgreSQL connection:
```bash
npm run prisma:studio
```

If it fails to connect, check:
- PostgreSQL is running
- DATABASE_URL is correct
- Database exists
- User has proper permissions

### Prisma Client Issues

Regenerate Prisma client:

```bash
npm run prisma:generate
```

## Database Backup & Recovery

Backup database:
```bash
docker exec postgres-infocus pg_dump -U postgres infocus_dev > backup.sql
```

Restore from backup:
```bash
docker exec -i postgres-infocus psql -U postgres infocus_dev < backup.sql
```

## Production Deployment

1. Set `DATABASE_URL` to production database
2. Run migrations:
```bash
npm run migrate:prod
```
3. Build application:
```bash
npm run build
```
4. Start server:
```bash
node dist/index.js
```

## Documentation

- [Database Schema Documentation](SCHEMA.md) - Complete entity descriptions and relationships
- [Prisma Documentation](https://www.prisma.io/docs/) - Official ORM docs
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) - Database reference

## Notes

- Passwords are stored plainly in demo seed - use bcrypt in production
- Session/RefreshToken tokens are random strings - use proper JWT in production
- TMDB IDs enable easy API synchronization for media metadata
- Family/User relationships support multi-user collaborative features

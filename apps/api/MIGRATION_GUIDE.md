# Database Migration Guide

This guide explains how to work with Prisma migrations for the InFocus API.

## What are Migrations?

Migrations are version-controlled SQL files that track your database schema changes over time. They enable:

- Tracking schema evolution
- Reproducing schema across environments (local, staging, production)
- Rolling back to previous states if needed
- Collaborating safely on schema changes

## Initial Setup

### First Time Setup

```bash
cd apps/api

# 1. Ensure PostgreSQL is running
# Example with Docker:
docker run --name postgres-infocus \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:15

# 2. Create the database
docker exec postgres-infocus createdb infocus_dev -U postgres

# 3. Configure database connection in .env
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/infocus_dev"

# 4. Generate initial migration and apply it
npm run migrate

# 5. Seed demo data
npm run seed
```

### What Happens During `npm run migrate`

The command:

1. Compares your `prisma/schema.prisma` with the current database
2. Shows you the diff of changes
3. Asks for a migration name
4. Creates a new migration file in `prisma/migrations/[timestamp]_[name]/migration.sql`
5. Applies the migration to your database

## Working with Migrations

### Creating a Migration

After modifying `prisma/schema.prisma`:

```bash
npm run migrate
```

You'll be prompted:

```
✔ Name of migration … add_user_preferences
```

The migration will be created as: `prisma/migrations/20240101000000_add_user_preferences/`

### Viewing Migration Status

```bash
npx prisma migrate status
```

Shows:

- Applied migrations
- Pending migrations (if any)
- Migration history

### Applying Migrations

Migrate your current database to the latest schema:

```bash
npm run migrate          # Interactive (development)
npm run migrate:prod     # Non-interactive (production)
```

### Rolling Back Migrations

To revert to a previous migration state:

```bash
# Reset local database to initial state (DELETES ALL DATA)
npx prisma migrate reset

# Then optionally seed data
npm run seed
```

### Resolving Migration Conflicts

If migrations conflict when pulling from git:

1. **Understand the conflict**: Read the migration files
2. **Manually resolve**: Edit conflicting migrations
3. **Reset and reapply** (for development):
   ```bash
   npx prisma migrate reset
   ```

## Migration Best Practices

### Do's ✓

- Migrate frequently (small, focused changes)
- Write descriptive migration names
- Test migrations locally before deploying
- Keep migrations in version control
- Run seeds after reset migrations

### Don'ts ✗

- Don't edit generated migration files manually
- Don't skip migrations in sequence
- Don't deploy without testing
- Don't commit `.env` to git (only `.env.example`)
- Don't remove old migrations from history

## Typical Development Workflow

```bash
# 1. Create new feature, update schema.prisma
vim prisma/schema.prisma

# 2. Create and apply migration
npm run migrate
# → Name your migration: "add_feature_xyz"

# 3. Verify schema
npx prisma validate

# 4. Test with Prisma Studio
npm run prisma:studio

# 5. Run seeds if needed
npm run seed

# 6. Commit changes
git add prisma/migrations/
git add prisma/schema.prisma
git commit -m "Add feature xyz schema"
```

## Production Deployment

### Safe Production Migration

```bash
# 1. On production environment
cd apps/api

# 2. Verify current state
npx prisma migrate status

# 3. Apply pending migrations
npm run migrate:prod

# 4. No prompts - runs all pending migrations automatically
```

### Zero-Downtime Migrations

For large tables or complex changes:

1. Create migration in development
2. Test thoroughly
3. Plan maintenance window if needed
4. Deploy with `npm run migrate:prod`

Prisma handles most cases automatically. For major changes:

- Create new column alongside old
- Migrate data gradually
- Drop old column in separate migration

## Common Scenarios

### Adding a New Column

```prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  name  String?
+ phone String? // New field
  createdAt DateTime @default(now())
}
```

```bash
npm run migrate
# → Name: "add_phone_to_user"
```

### Removing a Column

```prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  name  String?
  // phone field removed
  createdAt DateTime @default(now())
}
```

```bash
npm run migrate
# → Name: "remove_phone_from_user"
```

### Changing a Field Type

```prisma
// Before
rating Int?

// After
rating Float?
```

```bash
npm run migrate
# Prisma handles data type conversion
# → Name: "change_rating_to_float"
```

### Adding a Unique Constraint

```prisma
model User {
  id    String @id @default(cuid())
  email String @unique // New unique constraint
  name  String?
}
```

```bash
npm run migrate
# → Name: "add_unique_email_constraint"
```

### Creating an Index

```prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  name  String?

  @@index([name])  // New index
}
```

```bash
npm run migrate
# → Name: "add_index_on_name"
```

## Troubleshooting

### Migration Fails to Apply

**Error**: `Error: Migration X failed to apply`

**Solutions**:

1. Check database connection: `npm run prisma:studio`
2. View migration SQL: `cat prisma/migrations/[name]/migration.sql`
3. Check for syntax errors in schema
4. Reset and retry: `npx prisma migrate reset`

### Prisma Client Out of Sync

**Error**: `Generated Prisma Client is out of sync`

**Solution**:

```bash
npm run prisma:generate
```

### Database Already Modified

**Error**: `Detected changes that were not executed as migrations`

**Solutions**:

1. Inspect changes: `npx prisma db push` (shows diff)
2. Create migration from current state: `npm run migrate`
3. Or reset local database: `npx prisma migrate reset`

### Connection String Issues

**Error**: `Can't reach database server`

**Solutions**:

- Verify PostgreSQL is running
- Check DATABASE_URL in `.env`
- Test connection: `npm run prisma:studio`
- Check firewall/network settings

## File Locations

- **Schema**: `prisma/schema.prisma`
- **Migrations**: `prisma/migrations/`
- **Migration Details**: `prisma/migrations/[name]/migration.sql`
- **Configuration**: `package.json` scripts

## Resources

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Schema Reference](SCHEMA.md)
- [Development Guide](README.md)

## Migration History Format

Each migration folder contains:

- `migration.sql` - The actual SQL changes
- `migration_lock.toml` - Lock file preventing concurrent migrations

Example:

```
prisma/migrations/
├── migration_lock.toml
└── 20240101000000_initial_schema/
    └── migration.sql
```

## Summary

| Command                     | Purpose                                    |
| --------------------------- | ------------------------------------------ |
| `npm run migrate`           | Create and apply interactive migration     |
| `npm run migrate:prod`      | Apply all pending migrations automatically |
| `npx prisma migrate status` | View migration history and status          |
| `npx prisma migrate reset`  | Reset database to initial state            |
| `npx prisma validate`       | Validate schema syntax                     |
| `npm run prisma:generate`   | Generate Prisma client                     |
| `npm run prisma:studio`     | Open visual database explorer              |

Remember: Migrations are your database's version control. Keep them safe and committed!

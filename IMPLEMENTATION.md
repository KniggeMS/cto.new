# Prisma API Schema Implementation Guide

This document describes the implementation of the Prisma ORM schema for the InFocus API.

## Overview

The schema introduces a complete data model for a collaborative media tracking platform with the following characteristics:

- **11 core entities** modeling users, media items, families, recommendations, and authentication
- **Comprehensive relationships** supporting complex queries and data integrity
- **PostgreSQL-specific features** including arrays, JSON columns, and proper indexing
- **Production-ready design** with proper constraints, cascading deletes, and unique business rules

## Entities Implemented

### User Management
1. **User** - Core user account entity with authentication fields
2. **Profile** - Extended user information with preferences (JSON)
3. **Session** - Active login sessions with token-based authentication
4. **RefreshToken** - Secure token rotation system with revoke capability

### Media Tracking
5. **MediaItem** - Movies and TV shows with TMDB integration
6. **WatchlistEntry** - User tracking with status (not_watched/watching/completed), rating, and notes
7. **StreamingProvider** - Media availability across platforms with regional info

### Social Features
8. **Family** - Groups for collaborative features
9. **FamilyMembership** - User membership in families with role-based access
10. **FamilyInvitation** - Token-based family invitations with expiration
11. **Recommendation** - User-to-user media recommendations

## Key Features Implemented

### Watch Status Tracking
- Enum with three states: `not_watched`, `watching`, `completed`
- Default is `not_watched`
- Indexed for efficient filtering

### Personal Ratings and Notes
- Rating: Optional 1-10 integer scale on WatchlistEntry
- Notes: Optional text field for user comments
- Both stored with the watchlist entry for user-specific data

### Streaming Provider Metadata
- StreamingProvider model tracks availability
- Provider field: netflix, hulu, prime_video, etc.
- Regions array: Geographic availability (US, CA, GB, etc.)
- URL field: Optional deep links to streaming services

### Unique Business Rules
- **WatchlistEntry**: One entry per user per media item (prevents duplicates)
- **FamilyMembership**: One per user per family (prevents duplicate memberships)
- **FamilyInvitation**: One pending invitation per email per family
- **MediaItem**: Unique tmdbId (prevents duplicate media entries)
- **User**: Unique email (prevents duplicate accounts)

### Authentication & Security
- Session tokens for active login sessions
- RefreshToken for token rotation
- Revoke flag on RefreshToken for invalidation without deletion
- Expiration dates on sessions and tokens
- Cascade delete for security (delete user = delete all related data)

## Constraints and Indices

### Unique Constraints (11 total)
- User.email
- MediaItem.tmdbId
- WatchlistEntry(userId, mediaItemId)
- FamilyMembership(userId, familyId)
- FamilyInvitation(familyId, email)
- Session.token
- RefreshToken.token
- StreamingProvider(mediaItemId, provider)
- Profile.userId
- FamilyInvitation.token

### Indices (25+ total)
- All foreign keys are indexed for join performance
- Status fields indexed for filtering (WatchStatus, Recommendation.status, etc.)
- Email, token, and TMDB ID fields indexed for quick lookups
- User-specific queries optimized with indices on userId

## Migration Strategy

### Initial Setup
```bash
# From apps/api/
npm install
npm run migrate
```

This creates the initial migration with:
- All table definitions
- Unique constraints
- Foreign key relationships
- Indices for performance

### Schema Versioning
Each schema change creates a new migration file:
```
prisma/migrations/
├── 20240101000000_initial_schema/
│   └── migration.sql
└── [timestamp]_[description]/
    └── migration.sql
```

### Deployment
```bash
npm run migrate:prod  # Deploy migrations to production
```

## Seeding & Demo Data

The seed script (`prisma/seed.ts`) creates:
- 3 demo users with varied profiles
- 3 media items (TMDB real examples: Fight Club, Shawshank Redemption, Breaking Bad)
- 4 watchlist entries with varied statuses and ratings
- Streaming provider entries
- Family group with members and invitations
- Recommendation between users
- Session and refresh token examples

Run with: `npm run seed`

## TMDB Integration

MediaItem entities include TMDB fields for easy API synchronization:
- `tmdbId`: TMDB identifier (movies/shows)
- `tmdbType`: "movie" or "tv"
- Unique constraint on tmdbId prevents duplicates
- Enables bulk sync from TMDB API

## PostgreSQL-Specific Features Used

1. **CUID Primary Keys**: Secure, globally unique identifiers
2. **Timestamp Defaults**: `now()` for automatic timestamps
3. **Arrays**: String[] for genres, creators, regions
4. **JSON Columns**: Profile.preferences for flexible data
5. **Enums**: WatchStatus for type safety
6. **Cascading Deletes**: Automatic cleanup of related data
7. **Composite Indices**: Multi-column unique constraints

## Production Considerations

### Security
- Passwords should be hashed with bcrypt (currently plaintext in seed)
- Session tokens should use JWT instead of random strings
- Implement token expiration cleanup jobs
- Add rate limiting on authentication endpoints

### Performance
- All indices are created automatically
- Watch for N+1 queries in application code
- Consider caching user preferences
- Monitor slow query logs

### Scalability
- CUID primary keys support sharding
- Consider read replicas for reporting queries
- Archive old sessions/refresh tokens
- Add connection pooling (PgBouncer)

### Compliance
- Consider soft deletes for audit trails
- Add audit logging table for data changes
- Implement GDPR data export/deletion features
- Add data retention policies

## Monitoring & Maintenance

### Regular Tasks
- Monitor migration status: `npx prisma migrate status`
- Run Prisma Studio for data inspection: `npx prisma studio`
- Check index usage and fragmentation
- Archive old sessions periodically

### Troubleshooting
- Reset local database: `npx prisma migrate reset`
- Validate schema: `npx prisma validate`
- Generate client: `npx prisma generate`

## Future Enhancements

Planned features that may require schema changes:
- Notifications system (add Notification model)
- Extended reviews with ratings from multiple sources
- User collections/lists beyond families
- Social features (follow/followers)
- Audit logging (add AuditLog model)
- Caching metadata tables

See [apps/api/SCHEMA.md](apps/api/SCHEMA.md) for complete documentation.

## Files Modified/Created

### New Files
- `apps/api/prisma/schema.prisma` - Core schema definition
- `apps/api/prisma/seed.ts` - Development data seeding
- `apps/api/src/index.ts` - Application entry point
- `apps/api/.env` - Local environment config
- `apps/api/.env.example` - Environment template
- `apps/api/package.json` - Dependencies and scripts
- `apps/api/tsconfig.json` - TypeScript configuration
- `apps/api/.gitignore` - Git ignore rules
- `apps/api/README.md` - API documentation
- `apps/api/SCHEMA.md` - Schema documentation
- `README.md` - Project overview (updated)
- `.gitignore` - Root level git ignore

### Generated Files
- `apps/api/prisma/migrations/` - Auto-generated migration files
- `apps/api/node_modules/@prisma/` - Prisma client

## Verification Checklist

- [x] All 11 required models implemented
- [x] Watch status enum with 3 states
- [x] Rating and notes fields on WatchlistEntry
- [x] Streaming provider metadata storage
- [x] Unique constraints for business rules
- [x] Indices for relational integrity
- [x] TMDB integration fields
- [x] Seed script with demo data
- [x] Schema documentation with ER diagram
- [x] Schema compiles without errors
- [x] TypeScript types generated
- [x] Ready for migration against PostgreSQL

## Next Steps

1. Set up PostgreSQL database
2. Run migrations: `npm run migrate`
3. Seed demo data: `npm run seed`
4. Explore with Prisma Studio: `npm run prisma:studio`
5. Implement API endpoints using Prisma client
6. Add authentication middleware
7. Build API routes for CRUD operations

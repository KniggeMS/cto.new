# InFocus Data Schema Documentation

## Overview

This document describes the data schema for the InFocus application, a collaborative media tracking and recommendation platform built with Prisma ORM and PostgreSQL.

## Architecture Decisions

### 1. Primary Key Strategy

- All tables use `CUID` (Collision-resistant IDs) as primary keys instead of auto-incrementing integers
- Benefits:
  - Globally unique across distributed systems
  - Secure (UUIDs expose database size information)
  - Database-agnostic

### 2. Timestamps

- All tables include `createdAt` (immutable) and `updatedAt` (auto-updated) fields
- Enables audit trails and sorting by recency

### 3. TMDB Integration

- `MediaItem` entities include `tmdbId` and `tmdbType` fields
- Enables easy synchronization with The Movie Database API
- Unique constraint on `tmdbId` prevents duplicates

### 4. Soft Delete Pattern

- Not used: Hard deletes with cascade on delete
- Allows simplified queries without special handling

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                       │
│ email (UNIQUE)                                                │
│ password                                                      │
│ name                                                          │
│ createdAt, updatedAt                                          │
└─────────────────────────────────────────────────────────────┘
         │
         ├─ 1:1 ─→ PROFILE
         ├─ 1:N ─→ WATCHLIST_ENTRY
         ├─ 1:N ─→ FAMILY_MEMBERSHIP
         ├─ 1:N ─→ RECOMMENDATION (as recommender)
         ├─ 1:N ─→ RECOMMENDATION (as recipient)
         ├─ 1:N ─→ SESSION
         ├─ 1:N ─→ REFRESH_TOKEN
         └─ 1:N ─→ FAMILY (as creator)

┌─────────────────────────────────────────────────────────────┐
│                       PROFILE                                │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                       │
│ userId (FK, UNIQUE)                                           │
│ bio                                                           │
│ avatar                                                        │
│ preferences (JSON)                                            │
│ createdAt, updatedAt                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      MEDIA_ITEM                              │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                       │
│ tmdbId (UNIQUE)                                               │
│ tmdbType (movie|tv)                                           │
│ title                                                         │
│ description                                                   │
│ posterPath                                                    │
│ backdropPath                                                  │
│ releaseDate                                                   │
│ rating                                                        │
│ genres (Array)                                                │
│ creators (Array)                                              │
│ createdAt, updatedAt                                          │
└─────────────────────────────────────────────────────────────┘
         │
         ├─ 1:N ─→ WATCHLIST_ENTRY
         ├─ 1:N ─→ RECOMMENDATION
         └─ 1:N ─→ STREAMING_PROVIDER

┌─────────────────────────────────────────────────────────────┐
│                  WATCHLIST_ENTRY                             │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                       │
│ userId (FK)                                                   │
│ mediaItemId (FK)                                              │
│ status (not_watched|watching|completed)                      │
│ rating (1-10)                                                 │
│ notes                                                         │
│ dateAdded, dateUpdated                                        │
│ UNIQUE(userId, mediaItemId)                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       FAMILY                                 │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                       │
│ name                                                          │
│ createdBy (FK)                                                │
│ createdAt, updatedAt                                          │
└─────────────────────────────────────────────────────────────┘
         │
         ├─ 1:N ─→ FAMILY_MEMBERSHIP
         └─ 1:N ─→ FAMILY_INVITATION

┌─────────────────────────────────────────────────────────────┐
│                FAMILY_MEMBERSHIP                             │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                       │
│ userId (FK)                                                   │
│ familyId (FK)                                                 │
│ role (admin|member)                                           │
│ joinedAt                                                      │
│ UNIQUE(userId, familyId)                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 FAMILY_INVITATION                            │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                       │
│ familyId (FK)                                                 │
│ email                                                         │
│ token (UNIQUE)                                                │
│ status (pending|accepted|declined)                            │
│ expiresAt                                                     │
│ acceptedAt                                                    │
│ createdAt                                                     │
│ UNIQUE(familyId, email)                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  RECOMMENDATION                              │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                       │
│ mediaItemId (FK)                                              │
│ recommendedBy (FK)                                            │
│ recommendedTo (FK)                                            │
│ message                                                       │
│ status (pending|accepted|rejected)                            │
│ createdAt, updatedAt                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      SESSION                                 │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                       │
│ userId (FK)                                                   │
│ token (UNIQUE)                                                │
│ expiresAt                                                     │
│ createdAt                                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   REFRESH_TOKEN                              │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                       │
│ userId (FK)                                                   │
│ token (UNIQUE)                                                │
│ expiresAt                                                     │
│ revoked                                                       │
│ createdAt                                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                STREAMING_PROVIDER                            │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                       │
│ mediaItemId (FK)                                              │
│ provider (netflix|hulu|prime|etc)                             │
│ url                                                           │
│ regions (Array)                                               │
│ addedAt                                                       │
│ UNIQUE(mediaItemId, provider)                                 │
└─────────────────────────────────────────────────────────────┘
```

## Entity Descriptions

### User

- Central entity representing an InFocus user account
- Unique email constraint ensures each user has a distinct email
- Password should be hashed with bcrypt in production

### Profile

- One-to-one relationship with User
- Contains user preferences and biographical information
- Preferences stored as JSON for flexibility

### MediaItem

- Represents a movie or TV show
- TMDB integration fields enable API synchronization
- Genres and creators stored as arrays for flexibility
- Unique on `tmdbId` to prevent duplicate entries

### WatchlistEntry

- Tracks user's interaction with media items
- Status can be: `not_watched`, `watching`, `completed`
- Rating is optional (1-10 scale)
- Unique constraint on (userId, mediaItemId) ensures one entry per user per media

### Family

- Represents a group of users who share watchlists
- CreatedBy links to the family's creator
- Enables collaborative features

### FamilyMembership

- Many-to-many relationship between User and Family
- Role attribute enables permission management (admin, member)
- Unique constraint prevents duplicate memberships

### FamilyInvitation

- Tracks pending family group invitations
- Token-based system for accepting invitations
- Expiration date prevents indefinite open invitations

### Recommendation

- Enables users to recommend media to each other
- Status tracks: pending, accepted, rejected
- Optional message for personal notes

### Session

- Tracks active user sessions
- Token-based authentication
- Expiration for security

### RefreshToken

- Enables token rotation for enhanced security
- Revoke flag allows invalidating tokens without deletion

### StreamingProvider

- Maps media availability across streaming platforms
- Stores region information (US, CA, GB, etc.)
- URL may contain deep links to streaming service

## Indices and Constraints

### Unique Constraints

- `User.email` - Ensures unique email addresses
- `MediaItem.tmdbId` - Prevents duplicate TMDB entries
- `WatchlistEntry(userId, mediaItemId)` - One entry per user per media
- `FamilyMembership(userId, familyId)` - One membership per user per family
- `FamilyInvitation(familyId, email)` - One invitation per email per family
- `RefreshToken.token` - Unique token per refresh session
- `Session.token` - Unique token per session
- `StreamingProvider(mediaItemId, provider)` - One provider entry per media

### Indices

- All foreign keys are indexed for join performance
- Status fields indexed for filtering queries
- Email fields indexed for quick user lookups
- Token fields indexed for fast session validation

## Migration Strategy

Migrations are tracked in `prisma/migrations/` directory. To create and apply migrations:

```bash
# Create a new migration
npm run migrate

# Apply migrations in production
npm run migrate:prod
```

## Seeding

Development seeding includes:

- 3 demo users with profiles
- 3 demo media items (Fight Club, The Shawshank Redemption, Breaking Bad)
- Sample watchlist entries with various statuses and ratings
- Streaming provider information
- Family group with members and invitations
- Recommendations between users
- Sessions and refresh tokens

To seed the database:

```bash
npm run seed
```

## Future Considerations

1. **Caching**: Consider adding Redis for session/refresh token management
2. **Notifications**: Add notification model for family activity and recommendations
3. **Reviews**: Extend rating system to include full user reviews
4. **Ratings**: Additional rating sources (IMDb, Rotten Tomatoes)
5. **Auditing**: Add audit log table for tracking data changes
6. **Soft Deletes**: Consider implementing soft delete pattern for compliance/recovery
7. **Media Collections**: Support user-created collections beyond families
8. **Social Features**: Follow/followers model for social discovery

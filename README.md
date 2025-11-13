# InFocus

InFocus is a collaborative media tracking and recommendation platform that helps families and groups stay synchronized on what they're watching, from movies to TV shows.

## Project Structure

```
.
├── apps/
│   └── api/                 # Backend API server with Prisma ORM
│       ├── prisma/
│       │   ├── schema.prisma        # Database schema definitions
│       │   ├── seed.ts              # Development data seeding script
│       │   └── migrations/          # Database migrations (auto-generated)
│       ├── src/
│       │   └── index.ts             # Application entry point
│       ├── .env.example             # Environment variables template
│       ├── .env                     # Local environment configuration
│       ├── package.json             # Dependencies and scripts
│       ├── tsconfig.json            # TypeScript configuration
│       └── SCHEMA.md                # Database schema documentation
└── README.md                        # This file
```

## Features

- **User Accounts**: Secure user authentication and profiles
- **Media Tracking**: Track movies and TV shows with statuses (not watched, watching, completed)
- **Personal Ratings**: Rate media items on a 1-10 scale and add personal notes
- **Watchlist Management**: Organize media with unique watchlist entries
- **Family Groups**: Create family groups and collaborate on shared watchlists
- **Family Invitations**: Token-based invitations for family members
- **Recommendations**: Share media recommendations with other users
- **Streaming Providers**: Track which streaming services offer each media item
- **Session Management**: Secure token-based authentication with refresh tokens

## Technology Stack

- **Backend**: Node.js + TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: Session/RefreshToken model

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Install dependencies**:
```bash
cd apps/api
npm install
```

2. **Configure environment**:
Copy `.env.example` to `.env` and update with your database credentials:
```bash
# apps/api/.env
DATABASE_URL="postgresql://user:password@localhost:5432/infocus_dev"
```

3. **Setup PostgreSQL**:
Ensure PostgreSQL is running locally:
```bash
# Example: Start PostgreSQL with Docker
docker run --name postgres-infocus -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
```

4. **Run Prisma migrations**:
```bash
cd apps/api
npm run migrate
```

5. **Seed development data**:
```bash
npm run seed
```

6. **Start the application**:
```bash
npm run dev
```

## Database Schema

The application uses a comprehensive Prisma schema with the following core entities:

- **User**: User accounts with email and authentication
- **Profile**: User profiles with bio, avatar, and preferences
- **MediaItem**: Movies and TV shows with TMDB identifiers
- **WatchlistEntry**: User tracking of media with status, rating, and notes
- **Family**: Family groups for collaborative features
- **FamilyMembership**: User membership in families with roles
- **FamilyInvitation**: Token-based invitations
- **Recommendation**: Media recommendations between users
- **Session**: Active user sessions
- **RefreshToken**: Token rotation for security
- **StreamingProvider**: Media availability across streaming platforms

See [apps/api/SCHEMA.md](apps/api/SCHEMA.md) for detailed schema documentation, including:
- Entity Relationship Diagram
- Field descriptions
- Unique constraints and indices
- Migration strategy
- Future considerations

## Available Scripts

From the `apps/api` directory:

- `npm run dev` - Start development server
- `npm run build` - Build TypeScript to JavaScript
- `npm run migrate` - Create and run database migrations
- `npm run migrate:prod` - Deploy migrations to production
- `npm run seed` - Populate database with demo data
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:studio` - Open Prisma Studio (visual database explorer)

## Development

### Creating Migrations

After modifying `prisma/schema.prisma`:

```bash
npm run migrate
```

This will:
1. Show a diff of changes
2. Create a new migration file
3. Apply the migration to your local database

### Seeding Data

```bash
npm run seed
```

The seed script creates:
- 3 demo users
- User profiles
- Sample media items from TMDB
- Watchlist entries with various statuses
- Family groups
- Recommendations

## Testing Your Setup

Once setup is complete, verify everything works:

```bash
# 1. Generate Prisma Client
npm run prisma:generate

# 2. Run migrations
npm run migrate

# 3. Seed data
npm run seed

# 4. Open Prisma Studio
npm run prisma:studio
```

Prisma Studio will open at http://localhost:5555 where you can:
- Browse all database tables
- View relationships
- Add/edit/delete records
- Test queries

## Documentation

- [Database Schema Documentation](apps/api/SCHEMA.md) - Comprehensive schema design decisions and entity relationships
- [Prisma Documentation](https://www.prisma.io/docs/) - Official Prisma ORM docs
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) - PostgreSQL reference

## Environment Variables

See `apps/api/.env.example` for all available environment variables.

**Required**:
- `DATABASE_URL` - PostgreSQL connection string

**Optional**:
- `NODE_ENV` - Environment mode (development/production)

## License

Proprietary - InFocus

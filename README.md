# InFocus

InFocus is a collaborative media tracking and recommendation platform that helps families and groups stay synchronized on what they're watching, from movies to TV shows.

## Monorepo Structure

This is a monorepo powered by [Turborepo](https://turbo.build/repo) and [pnpm workspaces](https://pnpm.io/workspaces).

```
.
├── apps/
│   ├── api/                      # Backend API server (Node.js + TypeScript + Prisma)
│   │   ├── prisma/               # Database schema, migrations, and seed scripts
│   │   ├── src/                  # Application source code
│   │   ├── .env.example          # Environment variables template
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── web/                      # Web application (React - to be implemented)
│   │   ├── src/
│   │   ├── .env.example
│   │   └── package.json
│   └── mobile/                   # Mobile application (React Native - to be implemented)
│       ├── src/
│       ├── .env.example
│       └── package.json
├── packages/
│   ├── shared/                   # Shared types, schemas, and utilities
│   │   ├── src/
│   │   │   ├── types/            # TypeScript type definitions
│   │   │   ├── schemas/          # Zod validation schemas
│   │   │   ├── utils/            # Utility functions
│   │   │   └── constants/        # Shared constants
│   │   └── package.json
│   ├── tsconfig/                 # Shared TypeScript configurations
│   │   ├── base.json
│   │   ├── node.json
│   │   ├── react.json
│   │   └── react-native.json
│   ├── eslint-config/            # Shared ESLint configurations
│   ├── prettier-config/          # Shared Prettier configuration
│   └── jest-config/              # Shared Jest configurations
├── .env.example                  # Root environment variables template
├── package.json                  # Root workspace configuration
├── pnpm-workspace.yaml           # pnpm workspace configuration
├── turbo.json                    # Turborepo pipeline configuration
└── README.md                     # This file
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

- **Monorepo**: Turborepo + pnpm workspaces
- **Backend**: Node.js + TypeScript + Prisma ORM
- **Database**: PostgreSQL
- **Web**: React (to be implemented)
- **Mobile**: React Native (to be implemented)
- **Validation**: Zod
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier

## Prerequisites

- **Node.js** 18+
- **pnpm** 8+ (install with `npm install -g pnpm`)
- **PostgreSQL** 14+

## Getting Started

### 1. Install Dependencies

From the repository root:

```bash
pnpm install
```

This will install dependencies for all workspaces.

### 2. Configure Environment Variables

Copy the root `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

You'll also want to configure environment-specific variables for each app:

```bash
# API
cp apps/api/.env.example apps/api/.env

# Web (when implemented)
cp apps/web/.env.example apps/web/.env

# Mobile (when implemented)
cp apps/mobile/.env.example apps/mobile/.env
```

**Key environment variables:**

- `DATABASE_URL`: PostgreSQL connection string
- `TMDB_API_KEY`: API key from [The Movie Database](https://www.themoviedb.org/settings/api)
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`: Secure random strings for JWT token signing

### 3. Setup PostgreSQL

Ensure PostgreSQL is running locally:

```bash
# Example: Start PostgreSQL with Docker
docker run --name postgres-infocus \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:15
```

### 4. Run Database Migrations

```bash
cd apps/api
pnpm run migrate
```

### 5. Seed Development Data (Optional)

```bash
cd apps/api
pnpm run seed
```

### 6. Start Development

From the repository root, run all development servers:

```bash
pnpm dev
```

Or run individual apps:

```bash
# API only
cd apps/api
pnpm dev

# Web only (when implemented)
cd apps/web
pnpm dev

# Mobile only (when implemented)
cd apps/mobile
pnpm dev
```

## Available Scripts

### Root-level Scripts

Run these from the repository root:

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all packages and apps
- `pnpm test` - Run tests across all packages
- `pnpm lint` - Lint all packages
- `pnpm typecheck` - Type-check all packages
- `pnpm format` - Format all code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm clean` - Clean all build artifacts

### API-specific Scripts

Run these from `apps/api`:

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build TypeScript to JavaScript
- `pnpm migrate` - Create and run database migrations
- `pnpm migrate:prod` - Deploy migrations to production
- `pnpm seed` - Populate database with demo data
- `pnpm prisma:generate` - Generate Prisma client
- `pnpm prisma:studio` - Open Prisma Studio (visual database explorer)

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

See [apps/api/SCHEMA.md](apps/api/SCHEMA.md) for detailed schema documentation.

## Shared Package

The `@infocus/shared` package contains:

- **Types**: TypeScript interfaces for domain models
- **Schemas**: Zod validation schemas for runtime type checking
- **Utils**: Utility functions (date formatting, email validation, etc.)
- **Constants**: Shared constants across all apps

Import from shared package:

```typescript
import { formatDate, isValidEmail, WatchStatus } from '@infocus/shared';
```

## Configuration Packages

### TypeScript (`@infocus/tsconfig`)

Shared TypeScript configurations:

- `@infocus/tsconfig/base` - Base configuration
- `@infocus/tsconfig/node` - Node.js apps
- `@infocus/tsconfig/react` - React web apps
- `@infocus/tsconfig/react-native` - React Native mobile apps

### ESLint (`@infocus/eslint-config`)

Shared ESLint configurations:

- `@infocus/eslint-config/base` - Base rules
- `@infocus/eslint-config/node` - Node.js apps
- `@infocus/eslint-config/react` - React web apps
- `@infocus/eslint-config/react-native` - React Native apps

### Jest (`@infocus/jest-config`)

Shared Jest configurations:

- `@infocus/jest-config/node` - Node.js testing
- `@infocus/jest-config/react` - React testing
- `@infocus/jest-config/react-native` - React Native testing

## Testing Your Setup

Once setup is complete, verify everything works:

```bash
# 1. Install all dependencies
pnpm install

# 2. Build all packages
pnpm build

# 3. Run linting
pnpm lint

# 4. Run tests
pnpm test

# 5. Type check
pnpm typecheck

# 6. Open Prisma Studio to inspect the database
cd apps/api
pnpm run prisma:studio
```

Prisma Studio will open at http://localhost:5555 where you can:

- Browse all database tables
- View relationships
- Add/edit/delete records
- Test queries

## Development Workflow

### Adding a New Package

```bash
cd packages
mkdir my-package
cd my-package
pnpm init
```

Make sure to:

- Set `"private": true` in package.json
- Use workspace protocol for internal dependencies: `"@infocus/shared": "workspace:*"`
- Extend shared configs (tsconfig, eslint, etc.)

### Adding Dependencies

```bash
# Add to root (affects all workspaces)
pnpm add -D <package> -w

# Add to specific workspace
pnpm add <package> --filter @infocus/api
pnpm add <package> --filter @infocus/web
pnpm add <package> --filter @infocus/shared
```

### Creating Migrations

After modifying `apps/api/prisma/schema.prisma`:

```bash
cd apps/api
pnpm run migrate
```

This will:

1. Show a diff of changes
2. Create a new migration file
3. Apply the migration to your local database

## Documentation

- [Database Schema Documentation](apps/api/SCHEMA.md) - Comprehensive schema design
- [API README](apps/api/README.md) - API-specific documentation
- [Turborepo Documentation](https://turbo.build/repo/docs) - Turborepo guide
- [pnpm Workspaces](https://pnpm.io/workspaces) - pnpm workspace documentation
- [Prisma Documentation](https://www.prisma.io/docs/) - Prisma ORM docs

## License

Proprietary - InFocus

# InFocus API

Backend API server for the InFocus media tracking platform, built with Node.js, TypeScript, and Prisma ORM.

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pnpm (Node.js package manager)

### Workspace Bootstrap

This project is part of a monorepo managed by pnpm. Before working on the API, bootstrap the entire workspace:

```bash
# From the project root
pnpm install
```

The `.pnpmrc` and `pnpm-workspace.yaml` are configured to approve build scripts for dependencies that require them (`@prisma/client`, `@prisma/engines`, `prisma`, `detox`, `dtrace-provider`). This ensures a smooth install without manual prompts.

### Setup

1. **Install dependencies** (from project root):

```bash
pnpm install
```

Or, if working only on the API package:

```bash
cd apps/api
pnpm install --filter @infocus/api
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

- `pnpm run dev` - Start development server with hot reload
- `pnpm run build` - Build TypeScript to JavaScript (uses `tsconfig.build.json`)
- `pnpm run typecheck` - Type-check TypeScript without building (uses `tsconfig.build.json`)
- `pnpm run clean` - Remove dist directory
- `pnpm run lint` - Run ESLint on source code
- `pnpm run test` - Run Jest test suite
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run test:coverage` - Run tests with coverage report
- `pnpm run migrate` - Create or update database migrations
- `pnpm run migrate:prod` - Deploy migrations to production database
- `pnpm run seed` - Populate database with demo data
- `pnpm run prisma:generate` - Generate Prisma client types
- `pnpm run prisma:studio` - Open Prisma Studio (visual DB editor)

## Project Structure

```
apps/api/
├── src/
│   ├── index.ts                 # Application entry point
│   ├── server.ts                # Express server setup
│   ├── routes/
│   │   └── auth.ts              # Authentication routes
│   ├── middleware/
│   │   ├── auth.ts              # Authentication middleware
│   │   └── errorHandler.ts      # Error handling middleware
│   ├── services/
│   │   └── tmdbService.ts       # TMDB API integration
│   └── tests/
│       └── auth.test.ts         # Authentication integration tests
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── seed.ts                  # Seeding script
│   └── migrations/              # Migration history (auto-generated)
├── docs/
│   └── openapi.yaml             # OpenAPI specification
├── .env                         # Local environment config (git-ignored)
├── .env.example                 # Environment template
├── jest.config.cjs              # Jest test configuration
├── package.json
├── tsconfig.json                # TypeScript configuration (includes tests)
├── tsconfig.build.json          # Build-focused config (excludes tests)
├── Dockerfile                   # Multi-stage Docker build
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

### TypeScript Build Configuration

This API uses two TypeScript configurations:

- **`tsconfig.json`** - Full configuration including tests, used for development and IDE support
- **`tsconfig.build.json`** - Build-focused configuration that excludes test files, used for production builds

The build configuration:

- Sets `rootDir` to `src` to ensure clean output
- Excludes `src/tests/**` and `**/*.test.ts` to prevent test files from being included in builds
- Outputs to the `dist` directory

**Building for production:**

```bash
# From the API directory
pnpm run build

# Or from the project root
pnpm run build --filter @infocus/api
```

This generates production-ready JavaScript in the `dist/` directory without test files.

**Type checking without building:**

```bash
pnpm run typecheck
```

This is useful for CI/CD pipelines and IDE integration.

### Prisma Client Generation

Before building or running the API, ensure the Prisma client is generated:

```bash
pnpm run prisma:generate
```

This generates type-safe Prisma client code based on the schema. It's automatically run during Docker builds.

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

The enhanced seed script creates production-ready demo content with diverse users, families, and media content.

#### Demo User Credentials

All demo accounts use the same password: `password123`

| User | Email | Profile | Interests |
|------|-------|---------|-----------|
| Alice Johnson | alice@example.com | Movie buff, psychological thrillers | Thriller, Drama, Indie |
| Bob Smith | bob@example.com | Sci-fi enthusiast | Science Fiction, Documentary, Action |
| Charlie Davis | charlie@example.com | Documentary lover | Documentary, History, Biography |
| Diana Martinez | diana@example.com | Family movie night organizer | Family, Animation, Comedy |
| Evan Wilson | evan@example.com | Classic film aficionado | Classic, Drama, Film Noir |
| Fiona Chen | fiona@example.com | International cinema explorer | Foreign, Art House, Drama |
| George (Kid) | george@example.com | Loves cartoons and superheroes | Animation, Superhero, Adventure |
| Henry (Teen) | henry@example.com | Gaming and anime fan | Action, Anime, Teen Drama |

#### Family Groups

The seed creates four themed families:

1. **Cinema Scholars** - Serious film discussions and classic cinema
   - Members: Alice (owner), Evan (admin), Charlie (member)

2. **Family Movie Night** - Kid-friendly content for all ages
   - Members: Diana (owner), George (member), Henry (member)

3. **Sci-Fi Explorers** - Science fiction and fantasy exploration
   - Members: Bob (owner), Alice (member), Henry (member)

4. **World Cinema Club** - International films and diverse perspectives
   - Members: Fiona (owner), Charlie (member), Bob (member)

#### Running the Seed

To populate the database with demo data:

```bash
# From the API directory
npm run seed

# Or from the project root
pnpm --filter @infocus/api seed
```

The seed script will:
- Create 8 users with bcrypt-hashed passwords
- Generate detailed user profiles with preferences
- Add 10 diverse media items (movies and TV shows)
- Create 20+ watchlist entries with ratings and notes
- Set up 4 themed families with memberships
- Generate family invitations and recommendations
- Include streaming provider information for multiple regions
- Create active sessions and refresh tokens

#### Import/Export Ready Data

All demo data is structured for import/export functionality:
- Watchlist entries include detailed notes, ratings, and progress tracking
- Streaming provider information covers multiple regions (US, CA, GB, DE, FR)
- User profiles contain preferences and viewing history
- Media items include comprehensive metadata from TMDB

To modify demo data, edit `prisma/seed.ts` and re-run the seed command.

## API Documentation

### Authentication Endpoints

The API provides JWT-based authentication with secure refresh token rotation:

#### POST /auth/register

Register a new user account.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "clx123abc456",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /auth/login

Authenticate and receive tokens.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "user": {
    "id": "clx123abc456",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /auth/refresh

Refresh an expired access token using a valid refresh token. Implements automatic token rotation for enhanced security.

**Request:**

The refresh token can be provided in two ways:
1. **HTTP-only Cookie** (preferred): `refreshToken` cookie
2. **Request Body**: JSON payload with `refreshToken` field

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**

```json
{
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Token Rotation Details:**
- When a refresh token is used, a new refresh token is generated and issued
- The old refresh token is automatically revoked in the database
- The new refresh token is set in an HTTP-only cookie (secure, SameSite=Strict)
- Previous refresh tokens cannot be reused after rotation
- This prevents token replay attacks and enhances security

**Error Responses:**
- `401 Refresh token required` - No refresh token provided
- `401 Invalid or expired refresh token` - Token is revoked, expired, or invalid

#### POST /auth/logout

Revoke refresh token and clear session.

**Response:**

```json
{
  "message": "Logout successful"
}
```

#### GET /auth/me

Get the currently authenticated user's profile information.

**Request:**
- Requires `Authorization: Bearer <access_token>` header

**Response:**

```json
{
  "message": "User retrieved successfully",
  "user": {
    "id": "clx123abc456",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `401 Access token required` - Missing or invalid Authorization header
- `401 Invalid or expired access token` - Token has expired or is invalid
- `401 User not found` - User account not found in database

### Protected Routes

Protected routes require an `Authorization: Bearer <access_token>` header:

#### GET /api/profile

Get the authenticated user's profile.

**Response:**

```json
{
  "user": {
    "id": "clx123abc456",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Authentication Flow

1. **Register/Login**: User provides credentials, receives access token (15min) and refresh token (7d)
2. **Access Protected Routes**: Include access token in `Authorization: Bearer <token>` header
3. **Token Refresh**: When access token expires, use refresh token to get new access token
4. **Logout**: Revoke refresh token to end session

### Security Features

- **Password Hashing**: bcrypt with salt rounds (12)
- **JWT Tokens**: Short-lived access tokens (15min) + long-lived refresh tokens (7d)
- **Secure Cookies**: HttpOnly, Secure, SameSite=Strict for refresh tokens
- **Token Rotation**: Automatic refresh token rotation on every refresh operation
  - Old tokens are revoked in database after new token is issued
  - Prevents token replay attacks
  - Enforces single-use refresh tokens
- **Token Revocation**: Refresh tokens are stored in database and can be revoked
- **Cookie Preference**: HTTP-only cookies are preferred over request body for security
- **Input Validation**: Zod schema validation for all inputs
- **Error Handling**: Standardized error responses without sensitive information

For complete API specification, see [OpenAPI Documentation](docs/openapi.yaml).

## Environment Variables

**Required:**

- `DATABASE_URL` - PostgreSQL connection string

**Authentication:**

- `JWT_ACCESS_SECRET` - Secret for signing access tokens
- `JWT_REFRESH_SECRET` - Secret for signing refresh tokens

**Server:**

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment mode (development|production)
- `CORS_ORIGIN` - Allowed CORS origin (development allows all)

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

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Coverage

The test suite covers:

- User registration with validation and error cases
- User login with credential verification
- User profile retrieval (`GET /auth/me`)
- Token refresh flow with multiple scenarios:
  - Basic refresh with cookie
  - Refresh with request body fallback
  - HTTP-only cookie preference
  - Token rotation and revocation
  - Revoked token rejection
  - Expired token rejection
- Logout and token revocation
- Authentication middleware (valid, invalid, malformed tokens)
- Error handling scenarios
- Input validation edge cases
- Password and sensitive field exclusion

### Postman Collection

Import `docs/postman-collection.json` into Postman for easy API testing:

1. Open Postman
2. Click "Import" → "File"
3. Select `docs/postman-collection.json`
4. Set the `baseUrl` variable to your API endpoint
5. Use the collection to test all endpoints

## Notes

- **Authentication**: Fully implemented with JWT tokens, refresh token rotation, and secure cookie handling
- **Security**: Passwords are hashed with bcrypt (12 salt rounds), tokens stored securely in database
- **Testing**: Comprehensive integration tests covering all authentication flows
- **Documentation**: Complete OpenAPI specification and Postman collection provided
- **TMDB IDs**: Enable easy API synchronization for media metadata
- **Family/User relationships**: Support multi-user collaborative features

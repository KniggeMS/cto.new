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
│   ├── index.ts                 # Application entry point
│   ├── server.ts                # Express server setup
│   ├── routes/
│   │   └── auth.ts              # Authentication routes
│   ├── middleware/
│   │   ├── auth.ts              # Authentication middleware
│   │   └── errorHandler.ts      # Error handling middleware
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

Refresh an expired access token using a valid refresh token.

**Request:**

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

#### POST /auth/logout

Revoke refresh token and clear session.

**Response:**

```json
{
  "message": "Logout successful"
}
```

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
- **Token Rotation**: Refresh tokens are stored in database and can be revoked
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

- User registration with validation
- User login with credential verification
- Token refresh flow
- Logout and token revocation
- Authentication middleware
- Error handling scenarios
- Input validation edge cases

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

# InFocus Web App

The InFocus web application built with Next.js 13+ (App Router), TypeScript, Tailwind CSS, and React Query.

## Features

- **Next.js 13+ App Router** - Modern React framework with file-based routing
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **React Query (TanStack Query)** - Powerful data fetching and state management
- **Axios** - HTTP client with interceptors for authentication
- **React Hot Toast** - Beautiful notifications
- **Responsive Design** - Mobile-first responsive layouts
- **Centralized Auth** - Token-based authentication with automatic refresh

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Install dependencies (from project root)
pnpm install
```

### Environment Variables

Create a `.env.local` file in the `apps/web` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Development

```bash
# Start development server
pnpm dev

# The app will be available at http://localhost:3000
```

### Building

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Testing

```bash
# Run tests
pnpm test

# Run linting
pnpm lint

# Run type checking
pnpm typecheck
```

## Project Structure

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Home page
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── watchlist/         # Watchlist page
│   │   ├── search/            # Search page
│   │   ├── family/            # Family groups page
│   │   └── settings/          # Settings page
│   ├── components/
│   │   ├── layout/            # Layout components (Navigation, PageShell)
│   │   └── ui/                # Reusable UI components (Button, Input, Card)
│   ├── lib/
│   │   ├── api/               # API client and service functions
│   │   ├── context/           # React contexts (auth)
│   │   ├── hooks/             # Custom React hooks (React Query hooks)
│   │   ├── providers/         # Provider components (QueryProvider)
│   │   └── utils/             # Utility functions
│   └── app/globals.css        # Global styles
├── public/                     # Static assets
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## Routes

- `/` - Home page (redirects to /watchlist if authenticated)
- `/login` - User login
- `/register` - User registration
- `/watchlist` - User's watchlist (protected)
- `/search` - Search for movies/TV shows (protected)
- `/family` - Family groups management (protected)
- `/settings` - User settings (protected)

## API Integration

The app uses Axios with interceptors for API communication:

- **Base URL**: Configured via `NEXT_PUBLIC_API_URL`
- **Authentication**: Automatic token injection in request headers
- **Token Refresh**: Automatic token refresh on 401 responses
- **Error Handling**: Centralized error handling with toast notifications

## Authentication Flow

1. User logs in or registers
2. Access and refresh tokens are stored in localStorage
3. Access token is automatically added to API requests
4. On token expiration (401), the refresh token is used to get a new access token
5. If refresh fails, user is redirected to login

## State Management

React Query is used for server state management:

- **Caching**: Automatic caching of API responses
- **Refetching**: Smart refetching on window focus and reconnect
- **Optimistic Updates**: Immediate UI updates with background sync
- **Loading States**: Built-in loading and error states

## UI Components

Reusable components built with Tailwind CSS:

- **Button** - Multiple variants (primary, secondary, outline, ghost, danger)
- **Input** - Form input with label and error states
- **Card** - Container component for content sections
- **Navigation** - Top navigation bar with authentication state
- **PageShell** - Page wrapper with title and description

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Ensure all tests pass: `pnpm test`
4. Ensure linting passes: `pnpm lint`
5. Ensure type checking passes: `pnpm typecheck`

## License

MIT

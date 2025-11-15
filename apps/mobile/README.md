# InFocus Mobile App

React Native mobile application for InFocus - a collaborative media tracking and recommendation platform.

## Features

### Authentication
- **Login/Register Screens**: Form validation and API integration mirroring web auth endpoints
- **Secure Token Storage**: Using Expo SecureStore for persistent, encrypted token storage
- **Token Refresh**: Automatic token refresh on 401 responses with axios interceptors
- **Onboarding Flow**: Post-registration flow for setting display name and preferred streaming providers
- **Navigation Guards**: Prevents unauthenticated access to main tabs
- **Session Persistence**: Authentication persists across app restarts

### Main Features
- **Watchlist**: View and manage your watchlist (placeholder)
- **Search**: Search for movies and TV shows (placeholder)
- **Family**: Manage family groups (placeholder)
- **Settings**: View profile and logout

## Tech Stack

- **React Native** 0.73.11
- **React Navigation** - Native Stack and Bottom Tabs
- **Expo SecureStore** - Secure token storage
- **Axios** - HTTP client with interceptors
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **TypeScript** - Type safety

## Project Structure

```
src/
├── components/
│   ├── forms/
│   │   ├── Input.tsx          # Reusable input component
│   │   └── Button.tsx         # Reusable button component
│   └── layout/
│       └── Container.tsx      # Screen container with SafeArea
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx    # Login form
│   │   ├── RegisterScreen.tsx # Registration form
│   │   └── OnboardingScreen.tsx # Post-registration onboarding
│   ├── tabs/
│   │   ├── WatchlistScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── FamilyScreen.tsx
│   │   └── SettingsScreen.tsx
│   └── SplashScreen.tsx       # Loading screen
├── navigation/
│   ├── AuthNavigator.tsx      # Auth stack (Login/Register)
│   ├── TabNavigator.tsx       # Main tabs
│   └── RootNavigator.tsx      # Root navigation logic
├── lib/
│   ├── api/
│   │   ├── client.ts          # Axios client with interceptors
│   │   ├── auth.ts            # Auth API methods
│   │   └── types.ts           # API types
│   ├── context/
│   │   └── AuthContext.tsx    # Global auth state
│   ├── storage/
│   │   └── SecureStorage.ts   # SecureStore wrapper
│   └── validation/
│       └── auth.ts            # Zod schemas
└── __tests__/                 # Jest tests
    ├── components/
    ├── screens/
    └── e2e/                   # Detox E2E tests
```

## Setup

### Prerequisites
- Node.js 18+
- React Native development environment
- iOS Simulator (for iOS) or Android Emulator (for Android)

### Installation

```bash
cd apps/mobile
npm install
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
API_URL=http://localhost:3000
NODE_ENV=development
```

## Development

```bash
# Run development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Testing

> **Note**: Full React Native testing requires a properly configured React Native environment with iOS/Android projects. The project currently uses pnpm workspaces. If using npm, you may need to install dependencies with pnpm or convert workspace protocol references.

### Unit Tests

```bash
# Run all unit tests (from project root using turbo)
npm test

# Run mobile tests specifically
cd apps/mobile && npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### E2E Tests (Detox)

```bash
# Build iOS app for testing
npm run build:e2e:ios

# Run iOS E2E tests
npm run test:e2e

# Build Android app for testing
npm run build:e2e:android

# Run Android E2E tests
npm run test:e2e:android
```

## Authentication Flow

### Token Management

1. **Login/Register**: Receives `accessToken` and `refreshToken` from API
2. **Storage**: Tokens are stored securely using Expo SecureStore
3. **Request Interceptor**: Automatically attaches access token to API requests
4. **Response Interceptor**: Handles 401 errors by refreshing tokens
5. **Logout**: Clears tokens from SecureStore

### Navigation Flow

```
App Launch
    ↓
Auth Context Initialized
    ↓
Check for Access Token
    ↓
    ├─ Token Found → Verify with API → Main Tabs
    ├─ Token Invalid → Login Screen
    └─ No Token → Login Screen
        ↓
    Login/Register
        ↓
    Needs Onboarding? → Onboarding Screen
        ↓
    Main Tabs
```

### Onboarding

After registration, users without a display name are guided through an onboarding flow:

1. **Display Name**: Optional, but recommended
2. **Streaming Providers**: Select available streaming services
3. **Skip Option**: Can skip onboarding and complete later

## API Integration

The mobile app mirrors the web app's API endpoints:

- `POST /auth/login` - Login
- `POST /auth/register` - Register
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user
- `POST /auth/refresh` - Refresh access token
- `PATCH /profile` - Update profile (onboarding)

## Form Validation

### Login
- Email: Valid email format
- Password: Required

### Register
- Display Name: 1-100 characters
- Email: Valid email format
- Password: Min 8 chars, uppercase, lowercase, number
- Confirm Password: Must match password

### Onboarding
- Display Name: Optional, 1-100 characters
- Streaming Providers: Optional, multi-select

## Components

### Input
Reusable text input with label and error message display.

```tsx
<Input
  label="Email"
  placeholder="Enter your email"
  value={value}
  onChangeText={onChange}
  error={errors.email?.message}
  keyboardType="email-address"
/>
```

### Button
Reusable button with loading state and variants.

```tsx
<Button
  title="Sign In"
  onPress={handleSubmit}
  loading={loading}
  variant="primary"
/>
```

### Container
Screen wrapper with SafeArea and KeyboardAvoidingView.

```tsx
<Container scrollable>
  {/* Screen content */}
</Container>
```

## Security

- **Secure Storage**: Tokens stored in device keychain/keystore
- **HTTPS**: All API requests over HTTPS in production
- **Token Refresh**: Automatic token refresh on expiry
- **Logout on Error**: Clears tokens on authentication errors

## Known Limitations

- **React Native Environment**: Full React Native environment with iOS/Android projects not yet configured
- **Testing**: Unit tests require React Native dependencies to be properly installed via pnpm
- **Package Manager**: Project uses pnpm workspaces; npm may have compatibility issues
- **Navigation**: Set up but requires actual native builds to test fully
- **E2E Tests**: Require native app builds (iOS/Android) and real devices/simulators
- **Push notifications**: Not yet implemented
- **Biometric authentication**: Not yet implemented

## Future Enhancements

- [ ] Biometric authentication (Face ID / Touch ID)
- [ ] Push notifications
- [ ] Offline support
- [ ] Deep linking
- [ ] Social authentication (Google, Apple)
- [ ] Remember me functionality
- [ ] Password reset flow

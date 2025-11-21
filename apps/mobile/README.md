# InFocus Mobile App

React Native mobile application built with Expo for the InFocus platform.

## Tech Stack

- **Expo SDK 50** - Managed React Native workflow
- **React Navigation 6** - Navigation library with authentication flow
- **NativeBase** - Cross-platform UI component library
- **TypeScript** - Type safety
- **Zod** - Runtime validation
- **Axios** - HTTP client with interceptors
- **AsyncStorage** - Local token storage
- **Jest + React Native Testing Library** - Unit/integration testing
- **Detox** - End-to-end testing

## Project Structure

```
src/
├── contexts/          # React contexts (Auth)
├── lib/              # Core libraries
│   └── api/          # API client and endpoints
├── navigation/       # Navigation stacks and tabs
├── screens/          # Screen components
│   ├── auth/         # Authentication screens (Login, Register)
│   └── app/          # Main app screens (Watchlist, Search, Family, Settings)
├── theme/            # NativeBase theme configuration
├── types/            # TypeScript type definitions
└── App.tsx           # Root component

e2e/                  # Detox end-to-end tests
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- iOS: Xcode 14+ and CocoaPods
- Android: Android Studio and SDK

### Installation

```bash
# Install dependencies
pnpm install

# Start Expo development server
cd apps/mobile
pnpm start
```

### Running on Simulators/Emulators

```bash
# iOS
pnpm ios

# Android
pnpm android

# Web (for quick testing)
pnpm web
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_API_TIMEOUT=10000
EXPO_PUBLIC_APP_ENV=development
```

### EAS Build

The app is configured for EAS Build with three environments:

- **development**: Local development builds with dev client
- **preview**: Staging/testing builds
- **production**: Production builds for app stores

To build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project (first time only)
eas build:configure

# Build for development
eas build --profile development --platform ios
eas build --profile development --platform android

# Build for production
eas build --profile production --platform all
```

## Features

### Authentication

- Email/password login and registration
- JWT token management with automatic refresh
- Secure token storage with AsyncStorage
- Protected route navigation

### Navigation

The app uses a conditional navigation structure:

- **Auth Stack**: Login and Register screens (unauthenticated users)
- **App Tabs**: Main app screens with bottom tab navigation (authenticated users)
  - Watchlist: User's watchlist (placeholder)
  - Search: Search for media (placeholder)
  - Family: Family groups (placeholder)
  - Settings: User settings and logout

### Theming

The app uses a custom NativeBase theme that matches the web app's color scheme:

- Primary colors: Blue shades (#0ea5e9 - #082f49)
- Secondary colors: Purple shades (#a855f7 - #3b0764)
- Consistent styling across all components

## Development

### Scripts

```bash
# Start development server
pnpm start
pnpm dev

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Testing
pnpm test
pnpm test:watch

# Clean build artifacts
pnpm clean
```

### Testing

#### Unit/Integration Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch
```

#### E2E Tests with Detox

```bash
# Build for iOS
pnpm test:e2e:build:ios

# Run iOS tests
pnpm test:e2e:test:ios

# Build for Android
pnpm test:e2e:build:android

# Run Android tests
pnpm test:e2e:test:android
```

## API Integration

The mobile app connects to the same backend API as the web app. The API client is configured with:

- Automatic JWT token injection
- Token refresh on 401 responses
- Error handling and retry logic
- Request/response interceptors

### API Endpoints Used

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user
- `POST /auth/refresh` - Refresh access token

## Troubleshoads

### iOS Build Issues

```bash
# Clean iOS build
cd ios && pod deintegrate && pod install
```

### Android Build Issues

```bash
# Clean Android build
cd android && ./gradlew clean
```

### Metro Bundler Issues

```bash
# Clear Metro cache
pnpm start --clear
```

## Future Enhancements

- [ ] Implement watchlist CRUD operations
- [ ] Add search functionality with TMDB integration
- [ ] Implement family group features
- [ ] Add push notifications
- [ ] Offline support with local caching
- [ ] Biometric authentication
- [ ] Deep linking support
- [ ] Social sharing features
- [ ] Dark mode support
- [ ] Accessibility improvements

## Contributing

Follow the same code style and patterns as the web app:

- Use TypeScript for type safety
- Follow existing component patterns
- Write tests for new features
- Update documentation as needed

## License

Private - InFocus Platform

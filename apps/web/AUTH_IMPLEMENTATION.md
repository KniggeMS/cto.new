# Authentication Implementation Guide

## Overview

The InFocus web application implements a secure authentication system with the following features:

- User registration and login with email/password
- Form validation using React Hook Form + Zod
- Token-based authentication (JWT access tokens, httpOnly refresh tokens)
- Automatic token refresh on expiration
- Protected routes with middleware
- Global authentication context for state management
- Comprehensive test coverage

## Architecture

### Frontend Flow

1. **Authentication Context** (`src/lib/context/auth-context.tsx`)
   - Manages global auth state (user, isLoading, isAuthenticated)
   - Provides login, register, and logout functions
   - Initializes auth state from localStorage on mount
   - Automatically refreshes user data on page load

2. **API Client** (`src/lib/api/client.ts`)
   - Axios instance with interceptors
   - Automatically injects access token in request headers
   - Handles 401 errors by refreshing the token
   - Redirects to login on refresh token failure

3. **Validation Schemas** (`src/lib/validation/auth.ts`)
   - Zod schemas for login and register forms
   - Email format validation
   - Password strength requirements:
     - Minimum 8 characters
     - At least one uppercase letter
     - At least one lowercase letter
     - At least one number

4. **Pages**
   - **Login** (`src/app/login/page.tsx`)
     - React Hook Form with Zod validation
     - Error handling and display
     - Redirect to register link
   - **Register** (`src/app/register/page.tsx`)
     - Display name, email, password, confirm password fields
     - Password confirmation validation
     - Redirect to login link

5. **Route Protection**
   - **Middleware** (`middleware.ts`)
     - Protects routes: /watchlist, /search, /family, /settings
     - Redirects unauthenticated users to /login
     - Uses cookies for token detection
   - **ProtectedRoute Component** (`src/components/layout/ProtectedRoute.tsx`)
     - Wraps route content
     - Shows loading spinner during auth check
     - Redirects to login if not authenticated

## Token Management

### Access Token
- Stored in localStorage for client-side access
- Included in Authorization header: `Bearer {accessToken}`
- Expires in 15 minutes
- Automatically refreshed when expired

### Refresh Token
- Set as httpOnly cookie by backend (secure, not accessible from JS)
- 7-day expiration
- Stored in database and can be revoked
- Used to obtain new access tokens

## Authentication Flow

### Login Flow
1. User enters email and password
2. Form validation using Zod schema
3. Call `authApi.login()` with credentials
4. Backend validates and returns user + accessToken
5. accessToken stored in localStorage
6. User context updated with user data
7. Redirect to /watchlist

### Register Flow
1. User enters display name, email, password, confirm password
2. Form validation using Zod schema
3. Call `authApi.register()` with data
4. Backend creates user and returns tokens
5. accessToken stored in localStorage
6. User context updated
7. Redirect to /watchlist

### Logout Flow
1. Call `authApi.logout()` to revoke refresh token on backend
2. Clear localStorage tokens
3. Reset user context
4. Redirect to /login

### Token Refresh Flow
1. API client detects 401 response
2. Attempts to refresh token using refreshToken from localStorage
3. If refresh succeeds, stores new accessToken and retries original request
4. If refresh fails, clears tokens and redirects to /login

## Protected Routes

### Middleware-Protected Routes
- `/watchlist` - User's watchlist
- `/search` - Search functionality
- `/family` - Family groups
- `/settings` - User settings

Unauthenticated users are redirected to `/login` at the middleware level.

### Component-Protected Routes

Wrap route content with `ProtectedRoute` component:

```tsx
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

export default function WatchlistPage() {
  return (
    <ProtectedRoute>
      <div>Protected content</div>
    </ProtectedRoute>
  );
}
```

## API Endpoints

### Authentication Endpoints

- `POST /auth/register` - Create new user account
- `POST /auth/login` - Authenticate user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout and revoke refresh token
- `GET /auth/me` - Get current user profile

## Error Handling

### Form Validation Errors
- Displayed inline below form fields
- Clear, user-friendly messages
- Prevents submission with invalid data

### API Errors
- Captured and displayed as toast notifications
- Specific error messages from backend
- Graceful handling of network failures

### Authentication Errors
- Invalid credentials: "Invalid email or password"
- Email already exists: "User with this email already exists"
- Weak password: Specific validation message
- Expired token: Automatic refresh attempted

## Testing

### Test Files
- `src/__tests__/auth.test.tsx` - Login/register form validation
- `src/__tests__/route-protection.test.tsx` - Route protection logic
- `src/__tests__/auth-flow.integration.test.tsx` - End-to-end authentication flows

### Running Tests
```bash
npm run test
```

### Test Coverage
- Form validation (email, password, password confirmation)
- Successful login/register flows
- Error handling and error messages
- Token persistence and refresh
- Protected route access control
- Redirect logic for authenticated/unauthenticated users

## Security Considerations

1. **HTTPS Only** - In production, ensure API is served over HTTPS
2. **httpOnly Cookies** - Refresh token is httpOnly, protecting against XSS
3. **CORS** - Configure CORS appropriately for your domain
4. **Token Expiration** - Access tokens expire in 15 minutes, refresh tokens in 7 days
5. **Password Hashing** - Backend uses bcrypt (salt rounds: 12)
6. **Input Validation** - Client-side validation + server-side validation
7. **Secure Logout** - Refresh token revoked on backend during logout

## Environment Variables

```env
# Web app
NEXT_PUBLIC_API_URL=http://localhost:3000

# Backend (set in deployment)
JWT_ACCESS_SECRET=<random-string>
JWT_REFRESH_SECRET=<random-string>
NODE_ENV=production
```

## Troubleshooting

### User redirected immediately after login
- Check if redirect logic in `useEffect` is executing correctly
- Ensure auth context is properly initialized
- Check browser console for errors

### Tokens not persisting after page reload
- Verify localStorage is not cleared
- Check if `getCurrentUser()` API call is succeeding
- Look for 401 errors in network tab

### Protected routes accessible without auth
- Verify middleware.ts is in project root
- Check that protected route paths match middleware config
- Clear `.next` build cache and rebuild

### 401 errors not triggering token refresh
- Check if refresh token exists in localStorage
- Verify refresh token is not expired
- Check backend logs for refresh endpoint errors

## Future Enhancements

1. **Remember Me** - Option to extend session expiration
2. **Social Login** - Google, GitHub, etc.
3. **Two-Factor Authentication** - Enhanced security
4. **Forgot Password** - Placeholder noted in validation schema
5. **Email Verification** - Confirm email on registration
6. **Session Management** - View/revoke active sessions
7. **Biometric Auth** - Fingerprint/Face ID on mobile

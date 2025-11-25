import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/watchlist', '/search', '/family', '/settings'];
const authRoutes = ['/login', '/register'];
const publicRoutes = ['/', '/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname === route);
  const isPublicRoute = publicRoutes.includes(pathname);

  // Check for refresh token cookie (HTTP-only)
  const refreshTokenCookie = request.cookies.get('refreshToken')?.value;

  // If trying to access protected route without refresh cookie, redirect to login
  // In development, we may not have the cookie set properly, so be more permissive
  const isDev = process.env.NODE_ENV === 'development';
  if (isProtectedRoute && !refreshTokenCookie && !isDev) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};

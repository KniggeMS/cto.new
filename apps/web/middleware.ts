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

  // Note: In middleware, we can only check cookies, not localStorage
  // The actual auth check will happen client-side with the auth context
  // This middleware provides basic protection
  const accessToken = request.cookies.get('accessToken')?.value;

  // If trying to access protected route without auth cookie, redirect to login
  if (isProtectedRoute && !accessToken) {
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

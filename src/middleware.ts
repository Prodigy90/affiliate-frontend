import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  AUTH_COOKIE_PREFIX,
  PROTECTED_ROUTES,
  AUTH_ROUTES,
  ADMIN_ROUTES,
  DEFAULT_LOGIN_REDIRECT
} from "./lib/auth-constants";

/**
 * Route protection middleware
 *
 * Protects routes based on authentication status:
 * - /affiliate/* - Requires authentication
 * - /admin/* - Requires authentication + admin role
 * - /login, /signup - Redirects authenticated users to affiliate dashboard
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for auth session cookie (using prefix from auth-constants.ts)
  const sessionCookie =
    request.cookies.get(`${AUTH_COOKIE_PREFIX}.session_token`) ||
    request.cookies.get(`__Secure-${AUTH_COOKIE_PREFIX}.session_token`);
  const isAuthenticated = !!sessionCookie?.value;

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Check if route is an auth route (login, signup, etc.)
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Check if route is admin-only
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from auth routes to affiliate dashboard
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, request.url));
  }

  // Note: Admin role verification is done server-side in the admin layout/pages
  // Middleware only ensures the user is authenticated for admin routes

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - api routes (handled by route handlers)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};

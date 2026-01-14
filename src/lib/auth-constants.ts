/**
 * Authentication constants
 *
 * Shared between auth.ts and middleware.ts to ensure cookie names stay in sync.
 * If you change the cookie prefix here, both server and middleware will use the same value.
 */

/** Cookie prefix for Better Auth - used to namespace session cookies */
export const AUTH_COOKIE_PREFIX = 'affiliate';

/** Protected routes that require authentication */
export const PROTECTED_ROUTES = ['/affiliate', '/admin'];

/** Routes that should redirect authenticated users to affiliate dashboard */
export const AUTH_ROUTES = ['/login', '/signup'];

/** Admin-only routes (subset of protected routes) */
export const ADMIN_ROUTES = ['/admin'];

/** Default redirect after login */
export const DEFAULT_LOGIN_REDIRECT = '/affiliate/dashboard';

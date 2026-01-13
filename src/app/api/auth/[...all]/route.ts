import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Better Auth API route handler
 *
 * This catch-all route handles all authentication endpoints:
 * - POST /api/auth/sign-in/social (Google OAuth)
 * - POST /api/auth/sign-out
 * - GET /api/auth/session
 * - GET /api/auth/callback/google
 */
export const { GET, POST } = toNextJsHandler(auth);

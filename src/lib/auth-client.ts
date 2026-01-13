import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client for browser-side authentication
 *
 * Provides hooks and methods for:
 * - Sign in with Google OAuth
 * - Sign out
 * - Session management
 */
export const authClient = createAuthClient({
  // Use relative URL - works in any environment
  baseURL: ""
});

// Export individual methods for convenience
export const { signIn, signOut, useSession, getSession } = authClient;

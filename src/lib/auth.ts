import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { AUTH_COOKIE_PREFIX } from "./auth-constants";
import { syncAffiliateToBackend } from "./server/affiliate-sync";

// Validate required environment variables at startup
if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET environment variable is required");
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const isProduction = process.env.NODE_ENV === "production";

// Configure SSL for production database connections
// Set DB_SSL_REJECT_UNAUTHORIZED=false only if using a managed database
// with a certificate that can't be verified (e.g., some cloud providers)
const sslConfig = isProduction
  ? {
      rejectUnauthorized:
        process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false"
    }
  : false;

/**
 * Better Auth server configuration
 *
 * This configures authentication with:
 * - Google OAuth for sign-in
 * - PostgreSQL database for user/session storage
 * - Automatic user sync to Go backend on creation
 */
export const auth = betterAuth({
  // Database configuration with SSL for production
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig
  }),

  // Base URL for auth callbacks - required in production
  baseURL: (() => {
    const url = process.env.BETTER_AUTH_URL;
    if (!url && process.env.NODE_ENV === 'production') {
      throw new Error('BETTER_AUTH_URL environment variable is required in production');
    }
    return url || 'http://localhost:3000';
  })(),

  // Secret for session encryption
  secret: process.env.BETTER_AUTH_SECRET,

  // Social providers - Google OAuth only
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5 // 5 minutes
    }
  },

  // Use unique cookie prefix to avoid conflicts with other apps on localhost
  advanced: {
    cookiePrefix: AUTH_COOKIE_PREFIX
  },

  // User configuration with affiliate-specific fields
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "affiliate"
      },
      refId: {
        type: "string",
        required: false
      },
      affiliateId: {
        type: "string",
        required: false
      }
    }
  },

  // Database hooks for syncing with backend
  databaseHooks: {
    user: {
      create: {
        // Use 'after' hook but sync is idempotent - if it fails, proxy will handle it
        after: async (user) => {
          try {
            const result = await syncAffiliateToBackend(user);
            if (!result.ok) {
              console.error("[Auth] Failed to sync user to backend, status:", result.status);
            }
          } catch (error) {
            const errorCode = error instanceof Error ? error.name : "unknown";
            console.error("[Auth] Error syncing user to backend:", errorCode);
          }
        }
      }
    }
  }
});

// Export type for client
export type Auth = typeof auth;

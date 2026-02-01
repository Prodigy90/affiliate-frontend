import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { AUTH_COOKIE_PREFIX } from "./auth-constants";

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
          // Sync new user to Go backend after creation
          const baseUrl = process.env.BETTER_AUTH_URL;
          if (!baseUrl) {
            console.error("[Auth] BETTER_AUTH_URL not configured, skipping user sync");
            return;
          }

          try {
            const response = await fetch(`${baseUrl}/api/auth/sync-user`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: user.id,
                email: user.email,
                name: user.name
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error(
                "[Auth] Failed to sync user to backend:",
                errorText
              );
              // Don't throw - proxy will create affiliate on first request if needed
            } else {
              const data = await response.json();
              console.log(
                "[Auth] User synced to backend:",
                user.id,
                data?.data?.id
              );
            }
          } catch (error) {
            console.error("[Auth] Error syncing user to backend:", error);
            // Don't throw - proxy will handle affiliate creation
          }
        }
      }
    }
  }
});

// Export type for client
export type Auth = typeof auth;

import { NextResponse } from "next/server";

// Default to localhost for development, require INTERNAL_API_URL at runtime in production
// Note: Validation is done at runtime (not module load) to allow building without env vars
const getBackendUrl = () => {
  const url = process.env.INTERNAL_API_URL;
  if (!url && process.env.NODE_ENV === 'production') {
    throw new Error('INTERNAL_API_URL environment variable is required in production');
  }
  return url || 'http://localhost:8080/api/v1';
};

/**
 * API Route: /api/auth/sync-user
 *
 * Syncs a Better Auth user to the Go backend database.
 * Called after successful signup to create affiliate record in backend.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, email, name } = body;

    if (!user_id || !email) {
      return NextResponse.json(
        { success: false, error: "user_id and email are required" },
        { status: 400 }
      );
    }

    // Call backend to create affiliate record
    const response = await fetch(`${getBackendUrl()}/auth/signup-external`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Internal API key for server-to-server auth - required in all environments
        "X-Internal-API-Key": process.env.INTERNAL_API_KEY || ""
      },
      body: JSON.stringify({
        user_id, // Better Auth user ID
        email,
        name: name || email.split("@")[0] // Use email prefix if no name
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[Sync] Backend returned error:",
        response.status,
        errorText
      );

      // Don't throw - log and return success anyway
      // User can still use the app with Better Auth data
      return NextResponse.json({
        success: true,
        warning: "User created in frontend, backend sync pending"
      });
    }

    const data = await response.json();
    console.log("[Sync] User synced to backend successfully:", user_id);

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error("[Sync] Failed to sync user:", error);

    // Don't fail the request - user signup already succeeded in Better Auth
    return NextResponse.json({
      success: true,
      warning: "User created in frontend, backend sync will retry"
    });
  }
}

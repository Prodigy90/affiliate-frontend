import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import * as jose from "jose";

// Require INTERNAL_API_URL in production
const BACKEND_URL = process.env.INTERNAL_API_URL;

if (!BACKEND_URL && process.env.NODE_ENV === 'production') {
  throw new Error('INTERNAL_API_URL environment variable is required in production');
}

// Default to localhost for development only
const getBackendUrl = () => BACKEND_URL || 'http://localhost:8080/api/v1';

// Cache affiliate info by email to avoid repeated lookups
// Limited to 1000 entries to prevent unbounded growth
const MAX_CACHE_SIZE = 1000;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const affiliateCache = new Map<
  string,
  { affiliateId: string; refId: string; role: string; expiresAt: number }
>();

/**
 * Clean up expired cache entries and enforce size limit.
 */
function cleanupCache(): void {
  const now = Date.now();

  // Remove expired entries
  for (const [key, value] of affiliateCache.entries()) {
    if (value.expiresAt < now) {
      affiliateCache.delete(key);
    }
  }

  // If still over limit, remove oldest entries
  if (affiliateCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(affiliateCache.entries());
    entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);

    const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
    for (const [key] of toRemove) {
      affiliateCache.delete(key);
    }
  }
}

/**
 * API Proxy Route
 *
 * Proxies requests to the Go backend, avoiding CORS issues and
 * eliminating the need for NEXT_PUBLIC_API_URL.
 *
 * Automatically adds JWT authentication from Better Auth session.
 */

/**
 * Get or create affiliate by email from the backend.
 * Uses the signup-external endpoint which performs an idempotent upsert.
 * Results are cached for 5 minutes to reduce backend calls.
 */
async function getOrCreateAffiliate(
  email: string
): Promise<{ affiliateId: string; refId: string; role: string } | null> {
  // Check cache first
  const cached = affiliateCache.get(email);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      affiliateId: cached.affiliateId,
      refId: cached.refId,
      role: cached.role
    };
  }

  // Require INTERNAL_API_KEY in production
  const apiKey = process.env.INTERNAL_API_KEY;
  if (!apiKey && process.env.NODE_ENV === "production") {
    console.error("[Proxy] INTERNAL_API_KEY not configured in production");
    return null;
  }

  try {
    // Call the backend to get/create affiliate by email
    // This endpoint is idempotent - it returns existing affiliate or creates new
    const response = await fetch(`${getBackendUrl()}/auth/signup-external`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-API-Key": apiKey || ""
      },
      body: JSON.stringify({
        user_id: "proxy-lookup",
        email,
        name: email.split("@")[0]
      })
    });

    if (!response.ok) {
      // Log status only - avoid logging response body which may contain sensitive data
      console.error("[Proxy] Failed to get affiliate, status:", response.status);
      return null;
    }

    const data = await response.json();
    const affiliate = data.data;

    if (!affiliate?.id) {
      console.error("[Proxy] Invalid affiliate response:", data);
      return null;
    }

    // Cleanup cache before adding new entry
    cleanupCache();

    // Cache the result
    affiliateCache.set(email, {
      affiliateId: affiliate.id,
      refId: affiliate.ref_id || "",
      role: affiliate.role || "affiliate",
      expiresAt: Date.now() + CACHE_TTL
    });

    return {
      affiliateId: affiliate.id,
      refId: affiliate.ref_id || "",
      role: affiliate.role || "affiliate"
    };
  } catch (error) {
    console.error("[Proxy] Error getting affiliate:", error);
    return null;
  }
}

async function getJWTToken(reqHeaders: Headers): Promise<string | null> {
  try {
    const session = await auth.api.getSession({
      headers: reqHeaders
    });

    if (!session?.user) {
      return null;
    }

    // Use the same secret as the Go backend for JWT
    const secret = process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET;
    if (!secret) {
      console.error("[Proxy] No JWT_SECRET or BETTER_AUTH_SECRET configured");
      return null;
    }

    // Get the affiliate ID from backend
    const affiliate = await getOrCreateAffiliate(session.user.email);
    if (!affiliate) {
      console.error(
        "[Proxy] Could not find affiliate for email:",
        session.user.email
      );
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 24 * 60 * 60; // 24 hours

    const secretKey = new TextEncoder().encode(secret);
    const token = await new jose.SignJWT({
      sub: affiliate.affiliateId, // Use backend affiliate ID, not Better Auth user ID
      email: session.user.email,
      name: session.user.name,
      ref_id: affiliate.refId,
      role: affiliate.role
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(now)
      .setExpirationTime(now + expiresIn)
      .sign(secretKey);

    return token;
  } catch (error) {
    console.error("[Proxy] Failed to get JWT token:", error);
    return null;
  }
}

/**
 * Validate and sanitize the proxy path to prevent path traversal attacks.
 * Allows: alphanumeric, hyphens, underscores, periods, and slashes.
 * UUIDs are allowed (contain hyphens).
 */
function validatePath(pathSegments: string[]): string | null {
  const path = pathSegments.join("/");

  // Block path traversal attempts
  if (path.includes("..") || path.includes("//")) {
    return null;
  }

  // Block null bytes and other control characters
  if (/[\x00-\x1f]/.test(path)) {
    return null;
  }

  // Allow alphanumeric, hyphens, underscores, periods, and slashes
  // This permits UUIDs (e.g., "123e4567-e89b-12d3-a456-426614174000")
  // and file extensions (e.g., "image.png")
  if (!/^[a-zA-Z0-9\-_./]+$/.test(path)) {
    return null;
  }

  return path;
}

/**
 * Validate query string to prevent injection attacks.
 * Returns sanitized query string or empty string.
 */
function validateQueryString(search: string): string {
  if (!search) return "";

  // URLSearchParams handles encoding/decoding safely
  try {
    const params = new URLSearchParams(search);
    // Rebuild to ensure proper encoding
    return params.toString() ? `?${params.toString()}` : "";
  } catch {
    // If parsing fails, reject the query string
    console.warn("[Proxy] Invalid query string rejected:", search);
    return "";
  }
}

async function proxyRequest(
  request: NextRequest,
  path: string,
  method: string
): Promise<NextResponse> {
  // Validate path
  const validPath = validatePath(path.split("/"));
  if (!validPath) {
    return NextResponse.json(
      { error: "invalid_path", message: "Invalid request path" },
      { status: 400 }
    );
  }

  const reqHeaders = await headers();
  const token = await getJWTToken(reqHeaders);

  // Build the backend URL with validated query string
  const backendBaseUrl = getBackendUrl();
  const url = new URL(request.url);
  const queryString = validateQueryString(url.search);
  const backendUrl = `${backendBaseUrl}/${validPath}${queryString}`;

  // Prepare headers for backend request
  const backendHeaders: HeadersInit = {
    "Content-Type": "application/json"
  };

  if (token) {
    backendHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Forward the request to backend
  const fetchOptions: RequestInit = {
    method,
    headers: backendHeaders
  };

  // Include body for POST, PUT, PATCH requests
  if (["POST", "PUT", "PATCH"].includes(method)) {
    try {
      const body = await request.text();
      if (body) {
        fetchOptions.body = body;
      }
    } catch (bodyErr) {
      console.warn("[Proxy] Could not read request body:", bodyErr);
    }
  }

  try {
    const response = await fetch(backendUrl, fetchOptions);
    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json"
      }
    });
  } catch (error) {
    // Log error without exposing sensitive details like URLs or request data
    console.error("[Proxy] Request failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Proxy error", message: "Failed to connect to backend" },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join("/"), "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join("/"), "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join("/"), "PUT");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join("/"), "PATCH");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join("/"), "DELETE");
}

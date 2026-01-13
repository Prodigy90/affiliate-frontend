// Use the Next.js proxy to avoid CORS issues and NEXT_PUBLIC env vars
// The proxy at /api/proxy forwards requests to the Go backend
// and automatically adds JWT auth from Better Auth session
const API_BASE_URL = "/api/proxy";

type RequestOptions = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: string;
  headers?: Record<string, string>;
};

async function request<T>(path: string, options: RequestOptions): Promise<T> {
  // Build URL - remove leading slash from path if present
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const url = `${API_BASE_URL}/${cleanPath}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers || {})
  };

  // Note: No authToken needed - proxy handles auth via cookies
  const res = await fetch(url, {
    method: options.method,
    credentials: "include", // Include cookies for proxy authentication
    headers,
    cache: "no-store",
    body: options.body
  });

  if (!res.ok) {
    const text = await res.text();

    // Status-based user-friendly messages
    const statusMessages: Record<number, string> = {
      400: "Invalid request. Please check your input.",
      401: "Please sign in to continue.",
      403: "You don't have permission to do this.",
      404: "The requested resource was not found.",
      500: "Something went wrong. Please try again later.",
    };

    // Try to parse as JSON and extract user-friendly message
    let message = statusMessages[res.status] || "Something went wrong. Please try again.";
    try {
      const json = JSON.parse(text);
      // Backend returns { error: "code", message: "user friendly message" }
      if (json.message) {
        message = json.message;
      } else if (json.error && typeof json.error === "string" && json.error !== "internal_error") {
        // Only use error code if it's not a generic internal error
        message = json.error;
      }
    } catch {
      // JSON parsing failed, use status-based message
    }

    throw new Error(message);
  }

  return (await res.json()) as T;
}

// Note: authToken parameters are kept for backwards compatibility but ignored
// Authentication is now handled automatically by the proxy via Better Auth cookies

export async function apiGet<T>(path: string, _authToken?: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export async function apiPost<TRequest, TResponse>(
  path: string,
  body: TRequest,
  _authToken?: string
): Promise<TResponse> {
  return request<TResponse>(path, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

export async function apiPut<TRequest, TResponse>(
  path: string,
  body: TRequest,
  _authToken?: string
): Promise<TResponse> {
  return request<TResponse>(path, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

export async function apiDelete<T>(path: string, _authToken?: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}

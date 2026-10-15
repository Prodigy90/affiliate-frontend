/**
 * Create (or refresh) a signed-in user's affiliate record on the backend.
 *
 * Called from the Better Auth user.create hook, server to server. The hook
 * used to POST to /api/auth/sync-user on our own public origin, which went out
 * through Cloudflare and back. That route checked no credentials and passed the
 * backend's reply through, and the backend upserts by email and returns a
 * signed affiliate token, so anyone could POST an affiliate's email to it and
 * get a session as them. The route is gone; only this server-side call remains.
 */

const getBackendUrl = () => {
  const url = process.env.INTERNAL_API_URL;
  if (!url && process.env.NODE_ENV === "production") {
    throw new Error("INTERNAL_API_URL environment variable is required in production");
  }
  return (url || "http://localhost:8080/api/v1").replace(/\/+$/, "");
};

// One retry, only for a request that never got an HTTP answer. The backend
// upserts by email, so repeating it after a lost response is safe.
const NETWORK_ATTEMPTS = 2;
const RETRY_DELAY_MS = 500;

export async function syncAffiliateToBackend(user: {
  id: string;
  email: string;
  name?: string | null;
}): Promise<{ ok: boolean; status: number }> {
  const body = JSON.stringify({
    user_id: user.id,
    email: user.email,
    name: user.name || user.email.split("@")[0],
  });

  for (let attempt = 1; attempt <= NETWORK_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(`${getBackendUrl()}/auth/signup-external`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-API-Key": process.env.INTERNAL_API_KEY || "",
        },
        body,
      });
      return { ok: response.ok, status: response.status };
    } catch {
      if (attempt < NETWORK_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }
  return { ok: false, status: 503 };
}

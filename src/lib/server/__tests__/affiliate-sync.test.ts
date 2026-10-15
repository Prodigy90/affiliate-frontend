import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { syncAffiliateToBackend } from "../affiliate-sync";

const originalFetch = global.fetch;

beforeEach(() => {
  vi.stubEnv("INTERNAL_API_URL", "http://affiliate-system:8082/api/v1");
  vi.stubEnv("INTERNAL_API_KEY", "test-key");
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.unstubAllEnvs();
});

describe("syncAffiliateToBackend", () => {
  it("calls the backend directly with the internal key", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 201 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await syncAffiliateToBackend({ id: "u1", email: "a@example.com", name: null });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("http://affiliate-system:8082/api/v1/auth/signup-external");
    expect((init as RequestInit).headers).toMatchObject({ "X-Internal-API-Key": "test-key" });
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ user_id: "u1", email: "a@example.com", name: "a" });
    expect(result).toEqual({ ok: true, status: 201 });
  });

  it("retries once when the request never got an answer", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(new Response("{}", { status: 201 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    expect(await syncAffiliateToBackend({ id: "u1", email: "a@example.com" })).toEqual({ ok: true, status: 201 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry an HTTP error", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("no", { status: 401 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    expect(await syncAffiliateToBackend({ id: "u1", email: "a@example.com" })).toEqual({ ok: false, status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

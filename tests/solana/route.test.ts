import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { OWNER, rpcResponse } from "./fixtures";

let post: typeof import("@/app/api/solana/snapshot/route").POST;
const fetchMock = vi.fn<typeof fetch>();
let ip = 0;
function request(body: unknown = { owner: OWNER }, headers: Record<string, string> = {}, raw = false) {
  return new Request("http://localhost:3000/api/solana/snapshot", {
    method: "POST", headers: { "Content-Type": "application/json", "x-real-ip": `test-${++ip}`, ...headers },
    body: raw ? body as string : JSON.stringify(body)
  });
}
beforeEach(async () => {
  vi.resetModules();
  post = (await import("@/app/api/solana/snapshot/route")).POST;
  vi.stubEnv("SOLANA_RPC_URL", "https://rpc.example.test?secret=NEVER_RETURN_ME");
  vi.stubEnv("AFTERBILLS_NETWORK", "devnet");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset().mockImplementation(async () => rpcResponse());
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("POST /api/solana/snapshot", () => {
  it.each<Record<string, string>>([{}, { Origin: "http://localhost:3000" }])("accepts same-origin and originless CLI reads: %j", async headers => {
    const response = await post(request({ owner: OWNER, minContextSlot: 123 }, headers));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ owner: OWNER, totalBalanceUnits: "0", slot: 123 });
  });

  it.each(["https://evil.test", "null", "http://localhost:3001", "http://localhost:3000.evil.test", ""])("rejects foreign Origin %s", async Origin => {
    const response = await post(request(undefined, { Origin }));
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: "FORBIDDEN_ORIGIN" } });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    {}, null, [], { owner: "bad" }, { owner: "1".repeat(33) }, { owner: OWNER, minContextSlot: -1 },
    { owner: OWNER, minContextSlot: 1.1 }, { owner: OWNER, minContextSlot: Number.MAX_SAFE_INTEGER + 1 },
    { owner: OWNER, minContextSlot: "123" }, { owner: OWNER, minContextSlot: null },
    { owner: OWNER, rpcUrl: "https://evil.test" }, { owner: OWNER, method: "sendTransaction" },
    { owner: OWNER, network: "mainnet-beta" }, { owner: OWNER, mint: OWNER }, { owner: OWNER, clientLabel: "private" }
  ])("rejects invalid or extra request fields %#", async body => {
    const response = await post(request(body));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "INVALID_REQUEST" } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["", "{", "not JSON"])("rejects malformed JSON %#", async body => {
    const response = await post(request(body, {}, true));
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects wrong content type", async () => {
    const response = await post(request(undefined, { "Content-Type": "text/plain" }));
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("enforces declared and actual byte limits independently", async () => {
    expect((await post(request(undefined, { "Content-Length": "2049" }))).status).toBe(413);
    expect((await post(request({ owner: OWNER, padding: "x".repeat(2048) }))).status).toBe(413);
    expect((await post(request({ owner: OWNER, padding: "é".repeat(1024) }))).status).toBe(413);
    expect((await post(request({ owner: OWNER, padding: "x".repeat(2048) }, { "Content-Length": "1" }))).status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("enforces the limit on streamed bodies without Content-Length", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("x".repeat(1024)));
        controller.enqueue(encoder.encode("x".repeat(1025)));
        controller.close();
      }
    });
    const init: RequestInit & { duplex: "half" } = {
      method: "POST", body: stream, duplex: "half", headers: { "Content-Type": "application/json" }
    };
    expect((await post(new Request("http://localhost:3000/api/solana/snapshot", init))).status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a valid body at exactly the byte limit", async () => {
    const base = JSON.stringify({ owner: OWNER });
    const response = await post(request(base + " ".repeat(2048 - base.length), {}, true));
    expect(response.status).toBe(200);
  });

  it("returns structured sanitized upstream errors, never credentials or upstream body", async () => {
    fetchMock.mockResolvedValue(new Response("NEVER_RETURN_ME", { status: 403 }));
    const response = await post(request());
    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.text();
    expect(body).not.toContain("NEVER_RETURN_ME");
    expect(body).not.toContain("rpc.example");
    expect(JSON.parse(body)).toEqual({ error: {
      code: "RPC_UNAVAILABLE", message: "The devnet balance could not be read. Its value is unknown."
    } });
  });

  it("surfaces upstream rate limiting safely without premature retries", async () => {
    fetchMock.mockResolvedValue(new Response("secret", { status: 429, headers: { "Retry-After": "100" } }));
    const response = await post(request());
    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ error: { code: "RPC_RATE_LIMITED" } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("bounds reads to 30 per minute per IP and resets the window", async () => {
    vi.useFakeTimers();
    const headers = { "x-real-ip": "same-ip" };
    for (let i = 0; i < 30; i++) expect((await post(request(undefined, headers))).status).toBe(200);
    const limited = await post(request(undefined, headers));
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBe("60");
    expect(limited.headers.get("cache-control")).toBe("no-store");
    expect(await limited.json()).toMatchObject({ error: { code: "RATE_LIMITED" } });
    expect(fetchMock).toHaveBeenCalledTimes(30);
    expect((await post(request())).status).toBe(200);
    await vi.advanceTimersByTimeAsync(60_000);
    expect((await post(request(undefined, headers))).status).toBe(200);
  });

  it("uses the first forwarded IP and a shared fallback for missing IP metadata", async () => {
    for (let i = 0; i < 30; i++) {
      expect((await post(request(undefined, { "x-forwarded-for": "client, proxy" }))).status).toBe(200);
    }
    expect((await post(request(undefined, { "x-forwarded-for": "client, other-proxy" }))).status).toBe(429);
    const init = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ owner: OWNER }) };
    for (let i = 0; i < 30; i++) expect((await post(new Request("http://localhost:3000/api/solana/snapshot", init))).status).toBe(200);
    expect((await post(new Request("http://localhost:3000/api/solana/snapshot", init))).status).toBe(429);
  });

  it("bounds the IP map and fails closed rather than evicting active limits", async () => {
    for (let i = 0; i < 1000; i++) {
      // Invalid bodies consume limiter slots but make no RPC call.
      expect((await post(request({ owner: "bad" }))).status).toBe(400);
    }
    expect((await post(request())).status).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("limits the entire request including a stalled body to ten seconds", async () => {
    vi.useFakeTimers();
    const init: RequestInit & { duplex: "half" } = {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: new ReadableStream(), duplex: "half"
    };
    const result = post(new Request("http://localhost:3000/api/solana/snapshot", init));
    await vi.advanceTimersByTimeAsync(10_000);
    const response = await result;
    expect(response.status).toBe(504);
    expect(await response.json()).toMatchObject({ error: { code: "TIMEOUT" } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves route deadline as TIMEOUT during RPC, not a cancelled read", async () => {
    vi.useFakeTimers();
    fetchMock.mockReturnValue(new Promise(() => {}));
    const result = post(request());
    await vi.advanceTimersByTimeAsync(10_000);
    const response = await result;
    expect(response.status).toBe(504);
    expect(await response.json()).toMatchObject({ error: { code: "TIMEOUT" } });
  });

  it("cancels an obsolete client request during RPC", async () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const controller = new AbortController();
    const req = new Request(request(), { signal: controller.signal });
    const result = post(req);
    // Allow body parsing to finish and enter the mocked fetch.
    for (let i = 0; i < 10 && !fetchMock.mock.calls.length; i++) await Promise.resolve();
    controller.abort();
    const response = await result;
    expect(response.status).toBe(499);
    expect(await response.json()).toMatchObject({ error: { code: "ABORTED" } });
  });
});

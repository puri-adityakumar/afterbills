import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { ASSET } from "@/contracts/asset";
import { readSnapshot } from "@/server/solana/snapshot";
import { OWNER, OTHER, PROGRAM, rpcPayload, rpcResponse, tokenAccount, type AccountOptions } from "./fixtures";

const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("AFTERBILLS_NETWORK", "devnet");
  vi.stubEnv("SOLANA_RPC_URL", "https://rpc.example.test/devnet?api-key=NEVER_RETURN_ME");
  fetchMock.mockReset();
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("readSnapshot finalized read-only contract", () => {
  it("sums all accounts exactly, excludes frozen units, detects delegation and ignores UI floats", async () => {
    fetchMock.mockResolvedValue(rpcResponse([
      tokenAccount({ amount: "9007199254740993" }),
      tokenAccount({ pubkey: PROGRAM, amount: "7", state: "frozen" }),
      tokenAccount({ pubkey: ASSET.mint, amount: "11", delegate: OTHER, delegatedAmount: { amount: "1", decimals: 6 } })
    ], 321));
    const snapshot = await readSnapshot(OWNER, undefined, 320);
    expect(snapshot).toEqual({
      owner: OWNER, network: "devnet", mint: ASSET.mint, decimals: 6,
      usableBalanceUnits: "9007199254741004", totalBalanceUnits: "9007199254741011",
      frozenUnits: "7", delegatedWarning: true, slot: 321, observedAt: expect.any(String)
    });
    expect(Number.isNaN(Date.parse(snapshot.observedAt))).toBe(false);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://rpc.example.test/devnet?api-key=NEVER_RETURN_ME");
    expect(init).toMatchObject({ method: "POST", cache: "no-store", redirect: "error", credentials: "omit" });
    expect(JSON.parse(init?.body as string)).toEqual({
      jsonrpc: "2.0", id: 1, method: "getTokenAccountsByOwner",
      params: [OWNER, { mint: ASSET.mint }, { encoding: "jsonParsed", commitment: "finalized", minContextSlot: 320 }]
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("successful empty response is a true zero, not an unknown error", async () => {
    fetchMock.mockResolvedValue(rpcResponse());
    expect(await readSnapshot(OWNER)).toMatchObject({
      usableBalanceUnits: "0", totalBalanceUnits: "0", frozenUnits: "0", delegatedWarning: false
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string).params[2]).not.toHaveProperty("minContextSlot");
  });

  it("accepts the largest safe slot and u64 raw token value", async () => {
    fetchMock.mockResolvedValue(rpcResponse([tokenAccount({ amount: "18446744073709551615" })], Number.MAX_SAFE_INTEGER));
    expect(await readSnapshot(OWNER, undefined, Number.MAX_SAFE_INTEGER)).toMatchObject({ usableBalanceUnits: "18446744073709551615" });
  });

  it("frozen-only and zero-delegation snapshots remain valid", async () => {
    fetchMock.mockResolvedValue(rpcResponse([tokenAccount({
      state: "frozen", amount: "10", delegate: OTHER, delegatedAmount: { amount: "0", decimals: 6 }
    })]));
    expect(await readSnapshot(OWNER)).toMatchObject({ usableBalanceUnits: "0", frozenUnits: "10", delegatedWarning: false });
  });

  const invalidAccounts: [string, AccountOptions][] = [
    ["wrong owner", { owner: OTHER }], ["wrong mint", { mint: OTHER }], ["wrong decimals", { decimals: 9 }],
    ["wrong owning program", { program: OTHER }], ["wrong parser program", { dataProgram: "spl-token-2022" }],
    ["wrong parsed type", { type: "mint" }], ["uninitialized", { state: "uninitialized" }],
    ["unknown state", { state: "active" }], ["negative amount", { amount: "-1" }], ["decimal amount", { amount: "1.2" }],
    ["scientific amount", { amount: "1e6" }], ["noncanonical amount", { amount: "01" }],
    ["u64 overflow", { amount: "18446744073709551616" }], ["huge raw string", { amount: "9".repeat(1000) }],
    ["malformed account identity", { pubkey: "0".repeat(32) }], ["wrong decoded identity length", { pubkey: "1".repeat(33) }],
    ["executable account", { executable: true }], ["missing delegated amount", { delegate: OTHER }],
    ["delegation without delegate", { delegatedAmount: { amount: "1", decimals: 6 } }],
    ["bad delegate address", { delegate: "bad", delegatedAmount: { amount: "1", decimals: 6 } }],
    ["bad delegated decimals", { delegate: OTHER, delegatedAmount: { amount: "1", decimals: 9 } }],
    ["bad delegated raw amount", { delegate: OTHER, delegatedAmount: { amount: "-1", decimals: 6 } }]
  ];
  it.each(invalidAccounts)("fails unknown, never zero, for %s", async (_, options) => {
    fetchMock.mockResolvedValue(rpcResponse([tokenAccount(options)]));
    await expect(readSnapshot(OWNER)).rejects.toMatchObject({ code: "INVALID_RPC_RESPONSE", status: 502 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects duplicate token account identities rather than counting twice", async () => {
    fetchMock.mockResolvedValue(rpcResponse([tokenAccount(), tokenAccount()]));
    await expect(readSnapshot(OWNER)).rejects.toMatchObject({ code: "INVALID_RPC_RESPONSE" });
  });

  it.each([
    null, [], {}, { jsonrpc: "1.0", id: 1, result: rpcPayload().result },
    { jsonrpc: "2.0", id: 2, result: rpcPayload().result },
    { ...rpcPayload(), error: { code: -1, message: "NEVER_RETURN_ME" } },
    { jsonrpc: "2.0", id: 1, error: { code: -1, message: "NEVER_RETURN_ME" } },
    rpcPayload([], -1), rpcPayload([], 1.5), rpcPayload([], Number.MAX_SAFE_INTEGER + 1),
    { ...rpcPayload(), result: { context: { slot: "123" }, value: [] } },
    { ...rpcPayload(), result: { context: { slot: 123 }, value: null } },
    rpcPayload([{}]), rpcPayload([{ pubkey: OTHER, account: {} }])
  ])("rejects malformed JSON-RPC payload %#", async payload => {
    fetchMock.mockResolvedValue(Response.json(payload));
    await expect(readSnapshot(OWNER)).rejects.toMatchObject({ code: "INVALID_RPC_RESPONSE", status: 502 });
  });

  it("rejects invalid JSON and oversized successful RPC bodies", async () => {
    fetchMock.mockResolvedValueOnce(new Response("not JSON"));
    await expect(readSnapshot(OWNER)).rejects.toMatchObject({ code: "INVALID_RPC_RESPONSE" });
    fetchMock.mockResolvedValueOnce(new Response("x".repeat(2 * 1024 * 1024 + 1)));
    await expect(readSnapshot(OWNER)).rejects.toMatchObject({ code: "INVALID_RPC_RESPONSE" });
  });

  it("rejects a stale minContextSlot response", async () => {
    fetchMock.mockResolvedValue(rpcResponse([], 122));
    await expect(readSnapshot(OWNER, undefined, 123)).rejects.toMatchObject({ code: "STALE_CONTEXT" });
  });

  it.each(["bad", "0".repeat(32), "1".repeat(33), " " + OWNER, OWNER + " "])("validates actual address bytes before RPC: %s", async owner => {
    await expect(readSnapshot(owner)).rejects.toMatchObject({ code: "INVALID_REQUEST" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([-1, 0.1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])("rejects invalid slot %s before RPC", async slot => {
    await expect(readSnapshot(OWNER, undefined, slot)).rejects.toMatchObject({ code: "INVALID_REQUEST" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("defaults to the public devnet endpoint only when unset", async () => {
    vi.stubEnv("SOLANA_RPC_URL", undefined);
    vi.stubEnv("AFTERBILLS_NETWORK", undefined);
    fetchMock.mockResolvedValue(rpcResponse());
    await readSnapshot(OWNER);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.devnet.solana.com/");
  });

  it.each(["mainnet-beta", "testnet", ""])("fails closed for network %s", async network => {
    vi.stubEnv("AFTERBILLS_NETWORK", network);
    await expect(readSnapshot(OWNER)).rejects.toMatchObject({ code: "CONFIGURATION_ERROR" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["file:///etc/passwd", "not-a-url", "https://user:password@example.test", "https://example.test/#fragment"])("fails safely for invalid server endpoint %s", async url => {
    vi.stubEnv("SOLANA_RPC_URL", url);
    await expect(readSnapshot(OWNER)).rejects.toMatchObject({ code: "CONFIGURATION_ERROR" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("bounded transport and retry behavior", () => {
  it("honors 429 Retry-After seconds and uses at most two attempts", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValueOnce(new Response("secret", { status: 429, headers: { "Retry-After": "1" } }))
      .mockResolvedValueOnce(rpcResponse());
    const result = readSnapshot(OWNER);
    await vi.advanceTimersByTimeAsync(999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect((await result).totalBalanceUnits).toBe("0");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("honors Retry-After HTTP dates", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-01T00:00:00Z"));
    fetchMock.mockResolvedValueOnce(new Response("", {
      status: 429, headers: { "Retry-After": "Sun, 01 Nov 2026 00:00:02 GMT" }
    })).mockResolvedValueOnce(rpcResponse());
    const result = readSnapshot(OWNER);
    await vi.advanceTimersByTimeAsync(1999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await result;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry earlier than an unbounded Retry-After; returns safe rate error", async () => {
    fetchMock.mockResolvedValue(new Response("NEVER_RETURN_ME", { status: 429, headers: { "Retry-After": "100" } }));
    await expect(readSnapshot(OWNER)).rejects.toMatchObject({ code: "RPC_RATE_LIMITED", status: 429 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stops after two 429s and never returns the provider error body", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(async () => new Response("NEVER_RETURN_ME", { status: 429, headers: { "Retry-After": "0" } }));
    const result = expect(readSnapshot(OWNER)).rejects.toMatchObject({ code: "RPC_RATE_LIMITED", status: 429 });
    await vi.runAllTimersAsync();
    await result;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries one transient failure but never more than two attempts", async () => {
    vi.useFakeTimers();
    fetchMock.mockRejectedValue(new Error("https://rpc.example.test?api-key=NEVER_RETURN_ME"));
    const result = expect(readSnapshot(OWNER)).rejects.toMatchObject({
      code: "RPC_UNAVAILABLE", message: "The devnet balance could not be read. Its value is unknown."
    });
    await vi.runAllTimersAsync();
    await result;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries a transient HTTP 503", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValueOnce(new Response("private", { status: 503 })).mockResolvedValueOnce(rpcResponse());
    const result = readSnapshot(OWNER);
    await vi.advanceTimersByTimeAsync(250);
    await result;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry nontransient HTTP failures or expose their body", async () => {
    fetchMock.mockResolvedValue(new Response("NEVER_RETURN_ME", { status: 403 }));
    await expect(readSnapshot(OWNER)).rejects.toMatchObject({ code: "RPC_UNAVAILABLE", status: 502 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("bounds a fetch ignoring AbortSignal to ten seconds", async () => {
    vi.useFakeTimers();
    fetchMock.mockReturnValue(new Promise(() => {}));
    const result = expect(readSnapshot(OWNER)).rejects.toMatchObject({ code: "TIMEOUT", status: 504 });
    await vi.advanceTimersByTimeAsync(10_000);
    await result;
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });

  it("bounds a successful response with a stalled body", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(new Response(new ReadableStream()));
    const result = expect(readSnapshot(OWNER)).rejects.toMatchObject({ code: "TIMEOUT", status: 504 });
    await vi.advanceTimersByTimeAsync(10_000);
    await result;
  });

  it("uses one ten-second budget across retry wait and the second fetch", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValueOnce(new Response("", { status: 429, headers: { "Retry-After": "9" } }))
      .mockReturnValueOnce(new Promise(() => {}));
    const result = expect(readSnapshot(OWNER)).rejects.toMatchObject({ code: "TIMEOUT" });
    await vi.advanceTimersByTimeAsync(10_000);
    await result;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("supports cancellation before fetch and while fetching", async () => {
    const already = new AbortController();
    already.abort(new Error("NEVER_RETURN_ME"));
    await expect(readSnapshot(OWNER, already.signal)).rejects.toMatchObject({ code: "ABORTED", status: 499 });
    expect(fetchMock).not.toHaveBeenCalled();
    const controller = new AbortController();
    fetchMock.mockReturnValue(new Promise(() => {}));
    const result = readSnapshot(OWNER, controller.signal);
    controller.abort();
    await expect(result).rejects.toMatchObject({ code: "ABORTED" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

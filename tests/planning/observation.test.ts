import { afterEach, describe, expect, it, vi } from "vitest";
import { ASSET, liveProfileKey } from "@/contracts/asset";
import type { Observation, WalletSnapshot } from "@/contracts/model";
import { acceptSnapshot, ageObservation, fetchSnapshot, validOwner, validateSnapshot } from "@/state/observation";

const owner = "11111111111111111111111111111111";
const profileKey = liveProfileKey(owner);
const snapshot: WalletSnapshot = {
  owner, network: "devnet", mint: ASSET.mint, decimals: 6,
  usableBalanceUnits: "100", totalBalanceUnits: "120", frozenUnits: "20",
  slot: 100, observedAt: "2026-11-01T00:00:00Z", delegatedWarning: false
};
afterEach(() => vi.unstubAllGlobals());
describe("read-only browser observations", () => {
  it("validates actual base58 address encoding", () => {
    expect(validOwner(owner)).toBe(true);
    expect(validOwner("0".repeat(32))).toBe(false);
    expect(validOwner("never enter a seed phrase")).toBe(false);
  });
  it("accepts exact snapshots and true zero", () => {
    expect(validateSnapshot(snapshot, owner)).toEqual(snapshot);
    expect(validateSnapshot({ ...snapshot, usableBalanceUnits: "0", totalBalanceUnits: "0", frozenUnits: "0" }, owner).usableBalanceUnits).toBe("0");
  });
  it.each([
    { owner: "different" }, { mint: owner }, { decimals: 9 }, { usableBalanceUnits: "-1" },
    { totalBalanceUnits: "999" }, { slot: 1.5 }, { observedAt: "not a date" },
    { delegatedWarning: "false" }, { network: "mainnet" }
  ])("rejects mismatched or malformed snapshots", patch => {
    expect(() => validateSnapshot({ ...snapshot, ...patch }, owner)).toThrow();
  });
  it("marks snapshots stale at 60 seconds, not before", () => {
    const observation: Observation = { status: "fresh", lastSuccess: snapshot, requestKey: profileKey };
    expect(ageObservation(observation, Date.parse(snapshot.observedAt) + 59_999)).toBe(observation);
    expect(ageObservation(observation, Date.parse(snapshot.observedAt) + 60_000).status).toBe("stale");
  });
  it("ignores cross-profile responses and regressing slots", () => {
    const observation: Observation = { status: "loading", lastSuccess: snapshot, requestKey: profileKey };
    expect(acceptSnapshot(observation, snapshot, "other-profile")).toBe(observation);
    const older = acceptSnapshot(observation, { ...snapshot, slot: 99 }, profileKey);
    expect(older.lastSuccess?.slot).toBe(100);
    expect(older.status).toBe("stale");
    expect(acceptSnapshot(observation, { ...snapshot, slot: 101 }, profileKey).status).toBe("fresh");
  });
  it("sends only the public address and optional slot to the server", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(snapshot), { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    const controller = new AbortController();
    await expect(fetchSnapshot(owner, controller.signal, 100)).resolves.toEqual(snapshot);
    expect(fetch).toHaveBeenCalledWith("/api/solana/snapshot", expect.objectContaining({
      method: "POST", body: JSON.stringify({ owner, minContextSlot: 100 }), signal: controller.signal
    }));
  });
  it.each([429, 502, 504])("does not turn HTTP failures into a zero balance", async status => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("secret upstream message", { status })));
    await expect(fetchSnapshot(owner, new AbortController().signal)).rejects.toThrow();
    await expect(fetchSnapshot(owner, new AbortController().signal)).rejects.not.toThrow("secret upstream message");
  });
});

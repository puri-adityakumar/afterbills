import { describe, expect, it } from "vitest";
import { SAMPLE_PROFILE_KEY, liveProfileKey } from "@/contracts/asset";
import { createSamplePlan } from "@/fixtures/sample";
import {
  clearPlan, createLivePlan, loadPlan, reanchorPlan, savePlan, storageKey,
  validatePlan, validTimezone, type StoragePort
} from "@/state/profile-store";

function memoryStorage(): StoragePort {
  const data = new Map<string, string>();
  return {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value); },
    removeItem: key => { data.delete(key); }
  };
}
const owner = "11111111111111111111111111111111";
const now = new Date("2026-11-01T00:00:00.000Z");

describe("local profile storage", () => {
  it("round-trips exact amounts and labels without converting units", () => {
    const storage = memoryStorage();
    const plan = createSamplePlan();
    plan.reserveUnits = "9007199254740993000001";
    expect(savePlan(plan, storage)).toBe(true);
    expect(loadPlan(SAMPLE_PROFILE_KEY, storage)).toEqual({ plan, status: "ok" });
  });
  it("isolates sample and different live owners", () => {
    const storage = memoryStorage();
    const sample = createSamplePlan();
    const live = createLivePlan(owner, "UTC", now);
    live.bills = [{ id: "private", title: "Private bill", amountUnits: "100", dueDate: "2026-11-03" }];
    savePlan(sample, storage);
    savePlan(live, storage);
    expect(loadPlan(SAMPLE_PROFILE_KEY, storage).plan?.bills[0].title).toBe("Studio rent");
    expect(loadPlan(liveProfileKey(owner), storage).plan?.bills[0].title).toBe("Private bill");
    expect(loadPlan(liveProfileKey("another-owner"), storage).status).toBe("empty");
    clearPlan(SAMPLE_PROFILE_KEY, storage);
    expect(loadPlan(SAMPLE_PROFILE_KEY, storage).status).toBe("empty");
    expect(loadPlan(live.profileKey, storage).plan).toEqual(live);
  });
  it("preserves corrupt original data until explicitly cleared", () => {
    const storage = memoryStorage();
    storage.setItem(storageKey(SAMPLE_PROFILE_KEY), "{not json");
    expect(loadPlan(SAMPLE_PROFILE_KEY, storage).status).toBe("corrupt");
    expect(storage.getItem(storageKey(SAMPLE_PROFILE_KEY))).toBe("{not json");
    clearPlan(SAMPLE_PROFILE_KEY, storage);
    expect(storage.getItem(storageKey(SAMPLE_PROFILE_KEY))).toBeNull();
  });
  it("reports unavailable storage rather than claiming persistence", () => {
    const broken: StoragePort = {
      getItem() { throw new Error("blocked"); },
      setItem() { throw new Error("full"); },
      removeItem() { throw new Error("blocked"); }
    };
    expect(loadPlan(SAMPLE_PROFILE_KEY, broken).status).toBe("unavailable");
    expect(savePlan(createSamplePlan(), broken)).toBe(false);
    expect(clearPlan(SAMPLE_PROFILE_KEY, broken)).toBe(false);
    expect(loadPlan(SAMPLE_PROFILE_KEY).status).toBe("unavailable");
    expect(savePlan(createSamplePlan())).toBe(false);
  });
  it("rejects cross-profile data", () => {
    expect(() => validatePlan(createSamplePlan(), liveProfileKey(owner))).toThrow();
  });
  it.each([
    (p: ReturnType<typeof createSamplePlan>) => ({ ...p, reserveUnits: "-1" }),
    (p: ReturnType<typeof createSamplePlan>) => ({ ...p, reserveUnits: "1e6" }),
    (p: ReturnType<typeof createSamplePlan>) => ({ ...p, version: 2 }),
    (p: ReturnType<typeof createSamplePlan>) => ({ ...p, window: { ...p.window, timezone: "Mars/Example" } }),
    (p: ReturnType<typeof createSamplePlan>) => ({ ...p, window: { ...p.window, endDateExclusive: "2026-11-14" } }),
    (p: ReturnType<typeof createSamplePlan>) => ({ ...p, bills: [...p.bills, p.bills[0]] }),
    (p: ReturnType<typeof createSamplePlan>) => ({ ...p, bills: [{ ...p.bills[0], amountUnits: "0" }] }),
    (p: ReturnType<typeof createSamplePlan>) => ({ ...p, invoices: [{ ...p.invoices[0], status: "paid" }] })
  ])("rejects invalid persisted schemas", mutate => {
    expect(() => validatePlan(mutate(createSamplePlan()), SAMPLE_PROFILE_KEY)).toThrow();
  });
  it("rolls live dates on reload and midnight, keeping listed commitments", () => {
    const plan = createLivePlan(owner, "America/New_York", new Date("2026-10-31T22:00:00Z"));
    plan.bills = [{ id: "b", title: "Bill", amountUnits: "1", dueDate: "2026-10-30" }];
    const next = reanchorPlan(plan, new Date("2026-11-02T06:00:00Z"));
    expect(next.window.startDate).toBe("2026-11-02");
    expect(next.window.endDateExclusive).toBe("2026-11-16");
    expect(next.bills).toEqual(plan.bills);
    expect(reanchorPlan(next, new Date("2026-11-02T07:00:00Z"))).toBe(next);
  });
  it("reanchors timezone changes, while samples keep reference dates", () => {
    const live = createLivePlan(owner, "UTC", new Date("2026-11-01T23:00:00Z"));
    expect(reanchorPlan(live, new Date("2026-11-01T23:00:00Z"), "Asia/Kolkata").window.startDate).toBe("2026-11-02");
    const sample = createSamplePlan();
    expect(reanchorPlan(sample, new Date("2027-01-01T00:00:00Z"))).toBe(sample);
    expect(reanchorPlan(sample, now, "UTC").window.startDate).toBe("2026-11-01");
  });
  it("validates IANA timezone identifiers", () => {
    expect(validTimezone("UTC")).toBe(true);
    expect(validTimezone("Asia/Kolkata")).toBe(true);
    expect(validTimezone("nonsense")).toBe(false);
  });
});

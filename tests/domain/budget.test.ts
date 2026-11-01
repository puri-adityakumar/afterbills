import { describe, expect, it } from "vitest";
import type { BudgetResult, Plan } from "@/contracts/model";
import { calculateBudget, formatMoney, parseUnits, previewPurchase, validatePlan } from "@/domain";
import { createSamplePlan, SAMPLE_BALANCE_UNITS } from "@/fixtures/sample";

describe("funded budget and purchase preview", () => {
  it("reproduces the canonical base without counting unpaid income", () => {
    const plan = createSamplePlan();
    const budget = calculateBudget(plan, SAMPLE_BALANCE_UNITS);
    expect(budget).toMatchObject({
      signedNetUnits: parseUnits("280"), availableUnits: parseUnits("280"), shortfallUnits: 0n,
      includedBillsUnits: parseUnits("770"), dailyPaceCents: 2000n,
      includedBillIds: ["rent", "software"], excludedBillIds: [],
    });
    plan.invoices = [];
    expect(calculateBudget(plan, SAMPLE_BALANCE_UNITS)).toEqual(budget);
  });
  it("previews 180 leaving 100 and 7.14/day, without mutating the baseline", () => {
    const plan = createSamplePlan();
    const original = structuredClone(plan);
    const budget = calculateBudget(plan, SAMPLE_BALANCE_UNITS);
    const before = structuredClone(budget);
    expect(previewPurchase(budget, parseUnits("180"), 14)).toEqual({
      purchaseUnits: parseUnits("180"), baselineNetUnits: parseUnits("280"),
      resultingNetUnits: parseUnits("100"), shortfallUnits: 0n, dailyPaceCents: 714n,
    });
    expect(previewPurchase(budget, 0n, 14).resultingNetUnits).toBe(parseUnits("280"));
    expect(budget).toEqual(before);
    expect(plan).toEqual(original);
  });
  it("returns canonical deficit 370 without a daily allowance", () => {
    const plan = createSamplePlan();
    plan.bills[0].amountUnits = parseUnits("1300").toString();
    const result = calculateBudget(plan, SAMPLE_BALANCE_UNITS);
    expect(result.signedNetUnits).toBe(parseUnits("370") * -1n);
    expect(result.shortfallUnits).toBe(parseUnits("370"));
    expect(result.availableUnits).toBe(0n);
    expect(result).not.toHaveProperty("dailyPaceCents");
    expect(previewPurchase(result, 1n, 14).shortfallUnits).toBe(parseUnits("370") + 1n);
  });
  it("uses a refreshed balance exactly once after a manual receipt", () => {
    const plan = createSamplePlan();
    plan.invoices[0].status = "received_manual";
    const budget = calculateBudget(plan, parseUnits("2000"));
    expect(budget.signedNetUnits).toBe(parseUnits("1080"));
    expect(budget.dailyPaceCents).toBe(7714n);
  });
  it("includes overdue and Nov 14 bills but excludes the Nov 15 boundary", () => {
    const plan = createSamplePlan();
    plan.bills = [
      { id: "overdue", title: "Past", amountUnits: "1", dueDate: "2026-10-30" },
      { id: "last", title: "Last", amountUnits: "2", dueDate: "2026-11-14" },
      { id: "outside", title: "Next", amountUnits: "4", dueDate: "2026-11-15" },
    ];
    const budget = calculateBudget(plan, SAMPLE_BALANCE_UNITS);
    expect(budget.includedBillIds).toEqual(["overdue", "last"]);
    expect(budget.excludedBillIds).toEqual(["outside"]);
    expect(budget.includedBillsUnits).toBe(3n);
  });
  it("rounds fractional available and pace down but a one-unit deficit up", () => {
    const plan = createSamplePlan();
    plan.bills = [];
    plan.reserveUnits = "0";
    const positive = calculateBudget(plan, 149_999n);
    expect(formatMoney(positive.availableUnits)).toBe("0.14");
    expect(positive.dailyPaceCents).toBe(1n);
    plan.reserveUnits = "150000";
    const deficit = calculateBudget(plan, 149_999n);
    expect(deficit.shortfallUnits).toBe(1n);
    expect(formatMoney(deficit.shortfallUnits, "up")).toBe("0.01");
    expect(deficit).not.toHaveProperty("dailyPaceCents");
    const preview = previewPurchase(positive, 150_000n, 14);
    expect(preview.shortfallUnits).toBe(1n);
    expect(preview).not.toHaveProperty("dailyPaceCents");
  });
  it("distinguishes a valid zero from an unknown or negative balance", () => {
    const plan = createSamplePlan();
    plan.bills = [];
    plan.reserveUnits = "0";
    expect(calculateBudget(plan, 0n)).toMatchObject({ signedNetUnits: 0n, dailyPaceCents: 0n });
    for (const invalid of [-1n, undefined, null, 1200, "1200"]) {
      expect(() => calculateBudget(plan, invalid as bigint)).toThrow();
    }
  });
  it("preserves units above Number.MAX_SAFE_INTEGER", () => {
    const balance = 9_007_199_254_740_993_123_456n;
    const plan = createSamplePlan();
    const budget = calculateBudget(plan, balance);
    expect(budget.signedNetUnits).toBe(balance - 920_000_000n);
    expect(budget.dailyPaceCents).toBe((balance - 920_000_000n) / 140_000n);
    expect(previewPurchase(budget, balance, 14).shortfallUnits).toBe(920_000_000n);
  });
  it("deducts the global reserve once, regardless of bill count", () => {
    const plan = createSamplePlan();
    plan.bills = [];
    expect(calculateBudget(plan, SAMPLE_BALANCE_UNITS).signedNetUnits).toBe(parseUnits("1050"));
  });
  it.each([-1, 0, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])("rejects purchase day count %s", (dayCount) => {
    expect(() => previewPurchase(calculateBudget(createSamplePlan(), SAMPLE_BALANCE_UNITS), 0n, dayCount)).toThrow();
  });
  it("rejects invalid purchase and inconsistent budget invariants", () => {
    const budget = calculateBudget(createSamplePlan(), SAMPLE_BALANCE_UNITS);
    expect(() => previewPurchase(budget, -1n, 14)).toThrow();
    for (const patch of [
      { availableUnits: 1n }, { shortfallUnits: 1n }, { includedBillsUnits: -1n },
      { signedNetUnits: -1n }, { dailyPaceCents: -1n },
    ]) {
      expect(() => previewPurchase({ ...budget, ...patch } as BudgetResult, 0n, 14)).toThrow();
    }
  });
});

describe("persisted plan invariant validation", () => {
  const invalidPlans: Array<[string, (plan: Plan) => void]> = [
    ["wrong version", (p) => { (p as { version: number }).version = 2; }],
    ["empty profile", (p) => { p.profileKey = " "; }],
    ["invalid timestamp", (p) => { p.updatedAt = "invalid"; }],
    ["negative reserve", (p) => { p.reserveUnits = "-1"; }],
    ["decimal raw units", (p) => { p.reserveUnits = "1.5"; }],
    ["zero bill", (p) => { p.bills[0].amountUnits = "0"; }],
    ["invalid bill date", (p) => { p.bills[0].dueDate = "2026-02-30"; }],
    ["missing bill title", (p) => { p.bills[0].title = ""; }],
    ["duplicate bill", (p) => { p.bills.push({ ...p.bills[0] }); }],
    ["zero invoice", (p) => { p.invoices[0].totalUnits = "0"; }],
    ["negative invoice", (p) => { p.invoices[0].totalUnits = "-1"; }],
    ["invalid invoice date", (p) => { p.invoices[0].expectedDate = "2026-02-30"; }],
    ["duplicate invoice", (p) => { p.invoices.push({ ...p.invoices[0] }); }],
    ["invalid status", (p) => { (p.invoices[0] as { status: string }).status = "paid"; }],
    ["empty client", (p) => { p.invoices[0].clientLabel = ""; }],
    ["wrong window length", (p) => { p.window.endDateExclusive = "2026-11-14"; }],
    ["wrong day count", (p) => { (p.window as { dayCount: number }).dayCount = 13; }],
    ["invalid timezone", (p) => { p.window.timezone = "Fake/Place"; }],
  ];
  it.each(invalidPlans)("rejects %s before accounting", (_, mutate) => {
    const plan = createSamplePlan();
    mutate(plan);
    expect(() => validatePlan(plan)).toThrow();
    expect(() => calculateBudget(plan, SAMPLE_BALANCE_UNITS)).toThrow();
  });
});

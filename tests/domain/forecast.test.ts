import { describe, expect, it } from "vitest";
import { buildForecast, calculateBudget, createWindow, parseUnits, readUnits } from "@/domain";
import { createSamplePlan, SAMPLE_BALANCE_UNITS } from "@/fixtures/sample";

describe("conditional end-of-day forecasts", () => {
  it("separates funded, expected and delayed paths over 14 exclusive-end dates", () => {
    const plan = createSamplePlan();
    const original = structuredClone(plan);
    const budget = calculateBudget(plan, SAMPLE_BALANCE_UNITS);
    const points = buildForecast(plan, SAMPLE_BALANCE_UNITS, 7);
    expect(points).toHaveLength(14);
    expect(points[0]).toMatchObject({
      date: "2026-11-01", fundedUnits: parseUnits("1200"),
      expectedUnits: parseUnits("1200"), delayedUnits: parseUnits("1200"),
    });
    expect(points[5]).toMatchObject({
      date: "2026-11-06", fundedUnits: parseUnits("1200"),
      expectedUnits: parseUnits("2000"), delayedUnits: parseUnits("1200"),
    });
    expect(points[7]).toMatchObject({
      date: "2026-11-08", fundedUnits: parseUnits("550"),
      expectedUnits: parseUnits("1350"), delayedUnits: parseUnits("550"),
    });
    expect(points[12]).toMatchObject({
      date: "2026-11-13", fundedUnits: parseUnits("430"),
      expectedUnits: parseUnits("1230"), delayedUnits: parseUnits("1230"),
    });
    expect(points[13].date).toBe("2026-11-14");
    expect(points[13].fundedUnits - readUnits(plan.reserveUnits)).toBe(budget.signedNetUnits);
    expect(calculateBudget(plan, SAMPLE_BALANCE_UNITS)).toEqual(budget);
    expect(plan).toEqual(original);
  });
  it("never adds received or cancelled invoices, including after balance refresh", () => {
    const plan = createSamplePlan();
    plan.invoices[0].status = "received_manual";
    plan.invoices.push({ ...plan.invoices[0], id: "cancelled", status: "cancelled" });
    const end = buildForecast(plan, parseUnits("2000"), 7).at(-1)!;
    expect(end.fundedUnits).toBe(parseUnits("1230"));
    expect(end.expectedUnits).toBe(end.fundedUnits);
    expect(end.delayedUnits).toBe(end.fundedUnits);
  });
  it("clamps overdue bills to start and subtracts each only once", () => {
    const plan = createSamplePlan();
    plan.bills = [{ id: "late", title: "Overdue", amountUnits: "100000000", dueDate: "2026-10-30" }];
    plan.invoices = [];
    const points = buildForecast(plan, SAMPLE_BALANCE_UNITS, 7);
    expect(points.every((point) => point.fundedUnits === parseUnits("1100"))).toBe(true);
  });
  it("applies delay to the original overdue invoice date, then clamps to start", () => {
    const plan = createSamplePlan();
    plan.bills = [];
    plan.invoices[0].expectedDate = "2026-10-20";
    expect(buildForecast(plan, SAMPLE_BALANCE_UNITS, 7)[0].delayedUnits).toBe(parseUnits("2000"));
    plan.invoices[0].expectedDate = "2026-10-30";
    const points = buildForecast(plan, SAMPLE_BALANCE_UNITS, 7);
    expect(points[0].expectedUnits).toBe(parseUnits("2000"));
    expect(points[0].delayedUnits).toBe(parseUnits("1200"));
    expect(points[5].delayedUnits).toBe(parseUnits("2000"));
  });
  it("excludes an invoice delayed to or beyond end; includes last-day base invoice", () => {
    const plan = createSamplePlan();
    plan.bills = [];
    plan.invoices[0].expectedDate = "2026-11-14";
    const end = buildForecast(plan, SAMPLE_BALANCE_UNITS, 1).at(-1)!;
    expect(end.expectedUnits).toBe(parseUnits("2000"));
    expect(end.delayedUnits).toBe(parseUnits("1200"));
    plan.invoices[0].expectedDate = "2026-11-15";
    expect(buildForecast(plan, SAMPLE_BALANCE_UNITS, 0).at(-1)!.expectedUnits).toBe(parseUnits("1200"));
  });
  it("excludes boundary bills while combining same-day commitments and invoices", () => {
    const plan = createSamplePlan();
    plan.bills = [
      { id: "a", title: "A", amountUnits: "10", dueDate: "2026-11-01" },
      { id: "b", title: "B", amountUnits: "20", dueDate: "2026-11-01" },
      { id: "end", title: "End", amountUnits: "100", dueDate: "2026-11-15" },
    ];
    plan.invoices = [
      { id: "a", clientLabel: "A", totalUnits: "5", expectedDate: "2026-11-01", status: "expected" },
      { id: "b", clientLabel: "B", totalUnits: "7", expectedDate: "2026-11-01", status: "expected" },
    ];
    const points = buildForecast(plan, 100n, 0);
    expect(points.every((p) => p.fundedUnits === 70n && p.expectedUnits === 82n && p.delayedUnits === 82n)).toBe(true);
  });
  it("uses reserve only as a strict threshold and allows negative funded cash", () => {
    const plan = createSamplePlan();
    plan.reserveUnits = "100";
    plan.bills = [{ id: "bill", title: "Bill", amountUnits: "101", dueDate: "2026-11-02" }];
    plan.invoices = [];
    const points = buildForecast(plan, 100n, 7);
    expect(points[0].fundedUnits).toBe(100n);
    expect(points[0].fundedBelowReserve).toBe(false);
    expect(points[1]).toMatchObject({
      fundedUnits: -1n, expectedUnits: -1n, delayedUnits: -1n,
      fundedBelowReserve: true, expectedBelowReserve: true, delayedBelowReserve: true,
    });
  });
  it("supports huge balances and delays without float money or overflowing calendar conversion", () => {
    const balance = 9_007_199_254_740_993_123_456n;
    const plan = createSamplePlan();
    const end = buildForecast(plan, balance, Number.MAX_SAFE_INTEGER).at(-1)!;
    expect(end.fundedUnits).toBe(balance - parseUnits("770"));
    expect(end.expectedUnits).toBe(balance + parseUnits("30"));
    expect(end.delayedUnits).toBe(end.fundedUnits);
  });
  it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])("rejects invalid delay %s", (delay) => {
    expect(() => buildForecast(createSamplePlan(), SAMPLE_BALANCE_UNITS, delay)).toThrow();
  });
  it("validates the plan and balance before forecasting", () => {
    const plan = createSamplePlan();
    expect(() => buildForecast(plan, -1n, 7)).toThrow();
    plan.invoices[0].totalUnits = "0";
    expect(() => buildForecast(plan, SAMPLE_BALANCE_UNITS, 7)).toThrow();
  });
  it("increments calendar days across spring and fall DST windows", () => {
    for (const timestamp of ["2026-03-02T12:00:00Z", "2026-10-26T12:00:00Z"]) {
      const plan = createSamplePlan();
      plan.window = createWindow("America/New_York", new Date(timestamp));
      plan.bills = [];
      plan.invoices = [];
      const points = buildForecast(plan, 0n, 7);
      expect(points).toHaveLength(14);
      expect(new Set(points.map((point) => point.date)).size).toBe(14);
      expect(points.every((point) => point.fundedUnits === 0n)).toBe(true);
    }
  });
});

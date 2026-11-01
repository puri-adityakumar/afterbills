import { describe, expect, it } from "vitest";
import { ASSET, liveProfileKey } from "@/contracts/asset";
import type { Observation } from "@/contracts/model";
import { createSamplePlan } from "@/fixtures/sample";
import { toDashboardModel } from "@/state/selectors";

const sample = (purchaseInput = "", purchaseOpen = false) => ({
  plan: createSamplePlan(), mode: "sample" as const,
  observation: { status: "idle", requestKey: "" } as Observation,
  purchaseInput, purchaseOpen, scenarioDelay: 0 as const
});
describe("single-source financial view model", () => {
  it("shows the canonical sample without treating invoices as funds", () => {
    const model = toDashboardModel(sample());
    expect(model.netLabel).toBe("280.00");
    expect(model.dailyLabel).toBe("20.00");
    expect(model.balanceLabel).toBe("1,200.00");
    expect(model.billsTotalLabel).toBe("770.00");
    expect(model.expectedTotalLabel).toBe("800.00");
  });
  it("preserves the baseline during purchase previews", () => {
    const model = toDashboardModel(sample("180", true));
    expect(model.netLabel).toBe("280.00");
    expect(model.purchase?.afterLabel).toBe("100.00");
    expect(model.purchase?.dailyLabel).toBe("7.14");
    expect(toDashboardModel(sample("9999", true)).purchase?.shortfall).toBe(true);
    expect(toDashboardModel(sample("1e5", true)).purchaseError).toBeTruthy();
  });
  it("separates real zero from an unknown balance", () => {
    const options = sample();
    const owner = "11111111111111111111111111111111";
    options.plan.profileKey = liveProfileKey(owner);
    const unknown = toDashboardModel({ ...options, mode: "live", owner });
    expect(unknown.netKind).toBe("unknown");
    expect(unknown.balanceLabel).toBe("Unavailable");
    const observation: Observation = {
      status: "fresh", requestKey: options.plan.profileKey,
      lastSuccess: {
        owner, network: "devnet", mint: ASSET.mint, decimals: 6,
        usableBalanceUnits: "0", totalBalanceUnits: "0", frozenUnits: "0",
        slot: 1, observedAt: "2026-11-01T00:00:00Z", delegatedWarning: false
      }
    };
    expect(toDashboardModel({ ...options, mode: "live", owner, observation }).netKind).toBe("shortfall");
  });
  it("shows rounded-up shortfalls without a positive pace", () => {
    const options = sample();
    options.plan.bills[0].amountUnits = "1300000000";
    const model = toDashboardModel(options);
    expect(model.netKind).toBe("shortfall");
    expect(model.netLabel).toBe("370.00");
    expect(model.dailyLabel).toBeNull();
  });
  it("changes the conditional outlook, not the funded answer", () => {
    const expected = toDashboardModel(sample());
    const delayed = toDashboardModel({ ...sample(), scenarioDelay: 7 });
    expect(delayed.netLabel).toBe(expected.netLabel);
    const paymentDay = delayed.forecastRows.find(row => row.date === "2026-11-06");
    expect(paymentDay?.expected).toBe("2,000.00");
    expect(paymentDay?.delayed).toBe("1,200.00");
  });
});

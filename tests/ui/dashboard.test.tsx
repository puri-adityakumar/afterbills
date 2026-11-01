// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dashboard } from "@/features/dashboard/dashboard";
import { Landing } from "@/features/dashboard/landing";
import type { DashboardActions, DashboardViewModel } from "@/contracts/view-model";

afterEach(cleanup);

function model(overrides: Partial<DashboardViewModel> = {}): DashboardViewModel {
  return {
    mode: "sample", windowLabel: "Nov 1–14, 2026", timezone: "Asia/Kolkata",
    observationLabel: "Fictional fixed balance", observationStatus: "fresh",
    netLabel: "280.00", netKind: "available", dailyLabel: "20.00",
    balanceLabel: "1,200.00", billsTotalLabel: "770.00", reserveLabel: "150.00",
    signedNetLabel: "280.00", expectedTotalLabel: "800.00",
    billRows: [{ id: "rent", title: "Studio rent", amount: "650.00", date: "2026-11-08", dateLabel: "Nov 8", status: "upcoming" }],
    invoiceRows: [{ id: "client", clientLabel: "Northstar Studio", amount: "800.00", date: "2026-11-06", dateLabel: "Nov 6", status: "expected", overdue: false }],
    forecastRows: [{ date: "2026-11-06", dateLabel: "Nov 6", funded: "1,200.00", expected: "2,000.00", delayed: "1,200.00", belowReserve: false }],
    scenarioDelay: 0, purchaseOpen: false, purchaseInput: "", ...overrides
  };
}
function actions(): DashboardActions {
  return {
    onAddBill: vi.fn(), onEditBill: vi.fn(), onDeleteBill: vi.fn(),
    onAddInvoice: vi.fn(), onEditInvoice: vi.fn(), onCancelInvoice: vi.fn(),
    onOpenPurchase: vi.fn(), onClosePurchase: vi.fn(), onPurchaseInputChange: vi.fn(),
    onOpenSettings: vi.fn(), onRefresh: vi.fn(), onScenarioChange: vi.fn(),
    onWatchAddress: vi.fn(), onResetSample: vi.fn(), onClearPlan: vi.fn()
  };
}
describe("AfterBills presentation", () => {
  it("offers explicit sample/live entry and labels the synthetic calculation", () => {
    render(<Landing />);
    expect(screen.getByRole("link", { name: /Try a sample plan/ })).toHaveAttribute("href", "/app?mode=sample");
    expect(screen.getByRole("link", { name: /Watch a Solana address/ })).toHaveAttribute("href", "/app?mode=live");
    expect(screen.getByText("Fictional example")).toBeVisible();
    expect(screen.getByText("Not received. Not included above.")).toBeVisible();
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
  it("keeps an unpaid invoice outside the funded hero and arithmetic", () => {
    render(<Dashboard model={model()} actions={actions()} />);
    const funded = screen.getByRole("region", { name: "After bills and reserve" });
    expect(within(funded).getAllByText("280.00")).toHaveLength(2);
    expect(within(funded).queryByText("800.00")).not.toBeInTheDocument();
    expect(within(funded).getByText(/All amounts in USDC\. Expected invoices are not included\./)).toBeVisible();
    expect(screen.getByText("Expected, not received")).toBeVisible();
    expect(screen.getByText(/Fictional data/)).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
  it("displays exact zero without a reassuring daily suggestion", () => {
    render(<Dashboard model={model({ netKind: "zero", netLabel: "0.00", signedNetLabel: "0.00", dailyLabel: "0.00" })} actions={actions()} />);
    expect(screen.getByText("No room after listed commitments.")).toBeVisible();
    expect(screen.queryByText(/USDC \/ day across/)).not.toBeInTheDocument();
  });
  it("names a shortfall and never displays a positive pace", () => {
    render(<Dashboard model={model({ netKind: "shortfall", netLabel: "370.00", signedNetLabel: "−370.00", dailyLabel: "20.00" })} actions={actions()} />);
    expect(screen.getByRole("heading", { name: "Shortfall after bills and reserve" })).toBeVisible();
    expect(screen.getByText("Adjust commitments or reserve. No daily spending pace is available.")).toBeVisible();
    expect(screen.queryByText(/USDC \/ day across/)).not.toBeInTheDocument();
  });
  it("keeps unknown distinct from zero while leaving bill editing available", () => {
    const a = actions();
    render(<Dashboard model={model({ netKind: "unknown", netLabel: "Unavailable", signedNetLabel: "—", balanceLabel: "—", observationStatus: "error" })} actions={a} />);
    expect(screen.getByText("Balance unavailable")).toBeVisible();
    expect(screen.getByRole("button", { name: "Preview a purchase" })).toBeDisabled();
    expect(screen.getByText("A known balance is needed to build the outlook.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Add bill" }));
    expect(a.onAddBill).toHaveBeenCalledOnce();
  });
  it("labels loading without flashing a zero funded result", () => {
    render(<Dashboard model={model({ mode: "live", owner: "11111111111111111111111111111111", netKind: "unknown", observationStatus: "loading", balanceLabel: "Unavailable", signedNetLabel: "Unavailable" })} actions={actions()} />);
    expect(screen.getAllByText("Reading balance…")).toHaveLength(2);
    expect(screen.getByRole("region", { name: "After bills and reserve" })).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Reading balance…" })).toBeDisabled();
    expect(screen.queryByText("No room after listed commitments.")).not.toBeInTheDocument();
  });
  it("discloses stale, storage, frozen and delegation states", () => {
    render(<Dashboard model={model({ observationStatus: "stale", storageWarning: "Changes won't persist in this browser", frozenLabel: "50.00", delegatedWarning: true })} actions={actions()} />);
    expect(screen.getByText(/Stale reference only/)).toBeVisible();
    expect(screen.getByText("Changes won't persist in this browser")).toBeVisible();
    expect(screen.getByText(/Frozen balance: 50.00 USDC. Excluded/)).toBeVisible();
    expect(screen.getByText(/reserve is not protected from third-party spending/)).toBeVisible();
  });
  it("dispatches explicit row, scenario and plan callbacks", () => {
    const a = actions();
    const { rerender } = render(<Dashboard model={model()} actions={a} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit bill: Studio rent" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete bill: Studio rent" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit invoice: Northstar Studio" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel invoice: Northstar Studio" }));
    fireEvent.click(screen.getByRole("button", { name: "7 days later" }));
    fireEvent.click(screen.getByRole("button", { name: "Preview a purchase" }));
    expect(screen.queryByRole("button", { name: "Refresh" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear this plan" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset sample" }));
    fireEvent.click(screen.getByRole("button", { name: "Watch your address" }));
    rerender(<Dashboard model={model({ mode: "live", owner: "11111111111111111111111111111111" })} actions={a} />);
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(a.onEditBill).toHaveBeenCalledWith("rent");
    expect(a.onDeleteBill).toHaveBeenCalledWith("rent");
    expect(a.onEditInvoice).toHaveBeenCalledWith("client");
    expect(a.onCancelInvoice).toHaveBeenCalledWith("client");
    expect(a.onScenarioChange).toHaveBeenCalledWith(7);
    [a.onOpenPurchase, a.onRefresh, a.onClearPlan, a.onResetSample, a.onWatchAddress].forEach(fn => expect(fn).toHaveBeenCalledOnce());
  });
  it("opens the purchase sheet below the baseline, uses text decimal input and restores focus on Escape", () => {
    const a = actions();
    render(<Dashboard model={model({ purchaseOpen: true, purchaseInput: "180.00", purchase: { amountLabel: "180.00", baselineLabel: "280.00", afterLabel: "100.00", dailyLabel: "7.14", shortfall: false } })} actions={a} />);
    const purchase = screen.getByRole("region", { name: "A purchase, in perspective." });
    const input = within(purchase).getByLabelText("Purchase amount USDC");
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("inputmode", "decimal");
    expect(input).toHaveFocus();
    expect(within(purchase).getByText("100.00")).toBeVisible();
    expect(screen.getByText("Preview only. No funds move.")).toBeVisible();
    expect(within(screen.getByRole("region", { name: "After bills and reserve" })).getAllByText("280.00")).toHaveLength(3);
    fireEvent.change(input, { target: { value: "190" } });
    expect(a.onPurchaseInputChange).toHaveBeenCalledWith("190");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(a.onClosePurchase).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Preview a purchase" })).toHaveFocus();
  });
  it("associates purchase errors and hides an invalid result", () => {
    render(<Dashboard model={model({ purchaseOpen: true, purchaseInput: "abc", purchaseError: "Enter an exact nonnegative amount." })} actions={actions()} />);
    const input = screen.getByLabelText("Purchase amount USDC");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(/Enter an exact nonnegative amount/);
    expect(screen.getByRole("alert")).toHaveTextContent("Enter an exact nonnegative amount.");
  });
  it("exposes day-by-day conditional values without changing the funded hero", () => {
    const a = actions();
    const { rerender } = render(<Dashboard model={model()} actions={a} />);
    fireEvent.click(screen.getByText("Compare day by day"));
    expect(screen.getByRole("cell", { name: /Conditional\s*2,000.00/ })).toBeInTheDocument();
    rerender(<Dashboard model={model({ scenarioDelay: 7 })} actions={a} />);
    expect(screen.getByRole("button", { name: "7 days later" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("2,000.00")).not.toBeInTheDocument();
    expect(screen.getByText("280.00", { selector: ".hero-money .money" })).toBeVisible();
  });
  it("labels live devnet and shows actual address and asset explorer links", () => {
    render(<Dashboard model={model({ mode: "live", owner: "11111111111111111111111111111111" })} actions={actions()} />);
    expect(screen.getByText(/Test money · No real value/)).toBeVisible();
    expect(screen.queryByText("Sample plan")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /111111…1111/ })).toHaveAttribute("href", "https://explorer.solana.com/address/11111111111111111111111111111111?cluster=devnet");
    expect(screen.getByRole("link", { name: "Devnet USDC" })).toHaveAttribute("href", expect.stringContaining("cluster=devnet"));
  });
  it("explains rounding and exposes the unrounded unit calculation on inspection", () => {
    render(<Dashboard model={model({ exact: {
      balanceUnits: "1200000000", includedBillsUnits: "770000000",
      reserveUnits: "150000001", signedNetUnits: "279999999"
    } })} actions={actions()} />);
    expect(screen.getByText(/Displayed amounts round down to cents; shortfalls round up/)).toBeVisible();
    fireEvent.click(screen.getByText("Inspect exact token units"));
    expect(screen.getByText("150000001")).toBeVisible();
    expect(screen.getByText("279999999")).toBeVisible();
  });
});

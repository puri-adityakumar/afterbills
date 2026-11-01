import type { Mode, ObservationStatus } from "./model";

export interface BillRow {
  id: string;
  title: string;
  amount: string;
  date: string;
  dateLabel: string;
  status: "upcoming" | "overdue" | "outside";
}
export interface InvoiceRow {
  id: string;
  clientLabel: string;
  amount: string;
  date: string;
  dateLabel: string;
  status: "expected" | "cancelled" | "received_manual";
  overdue: boolean;
}
export interface ForecastRow {
  date: string;
  dateLabel: string;
  funded: string;
  expected: string;
  delayed: string;
  belowReserve: boolean;
}
export interface DashboardViewModel {
  mode: Mode;
  owner?: string;
  windowLabel: string;
  timezone: string;
  observationLabel: string;
  observationStatus: ObservationStatus;
  netLabel: string;
  netKind: "available" | "zero" | "shortfall" | "unknown";
  dailyLabel: string | null;
  balanceLabel: string;
  billsTotalLabel: string;
  reserveLabel: string;
  signedNetLabel: string;
  expectedTotalLabel: string;
  billRows: BillRow[];
  invoiceRows: InvoiceRow[];
  forecastRows: ForecastRow[];
  scenarioDelay: 0 | 7;
  purchaseOpen: boolean;
  purchaseInput: string;
  purchaseError?: string;
  purchase?: {
    amountLabel: string;
    baselineLabel: string;
    afterLabel: string;
    dailyLabel: string | null;
    shortfall: boolean;
  };
  warning?: string;
  storageWarning?: string;
  frozenLabel?: string;
  delegatedWarning?: boolean;
  exact?: {
    balanceUnits?: string;
    includedBillsUnits: string;
    reserveUnits: string;
    signedNetUnits?: string;
  };
}
export interface DashboardActions {
  onAddBill(): void;
  onEditBill(id: string): void;
  onDeleteBill(id: string): void;
  onAddInvoice(): void;
  onEditInvoice(id: string): void;
  onCancelInvoice(id: string): void;
  onOpenPurchase(): void;
  onClosePurchase(): void;
  onPurchaseInputChange(value: string): void;
  onOpenSettings(): void;
  onRefresh(): void;
  onScenarioChange(delay: 0 | 7): void;
  onWatchAddress(): void;
  onResetSample(): void;
  onClearPlan(): void;
}

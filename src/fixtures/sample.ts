import { SAMPLE_PROFILE_KEY } from "@/contracts/asset";
import type { Plan } from "@/contracts/model";

export const SAMPLE_BALANCE_UNITS = 1_200_000_000n;
export const createSamplePlan = (): Plan => ({
  version: 1,
  profileKey: SAMPLE_PROFILE_KEY,
  window: {
    startDate: "2026-11-01",
    endDateExclusive: "2026-11-15",
    timezone: "Asia/Kolkata",
    dayCount: 14
  },
  reserveUnits: "150000000",
  bills: [
    { id: "rent", title: "Studio rent", amountUnits: "650000000", dueDate: "2026-11-08" },
    { id: "software", title: "Utilities & software", amountUnits: "120000000", dueDate: "2026-11-10" }
  ],
  invoices: [
    { id: "invoice-01", clientLabel: "Northstar Studio", totalUnits: "800000000", expectedDate: "2026-11-06", status: "expected" }
  ],
  updatedAt: "2026-11-01T00:00:00.000Z"
});

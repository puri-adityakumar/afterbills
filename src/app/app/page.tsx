import type { Metadata } from "next";
import { Planner } from "@/features/planning/planner";

export const metadata: Metadata = {
  title: "Your plan",
  description: "Your read-only, browser-local cash-flow plan. Funded money, dated bills, and uncertain invoices kept separate."
};

export default async function AppPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const params = await searchParams;
  return <Planner initialMode={params.mode === "live" ? "live" : "sample"} />;
}

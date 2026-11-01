import type { Metadata } from "next";
import "@fontsource-variable/instrument-sans";
import "@/styles/globals.css";
import "@/styles/planning.css";

export const metadata: Metadata = {
  title: { default: "AfterBills | Your balance isn't your budget", template: "%s | AfterBills" },
  description: "A read-only Solana USDC cash-flow planner. See what remains after bills and reserve, without counting unpaid invoices.",
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}

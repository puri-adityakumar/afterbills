import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="AfterBills home">
      <span className="brand-symbol" aria-hidden="true"><span /><span /><span /></span>
      AfterBills<span className="brand-period">.</span>
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer shell">
      <Link href="/" className="footer-wordmark">AfterBills.</Link>
      <p>A little more clarity. A little more room.</p>
      <a href="https://explorer.solana.com/?cluster=devnet" target="_blank" rel="noopener noreferrer">
        Built around Solana devnet <ArrowUpRight size={14} aria-hidden="true" />
      </a>
    </footer>
  );
}

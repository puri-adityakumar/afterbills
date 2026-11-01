"use client";

import { useRef } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronDown, CircleAlert, Clock3, FileText, Plus, RefreshCw, Settings2, ShieldCheck, X } from "lucide-react";
import { ASSET } from "@/contracts/asset";
import type { DashboardActions, DashboardViewModel } from "@/contracts/view-model";
import { Brand, SiteFooter } from "@/components/ui/brand";

export interface DashboardProps { model: DashboardViewModel; actions: DashboardActions }

function Amount({ children, unit = false }: { children: string; unit?: boolean }) {
  return <span className="money">{children}{unit && <span className="money-unit"> USDC</span>}</span>;
}

export function Dashboard({ model: m, actions: a }: DashboardProps) {
  const purchaseTrigger = useRef<HTMLButtonElement>(null);
  const unknown = m.netKind === "unknown";
  const stale = m.observationStatus === "stale";
  const loading = m.observationStatus === "loading";
  const closePurchase = () => { a.onClosePurchase(); purchaseTrigger.current?.focus(); };
  return (
    <div className="dashboard-page">
      <header className="site-header shell">
        <Brand />
        <nav className="dashboard-navigation" aria-label="Plan sections"><a href="#overview" aria-current="page">Overview</a><a href="#bills">Bills</a><a href="#invoices">Expected invoices</a></nav>
        <button className="button-quiet settings-button" onClick={a.onOpenSettings} aria-label="Open plan settings"><Settings2 size={18} aria-hidden="true" /><span>Settings</span></button>
      </header>
      <div className={`mode-banner ${m.mode === "sample" ? "mode-sample" : ""}`}>
        <div className="shell mode-banner-inner"><p><span className="status-dot" /><strong>{m.mode === "sample" ? "Sample plan" : "Solana devnet"}</strong><span className="banner-divider" />{m.mode === "sample" ? "Fictional data · Fixed November 1 to 14, 2026" : "Test money · No real value"}</p><button className="banner-action" onClick={a.onWatchAddress}>{m.mode === "sample" ? "Watch your address" : "Change address"}<ArrowUpRight size={15} aria-hidden="true" /></button></div>
      </div>
      <main id="main" className="dashboard-main shell">
        <div className="overview-heading" id="overview"><div><p className="eyebrow">YOUR MONEY, WITH A PLAN</p><h1>A clearer kind of balance.</h1></div><div className="window-label"><CalendarDays size={17} aria-hidden="true" /><span>{m.windowLabel}<small>14-day plan · {m.timezone}</small></span></div></div>
        <div className="observation-bar">
          <div className="observation-source"><ShieldCheck size={16} aria-hidden="true" /><span>Read-only</span>{m.owner && <a className="address-link" href={`https://explorer.solana.com/address/${encodeURIComponent(m.owner)}?cluster=devnet`} target="_blank" rel="noopener noreferrer" title={m.owner}>{m.owner.slice(0, 6)}…{m.owner.slice(-4)}<ArrowUpRight size={13} aria-hidden="true" /></a>}<a href={`https://explorer.solana.com/address/${ASSET.mint}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="asset-link">{ASSET.displayLabel}<ArrowUpRight size={12} aria-hidden="true" /></a></div>
          <div className="observation-freshness"><span><Clock3 size={14} aria-hidden="true" />{m.observationLabel}</span>{m.mode === "live" && <button className="button-quiet" onClick={a.onRefresh} disabled={loading || !m.owner}><RefreshCw size={15} aria-hidden="true" />{loading ? "Reading balance…" : "Refresh"}</button>}</div>
        </div>
        <div className="notices">
          {stale && <p className="notice" role="status"><CircleAlert size={18} aria-hidden="true" />Stale reference only. Refresh the balance before using this plan for a decision.</p>}
          {m.warning && <p className="notice" role="status"><CircleAlert size={18} aria-hidden="true" />{m.warning}</p>}
          {m.storageWarning && <p className="notice" role="status"><CircleAlert size={18} aria-hidden="true" />{m.storageWarning}</p>}
          {m.frozenLabel && <p className="notice"><CircleAlert size={18} aria-hidden="true" /><span>Frozen balance: {m.frozenLabel} USDC. Excluded from usable funds.</span></p>}
          {m.delegatedWarning && <p className="notice"><CircleAlert size={18} aria-hidden="true" />Token delegation detected. Your planning reserve is not protected from third-party spending.</p>}
        </div>
        <section className={`budget-section ${m.netKind === "shortfall" ? "is-shortfall" : ""}`} aria-labelledby="budget-title" aria-busy={loading}>
          <div className="funded-hero">
            <p className="section-kicker"><span className="tiny-line" /> {stale ? "LAST KNOWN PLAN" : "FUNDED, NOT FORECAST"}</p>
            <h2 id="budget-title">{m.netKind === "shortfall" ? "Shortfall after bills and reserve" : "After bills and reserve"}</h2>
            {unknown ? <div className="unknown-amount">{loading ? "Reading balance…" : "Balance unavailable"}<p>No funded result until a balance is known.</p></div> : <p className="hero-money"><Amount unit>{m.netLabel}</Amount></p>}
            {!unknown && m.netKind === "available" && m.dailyLabel && <p className="daily-pace">{m.dailyLabel} <span>USDC / day across this plan</span></p>}
            {m.netKind === "zero" && <p className="zero-note">No room after listed commitments.</p>}
            {m.netKind === "shortfall" && <p className="shortfall-note">Adjust commitments or reserve. No daily spending pace is available.</p>}
            <p className="hero-assumption">Based on the commitments you entered.<br />Your reserve is a planning buffer, not locked funds.</p>
            <button ref={purchaseTrigger} className="button purchase-trigger" onClick={a.onOpenPurchase} disabled={unknown || loading} aria-expanded={m.purchaseOpen} aria-controls="purchase-preview">Preview a purchase <ArrowRight size={17} aria-hidden="true" /></button>
          </div>
          <div className="calculation-sheet">
            <div className="sheet-title"><h2>Nothing hidden.<br />Here’s the arithmetic.</h2></div>
            <dl className="calculation-rows">
              <div><dt>Observed usable balance</dt><dd><Amount>{m.balanceLabel}</Amount></dd></div>
              <div><dt>Included open bills <a href="#bills" aria-label="View included bills"><ArrowDown size={13} aria-hidden="true" /></a></dt><dd><span className="deduction">−</span><Amount>{m.billsTotalLabel}</Amount></dd></div>
              <div><dt>Your reserve <button className="inline-button" onClick={a.onOpenSettings} aria-label="Edit your reserve">Edit</button></dt><dd><span className="deduction">−</span><Amount>{m.reserveLabel}</Amount></dd></div>
              <div className="calculation-result"><dt>{m.netKind === "shortfall" ? "Net after commitments" : "After bills and reserve"}</dt><dd><Amount>{m.signedNetLabel}</Amount></dd></div>
            </dl>
            <p className="sheet-footnote">All amounts in USDC. Expected invoices are not included. Displayed amounts round down to cents; shortfalls round up.</p>
            <details className="assumptions"><summary>What this plan covers <ChevronDown size={14} aria-hidden="true" /></summary><p>Open bills before the end of this window, including overdue bills, are reserved. Later bills are shown separately. This plan cannot account for unentered spending, other accounts, or changes in token value. USDC units do not guarantee USD redemption.</p></details>
            {m.exact && <details className="assumptions"><summary>Inspect exact token units <ChevronDown size={14} aria-hidden="true" /></summary><p>1 USDC = 1,000,000 base units. Calculations keep all six decimal places, even when display rounding hides a fraction of a cent.</p><dl className="exact-units"><div><dt>Usable balance</dt><dd>{m.exact.balanceUnits ?? "Unknown"}</dd></div><div><dt>Included bills</dt><dd>{m.exact.includedBillsUnits}</dd></div><div><dt>Reserve</dt><dd>{m.exact.reserveUnits}</dd></div><div><dt>Signed net</dt><dd>{m.exact.signedNetUnits ?? "Unknown"}</dd></div></dl></details>}
          </div>
          {m.purchaseOpen && <section id="purchase-preview" className="purchase-sheet" aria-labelledby="purchase-title" onKeyDown={e => { if (e.key === "Escape") closePurchase(); }}>
            <div className="purchase-intro"><p className="eyebrow">BELOW THE LINE · A WHAT-IF</p><h2 id="purchase-title">A purchase, in perspective.</h2><p>Keep your original plan. Just see what changes.</p></div>
            <div className="purchase-controls"><div className="field"><label htmlFor="purchase-amount">Purchase amount <span>USDC</span></label><input autoFocus className="input" id="purchase-amount" type="text" inputMode="decimal" autoComplete="off" value={m.purchaseInput} onChange={e => a.onPurchaseInputChange(e.target.value)} aria-invalid={Boolean(m.purchaseError)} aria-describedby={m.purchaseError ? "purchase-error purchase-disclosure" : "purchase-disclosure"} placeholder="e.g. 180.00" />{m.purchaseError && <p id="purchase-error" className="form-error" role="alert">{m.purchaseError}</p>}</div><p id="purchase-disclosure" className="quiet-note">Preview only. No funds move.</p></div>
            <button className="button-quiet purchase-close" aria-label="Close purchase preview" onClick={closePurchase}><X size={19} aria-hidden="true" /></button>
            {m.purchase && !m.purchaseError && <div className={`purchase-result ${m.purchase.shortfall ? "purchase-deficit" : ""}`} aria-live="polite" aria-atomic="true"><div><span>Before</span><strong><Amount unit>{m.purchase.baselineLabel}</Amount></strong></div><ArrowRight size={20} aria-hidden="true" /><div><span>{m.purchase.shortfall ? "Shortfall" : "Remaining"} after a {m.purchase.amountLabel} USDC purchase</span><strong><Amount unit>{m.purchase.afterLabel}</Amount></strong>{!m.purchase.shortfall && m.purchase.dailyLabel && <small>{m.purchase.dailyLabel} USDC / day</small>}</div><p>{m.purchase.shortfall ? "This purchase exceeds the entered plan." : "Fits the entered plan, not a guarantee of affordability."}</p></div>}
          </section>}
        </section>
        <div className="commitments-grid">
          <section className="bills-section" id="bills" aria-labelledby="bills-title">
            <div className="section-heading"><div><p className="eyebrow">MONEY COMMITTED</p><h2 id="bills-title">Upcoming bills</h2></div><button className="button-secondary" onClick={a.onAddBill}><Plus size={17} aria-hidden="true" />Add bill</button></div>
            <p className="section-description">Already given a place in your plan.</p>
            {m.billRows.length === 0 ? <div className="empty-state"><CalendarDays size={24} aria-hidden="true" /><h3>Start with your next commitment.</h3><p>No bills entered. Your plan is incomplete until you add what you owe.</p><button className="text-action" onClick={a.onAddBill}>Add your first bill <Plus size={16} aria-hidden="true" /></button></div> : <ul className="bill-list">{m.billRows.map(row => <li key={row.id} className={`bill-row bill-${row.status}`}><span className="row-icon"><CalendarDays size={19} strokeWidth={1.5} aria-hidden="true" /></span><div className="row-detail"><h3>{row.title}</h3><p><time dateTime={row.date}>{row.dateLabel}</time>{row.status === "overdue" && <span className="text-badge badge-warning">Overdue · included</span>}{row.status === "outside" && <span className="text-badge">Outside window · not deducted</span>}</p></div><div className="row-end"><strong><Amount unit>{row.amount}</Amount></strong><div className="row-actions"><button onClick={() => a.onEditBill(row.id)} aria-label={`Edit bill: ${row.title}`}>Edit</button><button onClick={() => a.onDeleteBill(row.id)} aria-label={`Delete bill: ${row.title}`}>Delete</button></div></div></li>)}</ul>}
            <div className="section-bottom"><ShieldCheck size={15} aria-hidden="true" /><p>Planning only. Adding or deleting a bill never pays it.</p></div>
          </section>
          <section className="invoices-section" id="invoices" aria-labelledby="invoices-title">
            <div className="section-heading"><div><p className="eyebrow">MONEY EXPECTED</p><h2 id="invoices-title">Not here. Not counted.</h2></div><button className="button-quiet" onClick={a.onAddInvoice} aria-label="Add invoice"><Plus size={20} aria-hidden="true" /></button></div>
            <p className="section-description">Expected invoices stay out of your funded amount.</p>
            <div className="expected-total"><span>Still expected</span><strong><Amount unit>{m.expectedTotalLabel}</Amount></strong></div>
            {m.invoiceRows.length === 0 ? <div className="empty-state"><FileText size={24} aria-hidden="true" /><h3>Waiting on a client?</h3><p>Add an invoice to explore when it might arrive. It won’t change your funded amount.</p></div> : <ul className="invoice-list">{m.invoiceRows.map(row => <li key={row.id} className={`invoice-row invoice-${row.status}`}><div className="invoice-top"><h3>{row.clientLabel}</h3><strong><Amount unit>{row.amount}</Amount></strong></div><p className="invoice-date"><time dateTime={row.date}>{row.dateLabel}</time>{row.overdue && row.status === "expected" && <span className="text-badge badge-warning">Overdue</span>}</p><p className="invoice-status"><span className="expected-marker" aria-hidden="true" />{row.status === "expected" ? "Expected, not received" : row.status === "cancelled" ? "Cancelled · not projected" : "Manually recorded received · not verified"}</p><div className="row-actions"><button onClick={() => a.onEditInvoice(row.id)} aria-label={`Edit invoice: ${row.clientLabel}`}>Edit</button>{row.status === "expected" && <button onClick={() => a.onCancelInvoice(row.id)} aria-label={`Cancel invoice: ${row.clientLabel}`}>Cancel invoice</button>}</div></li>)}</ul>}
            <button className="text-action add-invoice" onClick={a.onAddInvoice}><Plus size={16} aria-hidden="true" />Add expected invoice</button>
          </section>
        </div>
        <section className="outlook-section" aria-labelledby="outlook-title">
          <div className="outlook-heading"><div><p className="eyebrow">A SEPARATE, CONDITIONAL OUTLOOK</p><h2 id="outlook-title">What if a client pays late?</h2><p>Expected money is a possibility. Your funded amount above stays the same.</p></div><div className="scenario-switch" role="group" aria-label="Invoice payment scenario"><button aria-pressed={m.scenarioDelay === 0} onClick={() => a.onScenarioChange(0)}>{m.scenarioDelay === 0 && <Check size={14} aria-hidden="true" />}Expected dates</button><button aria-pressed={m.scenarioDelay === 7} onClick={() => a.onScenarioChange(7)}>{m.scenarioDelay === 7 && <Check size={14} aria-hidden="true" />}7 days later</button></div></div>
          <p className="scenario-summary" role="status">{m.scenarioDelay === 7 ? "Showing invoices arriving 7 days later." : "Showing invoices arriving on their entered dates."} End-of-day estimates, not a promise of payment.</p>
          {unknown || m.forecastRows.length === 0 ? <p className="outlook-unavailable">{unknown ? "A known balance is needed to build the outlook." : "Your day-by-day outlook will appear when the plan is ready."}</p> : <details className="forecast-details"><summary><span><CalendarDays size={18} aria-hidden="true" />Compare day by day <small>Funded vs. conditional · USDC</small></span><ChevronDown size={18} aria-hidden="true" /></summary><div className="forecast-table-wrap"><table className="forecast-table"><caption className="sr-only">End-of-day balances. Reserve threshold: {m.reserveLabel} USDC. Funded excludes all invoices; conditional includes the selected payment scenario.</caption><thead><tr><th scope="col">Date</th><th scope="col">Funded only</th><th scope="col">{m.scenarioDelay === 7 ? "If 7 days late" : "If paid as expected"}</th><th scope="col">Reserve check</th></tr></thead><tbody>{m.forecastRows.map(row => <tr key={row.date}><th scope="row"><time dateTime={row.date}>{row.dateLabel}</time></th><td><span className="mobile-cell-label">Funded only</span>{row.funded}</td><td><span className="mobile-cell-label">Conditional</span>{m.scenarioDelay === 7 ? row.delayed : row.expected}</td><td><span className={row.belowReserve ? "reserve-warning" : "reserve-check"}>{row.belowReserve ? "Below reserve" : "At or above reserve"}</span></td></tr>)}</tbody></table></div></details>}
          <p className="outlook-footnote">Reserve threshold: {m.reserveLabel} USDC. It is not deducted a second time from these balances. No within-day liquidity guarantee.</p>
        </section>
        <section className="local-data-note" aria-label="Privacy and plan controls"><div><ShieldCheck size={19} aria-hidden="true" /><p><strong>Your notes stay in this browser.</strong> Not encrypted or synced. Public-address reads go to our hosting and RPC infrastructure.</p></div><div className="local-actions"><button className="button-quiet" onClick={a.onOpenSettings}>Plan settings</button>{m.mode === "sample" && <button className="button-quiet" onClick={a.onResetSample}>Reset sample</button>}<button className="button-quiet" onClick={a.onClearPlan}>Clear this plan</button></div></section>
      </main>
      <SiteFooter />
    </div>
  );
}

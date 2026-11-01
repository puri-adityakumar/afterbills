import { ArrowDown, ArrowRight, ArrowUpRight, Fingerprint, LockKeyhole, Minus, MoveRight, ShieldCheck } from "lucide-react";
import { Brand, SiteFooter } from "@/components/ui/brand";

export function Landing() {
  return (
    <div className="landing-page">
      <header className="site-header shell">
        <Brand />
        <nav aria-label="Main navigation" className="landing-navigation">
          <a href="#how-it-works">The idea</a>
          <a className="button button-secondary button-small" href="/app?mode=live">Open your plan <ArrowUpRight size={16} aria-hidden="true" /></a>
        </nav>
      </header>
      <main id="main">
        <section className="landing-hero shell" aria-labelledby="landing-title">
          <div className="landing-copy">
            <p className="eyebrow"><span className="tiny-line" /> MONEY IN. COMMITMENTS OUT. CLARITY LEFT.</p>
            <h1 id="landing-title">Your balance<br />isn’t your<br /><span>budget.</span></h1>
            <p className="landing-description">See what remains after your bills and buffer, without counting invoices you haven’t been paid.</p>
            <div className="landing-actions">
              <a className="button" href="/app?mode=sample">Try a sample plan <ArrowRight size={18} aria-hidden="true" /></a>
              <a className="text-action" href="/app?mode=live">Watch a Solana address <ArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
            <p className="quiet-note"><ShieldCheck size={16} aria-hidden="true" /> Read-only. No signature. No spending access.</p>
          </div>
          <div className="landing-figure-wrap">
            <div className="figure-topline"><span>THE DIFFERENCE IS WHAT’S LEFT.</span></div>
            <figure className="example-sheet" aria-labelledby="example-title">
              <figcaption id="example-title"><span className="eyebrow">A PLAN, NOT JUST A BALANCE</span><span className="sample-chip">Fictional example</span></figcaption>
              <div className="example-window">November 1 to 14, 2026 <span>14 days</span></div>
              <dl className="example-arithmetic">
                <div><dt>In your wallet</dt><dd>1,200.00 <span>USDC</span></dd></div>
                <div><dt><Minus size={14} aria-hidden="true" /> Bills coming up</dt><dd>770.00</dd></div>
                <div><dt><Minus size={14} aria-hidden="true" /> Your buffer</dt><dd>150.00</dd></div>
              </dl>
              <div className="example-remainder"><p>After bills and reserve</p><div className="example-money">280<span>.00</span><small>USDC</small></div><p className="example-pace">20.00 USDC / day <span>across this 14-day plan</span></p></div>
              <div className="example-invoice"><div><span className="expected-marker" aria-hidden="true" /> Expected invoice <strong>800.00 USDC</strong></div><p>Not received. Not included above.</p></div>
            </figure>
            <div className="figure-annotation"><span className="annotation-line" /><p>A clear line between<br />what’s promised and what’s here.</p></div>
          </div>
        </section>
        <section id="how-it-works" className="landing-method shell" aria-labelledby="method-title">
          <div className="method-intro"><p className="eyebrow">AFTER THE LINE</p><h2 id="method-title">Less guesswork.<br />More breathing room.</h2><a href="#privacy" className="text-action">Simple by design <ArrowDown size={16} aria-hidden="true" /></a></div>
          <ol className="method-steps">
            <li><span className="step-number">01</span><h3>Start with what’s here.</h3><p>Watch a public Solana address. Your observed usable balance is the starting point, not a promise of future income.</p></li>
            <li><span className="step-number">02</span><h3>Give commitments their space.</h3><p>Add dated bills and a reserve. See the arithmetic behind the amount left. Your buffer is a plan, not locked funds.</p></li>
            <li><span className="step-number">03</span><h3>Make the next decision clearer.</h3><p>Preview a purchase or a late client payment. Explore the impact without changing the baseline or moving money.</p></li>
          </ol>
        </section>
        <section id="privacy" className="landing-trust shell" aria-labelledby="privacy-title">
          <div><Fingerprint size={26} strokeWidth={1.4} aria-hidden="true" /><h2 id="privacy-title">Your plan stays yours.</h2><p>Financial notes stay in this browser. Public-address queries go to our hosting and RPC infrastructure. Local storage isn’t encrypted; take care on a shared device.</p></div>
          <div><LockKeyhole size={26} strokeWidth={1.4} aria-hidden="true" /><h2>Clarity, not custody.</h2><p>No private keys, signatures, approvals, or spending permissions. Only the commitments you enter are included, not your entire financial life.</p></div>
          <aside className="prototype-note"><span className="eyebrow">AN HONEST PROTOTYPE</span><p>Solana devnet. Test tokens have no real value. USDC-unit estimates, not financial advice or a guarantee of affordability.</p><a href="/app?mode=sample" className="text-action">Take a look inside <MoveRight size={18} aria-hidden="true" /></a></aside>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

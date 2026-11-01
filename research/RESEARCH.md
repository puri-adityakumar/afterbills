# AfterBills research and decision register

Accessed **2026-10-31**. Public official product/docs research, not user validation,
code execution, production verification, or an audit. Product/UX research was
delegated to one light-tier read-only subagent; technical/event research was done
in the main session. No competitor code was cloned.

## 1. Event evidence

**R1. Encode Club Solana Hackathon 2026**
https://www.encodeclub.com/programmes/solana-hackathon-2026

Verified from organizer page:
- Consumer track emphasizes real user need, onboarding, meaningful Solana use,
  and a working end-to-end experience.
- Devnet is sufficient; code/README/setup and a 2-4-minute demo are submission
  requirements for the challenge.
- Consumer and x402 prizes are accelerator places, not cash.
- Aurora is a separate challenge requiring a real integration.

**R2. User-provided checkpoint screenshot, supplied in this conversation**

Title: "Mid-submission checkpoint". Due November 2, 2026 at 5:29 PM
Asia/Calcutta, equivalent to 11:59 UTC. Fields: submission details, code, demo
video, live demo, presentation. Only submission details visibly says Required.
Screenshot text is transcribed here; no public checkpoint URL or link has been
invented. Its precise localized deadline takes precedence for this plan over the
organizer page's coarse "Sunday 1 November" schedule. Recheck the logged-in form
before submission. Do not call this the organizer's first checkpoint.

## 2. Useful product patterns, not templates to copy

| Ref | Verified official-source pattern | AfterBills recommendation |
|---|---|---|
| R3 | Actual budgets money already held, not predicted earnings. | Keep funded and expected money separate in the model and layout. |
| R4 | Actual can hold money for a later month without moving underlying funds. | Explain reserve as planning, not an on-chain lock. |
| R5 | YNAB's irregular-income guidance emphasizes cash on hand and preparing for uneven timing. | Make uncertainty visible; do not assume invoice dates are reliable. |
| R6 | Lunch Money distinguishes account snapshots from period-dependent summaries and projected totals. | Horizon changes bills, not the observed wallet balance; use words and line styles for scenarios. |
| R7 | Lunch Money recurring expenses have schedules and boundaries. | Start with explicit dated bills, not a rushed recurring engine. |
| R8 | FreshBooks supports suggested/manual reconciliation, approval, skipping, and undo. | Later receipt matches are reviewable annotations, never a second credit to balance. |
| R9 | Actual documents local storage and optional end-to-end encryption. | Browser-local prototype storage is not equivalent to encryption or a privacy guarantee. |

Sources:
- R3: https://actualbudget.org/docs/budgeting/
- R4: https://actualbudget.org/docs/budgeting/#income
- R5: https://www.ynab.com/guide/irregular-income
- R6: https://support.lunchmoney.app/home/overview
- R7: https://lunchmoney.app/features/recurring-expenses/
- R8: https://support.freshbooks.com/hc/en-us/articles/360039682172-How-do-I-reconcile-simple-transactions-in-bank-reconciliation
- R9: https://actualbudget.org/docs/privacy-policy/

These do not establish market demand, competitive superiority, or Solana support.
The earlier Stablecorp reference is thematic inspiration only; its award or code
has not been re-verified for this planning pack. Do not copy its branding or make
an endorsement claim.

## 3. Technical evidence

**R10. Owned token accounts**
https://solana.com/docs/rpc/http/gettokenaccountsbyowner

Supports an owner plus mint filter and `jsonParsed`; returns contextual slot,
raw amount strings, and decimals. Sum matching token accounts, not just an assumed
associated token account. Validate mint and owner, reject inconsistent data,
and treat frozen balances separately. Use raw units, not `uiAmount` floats.

**R11. Signature discovery**
https://solana.com/docs/rpc/http/getsignaturesforaddress

Returns signatures referencing an address in account keys, newest first.
Inference: querying only the wallet owner is insufficient for all SPL receipts,
because a recipient's token account can be referenced without its owner.
Receipt work must query discovered token accounts too and disclose its history
limits. It is deferred from the checkpoint-critical path.

**R12. Transaction inspection**
https://solana.com/docs/rpc/http/gettransaction
https://solana.com/docs/rpc/json-structures

Transactions may be null at the requested commitment; metadata includes errors
and pre/post token balances. A signature string alone is not a verified receipt.
Later parsing must support versioned transactions, require successful finalized
metadata, and reject missing/ambiguous evidence rather than infer income.

**R13. Networks and availability**
https://solana.com/docs/references/clusters

Devnet tokens have no real value and the ledger can reset. Public endpoints are
rate-limited, not intended for production. Handle 429/Retry-After and outages;
do not convert failures into zero. Documentation says a faucet exists, but that
does not prove a faucet is usable from this environment.

Important correction to earlier planning: read-only AfterBills does not need a
new funded keypair or the AgentTab wallet. Only a live incoming-payment demo
needs a separately authorized devnet funding arrangement.

**R14. Canonical USDC identities**
https://developers.circle.com/stablecoins/usdc-contract-addresses

Verified addresses:
- Solana mainnet: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`.
- Solana devnet: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`.

The address list is evidence of token identity, not a live integration test.
Validate the expected decimals at runtime. If devnet USDC funding is unavailable,
a custom test mint needs a deployment-level allowlist and visible "test token,
not USDC" labeling. Never identify an asset by symbol alone.

**R15. Wallet connection**
https://solana.com/developers/cookbook/wallets/connect-wallet-react

Official cookbook uses wallet-adapter with Wallet Standard discovery
(`wallets={[]}`), avoiding the large legacy wallet bundle. This supports the
proposed optional connect path, but versions/peer dependencies still need a
build-time compatibility spike. Watch-address is a complete read-only fallback.
Do not copy the guide's signing/transfer examples into this product.

**R16. Next.js server boundary**
https://nextjs.org/docs/app/getting-started/route-handlers
https://nextjs.org/docs/app/guides/environment-variables

App Router route handlers support narrow HTTP APIs. Non-`NEXT_PUBLIC_` env
variables remain server-side by default; public-prefixed ones are bundled into
the client. Keep an RPC URL containing credentials server-only and use a narrow
validated read endpoint, not an open RPC proxy.

## 4. Decisions and rejected scope

| Decision | Reason |
|---|---|
| Next.js + TypeScript, one application | UI and narrow server adapter without a second service or blockchain program. |
| Deterministic integer-unit engine | Reproducible explanations; no model-generated financial arithmetic. |
| Browser-local financial plan | Avoid auth/database setup and centralized client-note storage at checkpoint. |
| Sample mode plus real public-address reads | Judge-friendly onboarding without fabricated blockchain evidence. |
| One-off bills, fixed 14-day window | Small enough to finish and test; recurrence/calendar expansion can follow. |
| Receipts/matching P1 | More RPC/parser/reconciliation complexity than a first demo needs. |
| No AI requirement | Structured purchase/scenario controls solve the stated job without keys, latency, or privacy leakage. |
| No x402/Aurora in P0 | Not mandatory for consumer entry; no forced payment feature or real-money dependency. |
| No borrowed codebase | User requested inspiration and explicitly stopped the earlier clone implementation. |

## 5. Risks and early checks

1. **Manual completeness:** omission of food/tax/annual bills can overstate the
   estimate. Disclose scope and provide an optional reminder checklist.
2. **Staleness:** show slot/time/age and retain last successful data as stale;
   cancel old-address requests and reject older observations.
3. **Privacy:** public address queries reach infrastructure; browser storage is
   accessible to scripts and device users. No private data in screenshots/logs.
4. **Arithmetic/date mistakes:** freeze time in fixtures, handle overdue bills,
   window boundaries, six decimals, and shortfalls explicitly.
5. **Double counting:** no payment delta is added to an already-refreshed balance;
   manual/verified invoice state only affects expected inflows.
6. **Scope drift:** dashboard craftsmanship is in scope; banking, recurring
   inference, autonomous actions, multi-chain, and sponsor integrations are not.
7. **Evidence gap:** no app or integration has run yet. Public documentation and
   hypothetical examples must not become claims in the checkpoint narrative.

Open decisions for the implementation spike: compatible exact dependency
versions, usable devnet RPC, sample/test-wallet address, funding if a balance
change is recorded, and hosting account/project authorization. No secrets or
wallet funds are needed merely to start coding later.

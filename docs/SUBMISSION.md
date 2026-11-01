# AfterBills · submission package

Updated November 1, 2026. Copy the description below into **Submission Details**.
The form has not been submitted. Demo video and presentation are deferred at the
user's request.

## Submission Details

**AfterBills: Your balance isn't your budget.**

AfterBills is a read-only cash-flow planner for freelancers paid in Solana USDC.
It addresses a practical problem: a wallet balance does not account for upcoming
rent, software bills, a personal buffer, or the uncertainty of a client paying late.
The product turns an observed token balance and manually entered commitments into
a clear answer: what remains after bills and a reserve over the next 14 days?

The defining rule is that unpaid invoices never increase the funded amount.
Users see both the result and its arithmetic, with expected income in a separate,
explicitly conditional outlook. In the fictional sample, 1,200 USDC minus 770 in
bills and a 150 reserve leaves 280 USDC, or 20 per day. An expected 800 USDC invoice
does not change that result. A 180 USDC purchase preview leaves 100 USDC and a
rounded-down daily pace of 7.14, without saving an expense or moving any money.
Users can also compare expected payment dates with a seven-day delay.

The working application includes a no-wallet sample, public devnet address lookup,
dated bill management, expected invoices, reserve and timezone settings, purchase
previews, local persistence, and responsive desktop/mobile layouts. Financial
calculations use integer token units and bigint rather than floating-point totals.
Shortfalls remain explicit, failed RPC requests are never treated as zero, and
old observations are labeled stale. Sample and live profiles are isolated.

Solana is a real data dependency, not just a wallet-connect screen. A server-side
adapter reads finalized token accounts for canonical devnet USDC, validates the
owner, mint, token program, decimals, and account state, then sums the matching
balances. Frozen balances are excluded from usable funds, and detected delegation
is disclosed. The interface exposes the observation time and source slot. A
genuine devnet read has been verified both through the adapter and through the
complete application API route. This demonstrates a read of existing token
accounts, not a transfer, a controlled test wallet, or a verified client payment.

The build process started with the financial rules and acceptance examples,
followed by the deterministic engine, local planning state, read-only Solana
adapter, and interface integration. The design centers on “After the line”:
committed money sits above a visible boundary, and the amount left is explained
below it. Next.js, React, and TypeScript keep the application in one codebase.
Recorded checks include 285 unit/component tests, 18 desktop/mobile browser tests,
lint, TypeScript, and a production build. The real-network integration was tested
separately from the offline and mocked suites.

This is a devnet prototype, not a production financial service. It requests no
private keys or signatures and performs no transfers. Financial labels stay in
browser storage, which is not encrypted, backed up, or synced; public-address
lookups reach the hosting and RPC infrastructure. Commitments are manual, and
there is no bank sync, automated bill settlement, or verified receipt matching.
The code is published on GitHub, and a public devnet app is deployed on Vercel.
The hosted sample, purchase preview, mobile layout, and a genuine finalized
devnet API read have been checked. The snapshot endpoint also has a hosting-level
rate limit. The demo video and presentation will follow later. Next steps include
freelancer usability testing, broader production hardening, verified incoming
receipts, and user-confirmed reconciliation.

## Form links

| Form field | Value / status |
|---|---|
| Link to Code | https://github.com/puri-adityakumar/afterbills |
| Link to Demo Video | Deferred, not recorded or uploaded |
| Live Demo Link | https://afterbills-seven.vercel.app |
| Link to Presentation | Deferred, not created or uploaded |

## Short description

A read-only cash-flow planner for freelancers paid in Solana USDC. See what
remains after bills and a buffer, preview a purchase, and model late client
payments without counting unpaid invoices as money you already have.

## Evidence and scope

- Working source: [GitHub](https://github.com/puri-adityakumar/afterbills).
- Public app: [AfterBills](https://afterbills-seven.vercel.app).
- Direct sample: [Try a sample plan](https://afterbills-seven.vercel.app/app?mode=sample).
- Product screenshots: [README product tour](../README.md#product-tour).
- Recorded checks and real devnet-read details: [VALIDATION.md](VALIDATION.md).
- Target track: **Best Consumer App on Solana**.
- No mainnet use, user traction, interviews, official jury score, automatic
  reconciliation, or completed submission is claimed.

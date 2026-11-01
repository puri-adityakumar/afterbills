# AfterBills

![AfterBills: Your balance isn't your budget. Read-only planning for Solana USDC.](docs/assets/banner.png)

**A cash-flow planner for freelancers paid in Solana USDC.**
See what remains after bills and a buffer, without counting money you haven't received.

[Screenshots](#product-tour) · [Quick start](#quick-start) · [Architecture](#architecture) · [Validation](docs/VALIDATION.md) · [Submission details](docs/SUBMISSION.md)

> **Devnet prototype. Read-only. Browser-local.**
> No wallet connection, private keys, signatures, or transfers.
> Devnet tokens have no monetary value. This is a planning tool, not financial advice.

**Live demo:** pending Vercel repository authorization.
**Code:** [github.com/puri-adityakumar/afterbills](https://github.com/puri-adityakumar/afterbills).

## Why AfterBills?

A wallet can tell you that you have 1,200 USDC. It cannot tell you that 770 is
already needed for bills, that you want to keep a 150 buffer, or that an unpaid
client invoice might arrive late.

AfterBills puts a clear line between **money already here** and **money only
expected**. The main result is backed by visible arithmetic, not a forecast.

```text
Observed usable balance                  1,200 USDC
− Included open bills                      770 USDC
− Planning reserve                         150 USDC
──────────────────────────────────────────────────
After bills and reserve                    280 USDC
Daily planning pace over 14 days             20 USDC

Expected client invoice                    800 USDC  → not included above
```

These are fictional sample figures. A reserve is a planning deduction, not locked funds.

## Product tour

### A funded answer, with its proof

![Desktop sample plan showing 280 USDC after bills and reserve, visible arithmetic, dated bills, and a separate 800 USDC expected invoice.](docs/assets/dashboard.png)

### Try a purchase before changing anything

Previewing a 180 USDC purchase leaves 100 USDC, or a rounded-down 7.14 per day.
The original plan remains visible. No money moves and no expense is saved.

![Purchase preview showing a 180 USDC what-if while preserving the original funded plan.](docs/assets/purchase-preview.png)

<details>
<summary>Landing page and mobile layout</summary>

![Landing page explaining the difference between a wallet balance and a budget.](docs/assets/landing.png)

<img src="docs/assets/mobile.png" width="320" alt="390-pixel mobile sample plan with a 280 USDC funded result and an explicit devnet label.">

</details>

All product screenshots are real local production-build captures using the
fictional sample, taken on November 1, 2026. They are not live wallet balances.

## What you can do

| Feature | What it means |
|---|---|
| Start without a wallet | Explore a clearly labeled sample with no account or setup. |
| Watch a public devnet address | Read finalized canonical USDC balances, with source slot and observation time. |
| Plan your commitments | Add, edit, and remove dated bills; set a reserve and timezone. |
| Keep invoices separate | Record expected income without inflating the funded amount. |
| Preview a purchase | Compare the original plan with one hypothetical purchase. |
| Model a late payment | Shift expected invoices by seven days in a separate conditional outlook. |
| Inspect the calculation | Review included bills, assumptions, and exact token base units. |
| Keep notes in your browser | Isolated sample/live profiles, local persistence, explicit clearing, and storage warnings. |

Shortfalls are shown explicitly. Failed balance reads are **unknown or stale,
never silently zero**. Frozen balances are excluded from usable funds; detected
token delegation produces a warning.

## Quick start

### Prerequisites

- **Node.js 24** and **npm 11** are the tested versions.
- No wallet, API key, Solana CLI, SOL, or funded account is required.

```sh
git clone https://github.com/puri-adityakumar/afterbills.git
cd afterbills
npm ci
npm run dev
```

Open [127.0.0.1:3000](http://127.0.0.1:3000), then choose **Try a sample plan**.
Or go directly to [/app?mode=sample](http://127.0.0.1:3000/app?mode=sample).
To try live reads, use **Watch a Solana address** and enter a public devnet
address, never a private key or seed phrase.

For a local production preview:

```sh
npm run build
npm run start
```

Local servers bind to loopback. Stop an existing server before rebuilding.

### Environment

The default public Solana devnet endpoint works without configuration.
To use your own provider, copy `.env.example` to `.env.local` and set values privately.

| Variable | Default | Purpose |
|---|---|---|
| `SOLANA_RPC_URL` | `https://api.devnet.solana.com` | Server-only RPC endpoint. |
| `AFTERBILLS_NETWORK` | `devnet` | The only supported network; other values fail closed. |

Do not prefix an RPC credential with `NEXT_PUBLIC_` or commit `.env.local`.
The API fixes the network, canonical USDC mint, and six decimals server-side.
It does not accept arbitrary RPC URLs or token mints.

## Architecture

One Next.js application. Local planning and chain observation are separate.
There is no database, custom Solana program, or money-moving endpoint.

```mermaid
flowchart LR
  subgraph Browser["Browser · private planning state"]
    Sample["Fictional sample"] --> Profiles["Isolated profile store"]
    Inputs["Bills, reserve, invoices"] --> Profiles
    Profiles <-->|"versioned plans"| Storage[("Local storage")]
    Profiles --> Engine["Pure bigint budget engine"]
    Engine --> Funded["Funded amount + purchase what-if"]
    Profiles --> Forecast["Separate conditional invoice outlook"]
    Address["Public devnet address"] --> Client["Read-only snapshot client"]
    Client -->|"validated observation"| Profiles
  end
  subgraph Server["Next.js · server-only"]
    API["POST /api/solana/snapshot"]
    Adapter["Allowlisted RPC adapter"]
    API --> Adapter
  end
  Client -->|"owner + optional minimum slot only"| API
  Adapter <-->|"finalized token-account reads"| Solana["Solana devnet · canonical USDC"]
```

**Financial labels never enter the snapshot request.** Public-address queries do
reach hosting and RPC infrastructure. Local storage is not encrypted or synced.

### Financial invariants

- `fundedNet = usableBalance − includedOpenBills − reserve`.
- Unpaid invoices affect only conditional forecasts, never `fundedNet`.
- A purchase preview subtracts from the funded result without mutating the plan.
- Amounts use integer base units and `bigint`, not floating-point accounting.
- Positive display values round down; shortfalls round up to avoid hiding tiny deficits.
- Plans cover 14 calendar dates in the selected timezone, including overdue open bills.
- Live windows roll forward with the date. The labeled sample retains fixed dates.
- A manually marked received invoice never credits an observed balance again.

### Stack and layout

**Next.js 16 · React 19 · TypeScript 6 · Solana RPC · plain CSS**

Exact dependency versions are pinned in `package.json` and `package-lock.json`.
Instrument Sans is self-hosted. Tests use Vitest, Testing Library, Playwright, and axe.

```text
src/
├── app/                  Routes, metadata, and snapshot API
├── contracts/            Shared types and application boundaries
├── domain/               Exact money, dates, budgets, and forecasts
├── features/             Dashboard, forms, and purchase preview
├── server/solana/        Validated read-only RPC adapter
├── state/                Profiles, persistence, and observation freshness
├── fixtures/             Explicitly fictional sample
└── styles/               Responsive layouts and reduced-motion rules
tests/
├── domain/               Financial invariants and date boundaries
├── solana/               Adapter and route validation
├── planning/             Persistence, isolation, and user actions
├── ui/                   Rendering and callbacks
├── e2e/                  Desktop/mobile browser flows
└── integration/          Opt-in real devnet read
```

## Validation

Recorded local results, October 31, 2026:

| Check | Result |
|---|---|
| Unit and component tests | **285 passed**; one opt-in network test skipped by default |
| Browser tests | **18 passed** across desktop and mobile Chromium |
| Lint / TypeScript / production build | **Passed** |
| Opt-in real devnet integration | **Passed separately**, including a complete API-route read |
| Automated accessibility | No axe violations on the sampled pages and settings dialog |
| Production dependency audit | No vulnerabilities reported at the time of the check |

```sh
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

If needed, install Chromium with `npx playwright install chromium` before e2e.
Build first; the browser suite starts its own production server.
Ordinary tests do not require network access. To opt into a real devnet read:

```sh
RUN_LIVE_RPC=1 npm test -- tests/integration/live-read.test.ts
```

[Validation evidence and limitations →](docs/VALIDATION.md)
Mocked tests and screenshots are not presented as blockchain settlement evidence.
Mobile checks use Chromium viewports, not physical devices or Safari.

## Trust boundaries and current limits

- **Devnet only.** Test tokens, one watched address, one supported mint, a 14-day plan.
- **Read-only.** No custody, signatures, transfers, wallet connection, automatic payments,
  or verification of invoice receipts. An address lookup does not prove ownership.
- **Manual inputs.** Results cover only the bills and assumptions you enter, not your
  entire financial life. They do not guarantee affordability or payment arrival.
- **Browser-local data.** Notes are not encrypted, authenticated, backed up, or synced.
  Use fictional financial labels when exploring or sharing the prototype.
- **Bounded RPC.** Request validation, timeouts, same-origin checks, no-store responses,
  and best-effort in-process limiting are implemented. Durable hosting-level abuse
  controls remain a public-release gate.
- **Prototype hosting.** Vercel deployment is authorized but currently blocked by its
  GitHub repository-access check. No public app URL is claimed. Search indexing remains disabled.

## Roadmap

- [x] Exact funded calculation and inspectable arithmetic
- [x] Dated bills, reserve, expected invoices, and local persistence
- [x] Purchase preview and separate seven-day payment-delay scenario
- [x] Real finalized devnet USDC reads and explicit stale/error states
- [x] Desktop/mobile tests, keyboard dialogs, and reduced-motion support
- [ ] Verified public Vercel deployment
- [ ] Demo video and presentation, planned for a later step
- [ ] Freelancer interviews and usability validation
- [ ] Verified incoming receipts and user-confirmed reconciliation
- [ ] Export/import and additional planning horizons

Unchecked items are planned, not working features.

## Project documentation

| Document | Contents |
|---|---|
| [Submission details](docs/SUBMISSION.md) | Paste-ready checkpoint description and honest link status |
| [Product requirements](docs/PRD.md) | Audience, scope, financial rules, and acceptance examples |
| [Technical specification](docs/TECHNICAL_SPEC.md) | Contracts, architecture, storage, and Solana reads |
| [Design direction](DESIGN.md) | “After the line” concept, typography, and interaction principles |
| [UI specification](docs/UI_SPEC.md) | Layouts, forms, responsive behavior, and error states |
| [Validation](docs/VALIDATION.md) | Actual test results, devnet evidence, and release gates |
| [Research](research/RESEARCH.md) | Source register and product assumptions |
| [Checkpoint](docs/CHECKPOINT.md) | Submission checklist and deferred video/deck outlines |

Built for the **Best Consumer App on Solana** track.

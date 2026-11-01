# AfterBills

**Your balance isn't your budget.**

A read-only cash-flow planner for freelancers paid in Solana USDC.
It separates money already received from unpaid invoices, reserves upcoming bills,
and explains what remains over an explicit planning period.

## Status

**Working prototype, built 2026-10-31.**
Source repository: [puri-adityakumar/afterbills](https://github.com/puri-adityakumar/afterbills).
The user explicitly approved the available model rather than waiting for GLM.
No GLM usage is claimed. No public app deployment, recording, or rendered
presentation has been created.

This is a new project. The sibling `../agenttab/` directory is unrelated earlier
work and was not modified or reused.

## Run locally

Tested with **Node 24** and **npm 11**. No wallet, funded account, API key, or
Solana CLI is needed to try the sample or read a public devnet address.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`. Choose **Try a sample plan**, or watch a public
Solana address. Never enter private keys or seed phrases.

For a production preview:

```sh
npm run build
npm run start
```

Servers bind to loopback. Stop an existing server before rebuilding.

### Optional RPC configuration

The server defaults to Solana's public devnet endpoint. For your own provider,
copy `.env.example` to `.env.local` and set `SOLANA_RPC_URL` privately.
`AFTERBILLS_NETWORK` must remain `devnet`. Never put a credential URL in a
`NEXT_PUBLIC_` variable. Network, six decimals, and canonical USDC mint are
allowlisted, not caller-configurable.

## What works

- Distinct fictional sample and live read-only devnet profiles.
- Finalized canonical USDC reads across matching token accounts, with frozen
  funds excluded and token delegation disclosed.
- Add/edit/remove bills, add/edit/cancel expected invoices, reserve and timezone.
- Exact bigint funded calculation, rounded-up shortfalls, inspectable base units.
- Purchase preview preserving the original plan, and a separate seven-day-late
  conditional outlook with accessible daily comparisons.
- Browser-local persistence, selected-profile clearing, corruption preservation,
  storage-failure warnings, refresh errors, stale references, and profile isolation.
- Responsive desktop/mobile layouts, native dialogs, keyboard focus and reduced motion.

The canonical sample has 1,200 USDC, 770 of bills, and a 150 reserve: **280 left,
20/day**. The unpaid 800 invoice never increases that funded amount. Previewing
180 leaves **100, about 7.14/day**, without a transaction or permanent mutation.

## Checks

```sh
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

If Chromium is missing, run `npx playwright install chromium` before e2e tests.
Browser tests start the production server automatically, so build first.
The ordinary test suite is offline; the real RPC test is separately opt-in:

```sh
RUN_LIVE_RPC=1 npm test -- tests/integration/live-read.test.ts
```

See [validation and real devnet evidence](docs/VALIDATION.md) for actual results,
screenshots, and remaining release gates. Mocked browser/adapter tests are not
presented as live blockchain evidence.

Verified locally: **285 unit/component tests, 18 desktop/mobile browser checks,
production build, lint, and typecheck pass**. The opt-in real devnet test also
passed separately. Automated accessibility scans found no violations in the
tested pages/settings dialog.

## Privacy and limitations

- Devnet tokens have no real value. USDC-unit estimates are not financial advice.
- Plans cover only listed commitments for one address and one mint over 14 days.
- Notes remain in local storage, **not encrypted, backed up, authenticated, or synced**.
  Public addresses reach hosting and RPC infrastructure; financial labels do not.
- An address lookup does not establish ownership or spending control.
- No signatures, transfers, custody, wallet connection, receipt verification, or
  automatic reconciliation. The planner never adds an invoice to an observed balance.
- In-process rate limiting is best effort, not durable abuse protection.
  Configure hosting-level limits and security headers before public deployment.
- This unpublished prototype deliberately disallows indexing. Set real metadata,
  origin/CSP policy, hosting limits, and provider credentials before publishing.

## Read in this order

1. [Research and source register](research/RESEARCH.md): evidence, inspiration,
   constraints, unknowns, and recommended decisions.
2. [PRD](docs/PRD.md): users, scope, financial rules, requirements, and acceptance cases.
3. [Design direction](DESIGN.md): concept, palette, typography, and interaction language.
4. [UI specification](docs/UI_SPEC.md): desktop/mobile wireframes, screens, and states.
5. [Technical specification](docs/TECHNICAL_SPEC.md): architecture blueprint,
   data contracts, Solana reads, storage, and testing.
6. [Subagent task breakdown](docs/TASK_BREAKDOWN.md): bounded chunks, file ownership,
   dependencies, handoffs, and execution waves.
7. [Checkpoint checklist](docs/CHECKPOINT.md): five submission fields, demo story,
   evidence gates, and scope cuts.

## Decisions carried forward

- Name: **AfterBills**. Name/domain/trademark availability has not been checked.
- Target: **Best Consumer App on Solana**.
- Initial network: **devnet**, with persistent test-money labeling.
- One watched wallet, one supported token, one explicit planning period.
- No custody, private keys, signatures, transfers, smart contracts, or AI needed.
- x402, Aurora, Sui, Walrus, and Tatum are not requirements for this entry.
- Learn from product patterns; do not clone a previous entrant or reuse AgentTab.
- Stack: Next.js 16.4.3 App Router, React 19.3.1, TypeScript 6.0.3, plain CSS,
  self-hosted Instrument Sans, and a narrow server-side Solana RPC adapter.
  One app keeps browser-local planning separate from read-only chain access.

## Checkpoint

The user's form says **Mid-submission checkpoint**, due **November 2, 2026,
5:29 PM Asia/Kolkata (11:59 UTC)**. It has submission details, code, demo video,
live demo, and presentation fields. Only submission details are visibly marked
required. Plan to prepare all five; do not invent URLs or completion claims.

The core application is implemented locally. Publishing, account/resource
creation, real-money actions, commits, and submission remain separate actions
requiring authorization.

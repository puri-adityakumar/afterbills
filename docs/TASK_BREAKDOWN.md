# AfterBills: implementation chunks and status

**Build authorized; current model explicitly approved instead of waiting for
GLM.** C0-C4 are implemented. The parent handled foundation, local state/forms,
and integration; three independent inherited-model workers handled C1/C2/C3.
No GLM use is claimed.

| Chunk | Actual status |
|---|---|
| C0 | Complete: pinned dependencies, contracts, fixtures, initial build/lint/types |
| C1 | Complete: 125 passing domain tests |
| C2 | Complete: 109 passing adapter/route tests; independent real devnet API read recorded |
| C3 | Complete: landing/dashboard, responsive CSS, 13 passing UI tests |
| C4 | Complete: local profiles/forms/selectors; 38 passing tests |
| C5 | Complete: production build/lint/types, 285 unit/component tests, 18 browser checks, two visual passes |
| C6 | Setup/validation docs prepared; no recording/deck/public links |
| C7 | Not started; separately approved P1 only |

The sections below retain the original chunk contracts and estimates. Actual
verification results live in `VALIDATION.md`, not in estimated task durations.

## 1. Working agreement

- Project root: `/home/factory-user/solana-hackathon/afterbills/`.
- Do not touch sibling `../agenttab/` or the externally modified old clone paths.
- Read `AGENTS.md`, `docs/PRD.md`, `docs/TECHNICAL_SPEC.md`, `DESIGN.md`, and
  `docs/UI_SPEC.md`. PRD rules outrank a worker's preferred design.
- Lead handles small investigations, integration, test review, and fixes that fit
  a handful of calls. Do not launch extra agents merely to double-check work.
- Parallel workers are for C1/C2/C3: independent, sizeable ownership areas.
- At most **three implementation workers** at once. No shared-file edits.
- Lead alone owns root package/lock files, config, shared contracts, fixtures,
  app composition, documentation changes, and deployment decisions.
- A worker may add tests in its assigned directory. Ask the lead for any new
  dependency or shared-contract change; do not run simultaneous installers.
- Complexity tiers below are suggested task effort, not a promise of a particular
  model. Do not claim "Haiku" unless the environment actually selects it.
- No automatic remote writes, commit, push, deployment, wallet creation,
  real-money operation, or submission.

## 2. Dependency graph

```text
User authorizes implementation
             |
             v
    C0 foundation + frozen contracts (lead)
             |
       +-----+------+----------------+
       v            v                v
   C1 engine    C2 Solana reads   C3 UI system + views
       |            |                |
       +------------|----------+-----+
                    |          v
                    |   C4 local plans + forms
                    |          |
                    +-----+----+
                          v
               C5 integration + release QA (lead)
                          |
                          v
               C6 checkpoint artifacts (lead)
                          |
               User authorizes any publishing
                          |
                          v
               User reviews/submits checkpoint

After P0 is stable: C7 verified receipts/reconciliation (P1, optional)
```

No automatic launch of C7 to fill idle time. A first checkpoint does not depend
on a funded wallet, receipt parser, wallet-connect package, chart, or AI provider.

## 3. Chunk summary

| ID | Owner / suggested effort | Scope | Dependencies | Estimate |
|---|---|---|---|---|
| C0 | Lead | Foundation, compatible dependencies, contracts, labeled fixtures | Explicit build approval | 1-2 h |
| C1 | Worker, medium/heavy | Exact money, budget, purchase, forecast engine | C0 | 2-3 h |
| C2 | Worker, medium | Read-only balance adapter and API, network errors | C0 | 2-3 h |
| C3 | Worker, medium | Desktop/mobile UI system and presentational screens | C0 | 3-4 h |
| C4 | Worker, medium | Local persistence, bill/invoice/reserve forms, actions | C1 + C3 primitive handoff | 2-3 h |
| C5 | Lead | Compose app; fixture/live evidence; production QA | C1-C4 | 2-4 h |
| C6 | Lead | README, submission text, demo/deck content, evidence links | C5 actual results | 2-3 h |
| C7 | Worker, medium/heavy | Verified receipts and reversible invoice reconciliation | Stable C5; separate P1 approval | 3-5+ h |

These are uncertain estimates for focused engineering time, not completion
promises. Parallel elapsed time is not the sum of rows. Reserve 4-6 hours for
integration failures and user actions before the deadline.

## C0. Foundation and contract freeze

**Lead-owned.** Materialize the proposed stack only after build authorization.

Deliverables:
- New Next.js/TypeScript application inside this directory, not a clone.
- Version/peer-dependency compatibility check; one package manager and lockfile.
- Proposed scripts: `lint`, `typecheck`, `test`, `test:e2e`, `build`.
- `src/contracts/{model,ports,view-model}.ts`, matching the technical spec.
- `src/fixtures/` with canonical sample data and frozen test dates.
- Minimal root layout and empty app composition ready for worker imports.
- Safe config boundary and `.env.example` with no secrets.

Acceptance:
- Clean typecheck and minimal build.
- Contract fixtures validate; sample mode and live profiles are distinct.
- No server, wallet, token, deployment, or remote repository created without
  separate permission. No production capability claimed.

Handoff to all workers: exact dependency versions, shared types/ports, available
scripts, fixed fixtures, file-ownership map, and known compatibility gaps.

## C1. Deterministic financial engine

**Owned:** `src/domain/**`, `tests/domain/**`.
**Read-only:** contracts and fixtures. No UI, storage, RPC, or package changes.

Work:
1. Parse/format six-decimal units with bigint.
2. Validate calendar dates and include overdue/window-boundary bills correctly.
3. Calculate funded amount, reserve, deficit, and conservative daily pace.
4. Implement non-mutating purchase preview.
5. Produce expected and delayed conditional date-by-date forecasts.
6. Add every PRD example plus rounding/date/invoice-isolation tests.

Done:
- 1,200 - 770 - 150 = 280; adding expected 800 changes no funded value.
- Purchase 180 leaves 100 and 7.14/day; deficit example is 370.
- Delaying an invoice changes only conditional dates/paths.
- No floats for money, hidden `Date.now`, network call, or display-only math.
- Narrow domain tests and typecheck pass; report actual counts/results.

Ready-to-delegate brief:
> Implement C1 inside the AfterBills project using frozen contracts and fixtures.
> Read PRD financial rules and examples before coding. Own only domain modules
> and domain tests. Deliver a pure deterministic engine, no UI/network/state.
> Ask the lead for contract changes. Return API summary, changed files, exact
> test commands/results, edge cases, and known gaps. Do not publish or commit.

## C2. Read-only Solana balance integration

**Owned:** `src/server/solana/**`, snapshot route, `tests/solana/**`.
**Read-only:** shared types/config boundary. No browser UI or plan storage.

Work:
1. Configure allowlisted devnet mint and server-only RPC endpoint.
2. Validate public address and narrow request schema; no caller-controlled RPC URL.
3. Read all matching token accounts with finalized context.
4. Return exact usable/total/frozen amounts, slot/time, delegation warning.
5. Implement timeout, bounded retries, rate-limit and structured-error behavior.
6. Test zero versus unavailable, mismatched mint/owner/decimals, multiple accounts,
   malformed metadata, stale request boundaries, and credential-safe errors.

Done:
- No signing methods, secret keys, balance mutation, or arbitrary JSON-RPC proxy.
- Genuine zero distinguished from RPC failure.
- RPC credentials absent from browser/public errors.
- Adapter tests pass. If approved and reachable, record one real public-address
  read with network/mint/slot/time; otherwise state the network validation gap.
- No funded wallet required for a read. Do not revive the AgentTab faucet blocker.

Ready-to-delegate brief:
> Implement C2 only. Build the narrow devnet snapshot adapter/route from the
> technical spec; use raw unit strings and validate token identity. Financial
> notes must never be sent to the server/RPC. Own only assigned adapter/route/tests.
> Do not create wallets, mint tokens, transfer funds, deploy, or expose secrets.
> Report mocked-test results separately from any real RPC evidence.

## C3. UI system and presentational screens

**Owned:** `src/components/ui/**`, `src/features/dashboard/**`,
`src/styles/**`, `tests/ui/**`.
**Read-only:** shared view model/fixtures. Lead wires global style imports/routes.

Work:
1. Apply the concept, typography, tokens, spacing, and motion in `DESIGN.md`.
2. Build buttons, inputs, dialog/panel, status badge, money display, empty/error UI.
3. Build landing content and dashboard presentation as importable components.
4. Compose hero, arithmetic proof, bill/invoice lists, purchase sheet, and
   conditional outlook from view-model props and action callbacks.
5. Provide sample, zero, deficit, loading, stale, and storage-warning views.
6. Design 390px mobile explicitly; keyboard/focus/reduced-motion behavior.

Done:
- No own financial calculations, RPC calls, plan persistence, or hidden live mocks.
- A visible label distinguishes sample data, devnet money, and conditional income.
- Mobile has no horizontal table overflow; primary targets >=44px.
- Tests/visual evidence use actual components, not fake screenshots.
- Publish primitive APIs early so C4 can use them; freeze before parallel form work.

Ready-to-delegate brief:
> Implement C3, the AfterBills UI, not a generic finance dashboard. Read DESIGN
> and UI_SPEC. Use the frozen view model and callbacks only. Own UI primitives,
> dashboard presentation, styles, and UI tests; do not edit app routes/contracts.
> Keep arithmetic visible, invoices separate, and all failure states legible on
> mobile. No charts/motion dependencies without lead approval. Return component
> interfaces, screenshots if available, accessibility checks, and actual gaps.

## C4. Planning state, persistence, and forms

**Owned:** `src/state/**`, `src/features/planning/**`, `tests/planning/**`.
**Dependencies:** C1 engine API and C3 stable primitive API.

Work:
1. Versioned local profiles, sample isolation, reload, and clear selected profile.
2. Bill, invoice, and reserve forms with shared validation.
3. Profile switch/reset and abort hooks without cross-wallet leakage.
4. Purchase/scenario controls wired to domain functions; no stored fake money.
5. In-memory fallback if storage fails, visible corrupted-data recovery.
6. Roll the live 14-day window on local date changes/resume while keeping sample
   dates fixed; test midnight, timezone changes, and an old stored window.

Done:
- Notes stay in browser, not RPC requests/logs.
- Invalid typing never commits an invalid plan.
- Clearing sample never clears live data.
- Purchase preview can reset without mutating commitments.
- Optional manual invoice received state is explicitly unverified and does not
  credit the observed balance. No "paid bill" shortcut against stale data.
- Unit/component tests and typecheck pass.

Ready-to-delegate brief:
> Implement C4 using completed C1 functions and C3 primitives. Own only state,
> planning forms, and their tests. Read persistence, privacy, and reconciliation
> rules. Keep all money deterministic, financial notes local, profiles isolated,
> and purchase previews reversible. Do not modify domain/UI primitives/contracts
> without requesting a lead change. Report persistence/error tests and gaps.

## C5. Integration and release QA

**Lead-owned:** app composition, selectors/view-model integration, integration/e2e
tests, shared-config changes, and fixes that cross module boundaries.

Work:
- Wire C1-C4 into `/` and `/app`, using one source for calculated totals.
- Test sample -> live address -> sample, including stale in-flight responses.
- Complete canonical sample, deficit, purchase, delayed-invoice, and reload flows.
- Separately record a real finalized devnet read; no fixture-as-network claims.
- Production build; test desktop/mobile, focus, reduced motion, 200% zoom,
  contrast/axe, console errors, and public-bundle secret leakage.
- Verify privacy text and exactly what is stored/sent.

Done:
- Relevant lint, typecheck, unit/integration/e2e, and build scripts pass.
- Screenshots cover populated/empty/stale/deficit/purchase states.
- Failures fixed or explicitly remove the unready feature and update docs.
- No assertion of tested wallet support, deployed URLs, or real receipts without
  evidence. Keep publishing separate and authorized.

## C6. Checkpoint package and user handoff

**Lead-owned**, using `CHECKPOINT.md` and C5's actual evidence.

- Update README with real setup instructions and limitations.
- Fill submission narrative with implemented, planned, and tested work separated.
- Prepare a 2-4-minute demo script and a six-slide outline.
- Record/render only if the user authorizes that work; use relevant recording/
  presentation skills when producing actual artifacts.
- Prepare a deployment configuration; create remote repo/deploy/upload only when
  authorized. Confirm all five actual links manually after publication.
- Return the package for user review; do not submit the hackathon form.

Done: no fabricated URLs, metrics, interviews, integration claims, or video/deck.
If a deliverable is unavailable, record it as missing rather than conceal it.

## C7. Verified receipts and invoice reconciliation

**P1, not checkpoint-critical.** Start only when P0 is stable and extra work approved.
Own new receipt parser/service/tests and a new receipt UI subdirectory. The lead
coordinates existing route/contract changes; no concurrent C2/C3 ownership.

Deliver:
- Bounded discovery including owned token accounts; manual signature lookup.
- Finalized successful selected-mint positive-delta verification.
- Snapshot slot >= payment slot before reconciliation.
- User-confirmed partial allocations, undo, duplicate/replay protection, no
  double balance credit. Unsupported evidence stays unverified.
- Receipt evidence with explorer links and explicit history limitations.

Acceptance: repeated receipt import/matching never increases funded balance
twice; wrong mint/network/owner, failed tx, null metadata, and incomplete history
are handled. A controlled actual devnet receipt is a separate evidence gate.

## 4. Suggested one-day execution waves

| Elapsed time after approval | Work |
|---|---|
| Hours 0-2 | C0 and early RPC/config spike; freeze contracts. |
| Hours 2-6 | C1, C2, C3 in parallel. Lead resolves only cross-cutting decisions. |
| Hours 6-9 | C4; lead integrates completed engine/adapter and gathers real evidence. |
| Hours 9-13 | C5 end-to-end flows and production QA; fix failures. |
| Hours 13-16 | C6 narrative, README, video/deck preparation. |
| Hours 16-24 | Buffer, authorized publication, link checks, user review/submission. |

If time slips: remove charts (keep comparison list), wallet connect (keep public
address), manual received toggle, extra horizons, receipt matching, and visual
polish beyond legibility, in that order. Never cut exact calculations, error
honesty, sample labeling, or real read evidence.

## 5. Mandatory handoff format

```text
Chunk / scope completed:
Files changed:
Shared-file or dependency changes requested:
Commands run and exact pass/fail results:
Real network calls made (or none):
Evidence paths:
Known limitations / unfinished acceptance cases:
Assumptions or decisions needing lead resolution:
Next consumer of this output:
```

The lead marks a chunk complete only after its deliverables and acceptance gates
are actually verified. Test failures are not "mostly done."

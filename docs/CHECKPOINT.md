# AfterBills checkpoint package

Checkpoint checklist, updated 2026-11-01. Working app built and tested; GitHub
`main` is published. The user authorized Vercel deployment and explicitly chose
direct CLI upload after GitHub linking failed. The public app is available at
https://afterbills-seven.vercel.app. No hackathon submission is claimed.
See `VALIDATION.md` for evidence
and `SUBMISSION.md` for the paste-ready description and current form links.

## 1. Deadline and form

User screenshot: **Mid-submission checkpoint**, November 2, 2026,
**5:29 PM Asia/Kolkata**, equivalent to **11:59 UTC**.

Only submission details visibly carries the Required marker. The challenge's
published final requirements include working demo, code/README/setup, 2-4-minute
video, and Solana explanation. Prepare all five form fields if feasible, without
claiming that the screenshot marks every field mandatory.

| Field | Planned content | Current status / gate |
|---|---|---|
| Submission details | Problem, actual work, process, meaningful Solana use, limitations, next steps | Ready in [SUBMISSION.md](SUBMISSION.md); not submitted |
| Code link | New AfterBills repository with actual code and setup README | [GitHub source repository](https://github.com/puri-adityakumar/afterbills) |
| Demo video | 2-4 minutes showing sample vs real reads and working product | Deferred by the user; not recorded/uploaded |
| Live demo | Public working app, devnet + explicit sample mode | [Public app](https://afterbills-seven.vercel.app), deployed directly and checked without sign-in |
| Presentation | Six-slide pitch with honest screenshots/status | Deferred by the user; outline only, not rendered/uploaded |

Submit under **Best Consumer App on Solana**. Do not associate x402/Aurora merely
because they were researched; their working integrations are not in this scope.

## 2. Minimum convincing checkpoint

- A new codebase, not the AgentTab clone.
- Clear desktop/mobile sample flow: bills + reserve + funded amount.
- Working read-only devnet address lookup and timestamped token balance.
- Expected invoices excluded from funded amount.
- Purchase preview and separate late-payment comparison.
- Reload/privacy/error behavior, including real zero versus RPC failure.
- Actual code tests and an evidence-backed README.

If a real incoming payment cannot be staged, show a genuine live balance read
and a separately labeled synthetic scenario. Do not animate a fixture balance
change and call it a blockchain settlement. Receipt matching is a later feature.

## 3. Evidence register to fill after building

| Evidence | Required record | Current status |
|---|---|---|
| Domain correctness | Command/output for PRD examples and edge-case tests | 125 domain tests pass; full suite in `VALIDATION.md` |
| Live Solana read | Network, selected mint, public test address, slot, observation time, sanitized response | Real finalized adapter and full POST reads recorded |
| Failure behavior | Stale/timeout/zero screenshots and corresponding tests | Core browser flows pass; expanded results in `VALIDATION.md` |
| Responsive UX | Desktop and 390px screenshots; keyboard/reduced-motion checks | Production Chromium desktop/mobile captures and checks |
| Production build | Exact build/lint/typecheck/e2e results | Build/lint/types pass; see current browser results |
| Public app | User-authorized URL tested in a clean browser | Public landing, sample, purchase preview, 390px layout, and real hosted API read checked |
| Code | User-authorized repository URL and accurate setup instructions | [GitHub repository](https://github.com/puri-adityakumar/afterbills), with setup README |
| Recording/deck | Real artifact paths and accessible published links | Not created |

Evidence must use synthetic financial labels or a user-approved test wallet.
Do not publish private client names, invoices, bills, API keys, or device data.

## 4. Submission narrative

### Ready-to-paste description

Use [SUBMISSION.md](SUBMISSION.md), which includes the full implementation
narrative, process, actual Solana integration, validation, and remaining limits.
The source is published and the public Vercel app is working. Video and
presentation are explicitly deferred. Do not describe those as complete.

### Structure after implementation

1. **Problem and user:** irregularly paid freelancer, wallet balance vs commitments.
2. **What actually works:** list only passed P0 flows.
3. **How Solana matters:** exact mint, real finalized balance, source/slot/time.
4. **Process:** original implementation inspired by product patterns, deterministic
   engine first, independent UI/adapter work, integration checks.
5. **Evidence:** actual links/test results, sample/live distinction.
6. **Known limitations:** local-only storage, manual obligations, one wallet/asset,
   devnet money, incomplete or absent receipt matching.
7. **Next:** only planned P1 items, clearly labeled as future.

## 5. Proposed demo script, about 3 minutes

| Time | Action | Evidence/copy |
|---|---|---|
| 0:00-0:20 | Introduce freelancer problem | "Your balance isn't your budget." No traction claims. |
| 0:20-0:55 | Open visibly labeled fictional sample | 1,200 balance, 770 bills, 150 reserve -> 280. |
| 0:55-1:20 | Show 800 expected invoice and delay | Funded 280 stays unchanged; conditional path shifts. |
| 1:20-1:45 | Preview 180 purchase | 100 left; approximately 7.14/day. Preview only, reset. |
| 1:45-2:15 | Switch to actual public devnet address | Show actual token balance, mint/network, slot/time. A real zero is acceptable. |
| 2:15-2:40 | Refresh or demonstrate explicit stale/error behavior | No signature or money movement; no silent sample fallback. |
| 2:40-3:00 | Close with scope and next steps | Local data/manual commitments; receipts P1 if not implemented. |

If a real receipt feature is later verified, substitute that evidence for part
of the live-read segment, keeping duration 2-4 minutes. Do not imply its completion
before C7 passes.

## 6. Six-slide presentation outline

1. **AfterBills**: name, audience, one-sentence promise.
2. **Problem**: wallet balance cannot see rent, buffer, and uncertain invoices.
3. **Product**: real screenshot of funded amount and arithmetic proof.
4. **Decision loop**: purchase preview and separate delay scenario.
5. **Solana and trust**: read-only data flow, token identity, privacy, actual evidence.
6. **Current status / next steps**: implemented vs planned, user-validation goals.

This is a content outline, not a generated deck. When asked to produce slides,
use the presentation skill and inspect the rendered output. Use the actual
implemented interface, not fabricated product screenshots.

## 7. Scope cuts if the deadline gets tight

Keep: exact math, visible assumptions, sample labeling, actual devnet read,
funded/expected separation, input validation, stale/zero distinctions, code/README.

Cut first: chart animation, extra horizon controls, wallet-connect shortcut,
manual received status, recurring bills, receipt matching, export/import,
AI chat, x402, Aurora, and multi-chain features.

If only planning is ready at checkpoint time, submit planning truthfully if the
form permits it. Do not invent a working demo to satisfy a field.

## 8. User-owned external actions

Before any external write, obtain permission for the actual action:

- Create/push a repository under the user's chosen account.
- Create a hosting project and deployment; configure credentials privately.
- Upload/share a video or deck, choosing public/unlisted visibility.
- Obtain any devnet funds or authorize a test transfer if recording real receipt
  changes. No mainnet funds are needed for AfterBills P0.
- Final review of the form and submission.

The plan does not authorize these actions. Prepare local artifacts first, verify
all actual links after publication, and leave the final submission with the user
unless explicitly asked to submit.

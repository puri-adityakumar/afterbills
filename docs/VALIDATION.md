# AfterBills validation

Local implementation validated on 2026-10-31. Code repository:
[puri-adityakumar/afterbills](https://github.com/puri-adityakumar/afterbills),
with publication separately authorized by the user on 2026-11-01.
Public direct-source Vercel deployment followed on 2026-11-01; see the hosted
checks below. No recording, rendered deck, transfer, or wallet creation.

## Source checks

| Check | Actual result |
|---|---|
| `npm test` | 285 passed; 1 deliberately skipped live-network test |
| `npm run lint` | Passed, zero warnings |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; landing, app, snapshot API, icon, robots, 404 |
| `npm audit --omit=dev` | Zero reported production dependency vulnerabilities |
| `RUN_LIVE_RPC=1 npm test -- tests/integration/live-read.test.ts` | Passed separately against real devnet |
| Playwright suite | 18 passed across desktop and mobile Chromium configurations |
| Production visual passes 1 and 2 | Home/app/404 inspected at desktop/mobile, keyboard and reduced motion; final pass has no recorded request or console errors |

Tests cover exact units, 14 calendar dates, exclusive window end, overdue bills,
invoice exclusion, delay before overdue clamping, reserves, tiny deficits,
amounts above safe-integer range, DST, multiple/frozen/delegated token accounts,
malformed and wrong-owner/mint/program responses, endpoint validation, safe
upstream failures, local storage isolation/corruption, and UI callbacks.

Initial browser QA found one low-contrast decorative index, which was removed.
Some first-pass assertions assumed numbers omitted the visible USDC suffix; those
selectors were corrected without changing the financial results. A stale preview
process also caused a failed rerun; stopping the actual Next process and relaunching
the current production build resolved it. Final test results are not inferred from
those interrupted runs.

The final expanded checks additionally caught keyboard focus leaving the modal's
content at its last control. Explicit Tab/Shift+Tab wrapping now keeps focus in
the dialog, and Escape restores the trigger. The final 18-test suite passes,
including ten consecutive dialog Tab stops, settings-dialog axe, very long exact
amounts without horizontal overflow, 44px navigation targets, and freshness
changing precisely at the 60-second deadline rather than at the next poll.

Browser tests use synthetic profiles and mocked HTTP snapshots, except for the
separate real-network checks below. Mobile means a Chromium iPhone-sized viewport,
not physical hardware or Safari.

## Genuine finalized devnet evidence

The adapter test succeeded at `2026-10-31T20:53:02.389Z`, slot `517260857`.
The complete local POST route was then exercised independently:

```text
HTTP status: 200
Cache-Control: no-store
Observed at: 2026-10-31T20:58:50.875Z
Network: devnet
Owner queried: 11111111111111111111111111111111
Mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
Decimals: 6
Slot: 517262311
Usable balance units: 1033647698
Total balance units: 1033647698
Frozen units: 0
Delegated warning: false
```

The owner is the well-known public system-program address, not a wallet created,
funded, controlled, or supplied by the user. This demonstrates a read of existing
token accounts, not a claim that anyone can spend their funds. Balances can change.
No signing, airdrop, transaction, custody, or verified client receipt occurred.
The fictional sample's 1,200 USDC is separate from this real observation.

## Screenshot and audit evidence

Repository documentation refreshed on 2026-11-01. The tracked images in
`docs/assets/` are real production-build captures of the fictional sample:
landing, desktop dashboard, 180 USDC purchase preview, and 390px mobile view.
The banner is an original illustrative SVG with a PNG export, not a wallet read.
No application logic changed in this documentation refresh.
The README architecture diagram parsed successfully with Mermaid 12.2.0.
Relative file/image links and code fences passed checks across the eight root/docs
Markdown files; `git diff --check` passed. The initial documentation-only commit
preserved prior application results. The subsequent deployment checks below
include a fresh unit/component, lint, and typecheck run; the 18-test local browser
suite retains its October 31 validation date.

## Public deployment · 2026-11-01

Live app: **https://afterbills-seven.vercel.app**.
The user explicitly authorized direct CLI deployment. Vercel CLI 65.9.0 used the
saved local login and uploaded the application to the standalone AfterBills
project. GitHub repository linking is not required and automatic Git deployments
are not configured. The hosted production build and TypeScript compilation passed.
No plan upgrade, paid RPC credential, wallet, funding, or transaction was needed.
Final deployment: `dpl_FMovo4R1FeXKpeexAw3y3QKYCaFv`, state `READY`.

Hosted checks passed without a Vercel sign-in:

- Landing HTTP 200; sample dashboard displays the fictional funded 280 USDC.
- A 180 USDC purchase preview shows 100 remaining and a 7.14 daily pace.
- At 390px, sample labeling remains visible and document width is 390px, with
  no horizontal overflow.
- The live-address browser flow reads the public reference address successfully,
  showing 1,033.64 USDC with finalized slot 517,373,532 at 04:23:35 UTC.
- Invalid-address POST returns 400; a foreign Origin returns 403.
- A genuine finalized devnet POST returns 200 and `Cache-Control: no-store`.
- `nosniff`, frame denial, strict-origin referrer policy, and disabled
  camera/microphone/geolocation headers are present.

Hosted devnet read, using the same well-known public system-program address
documented above, not a controlled or funded test wallet:

```text
Observed at: 2026-11-01T04:21:03.508Z
Slot: 517372900
Network: devnet
Usable balance units: 1033647698
HTTP: 200
Cache-Control: no-store
```

The initial hosted axe scan identified a mode-banner landmark issue. The banner
was changed to a named `Plan mode` section, and the existing UI tests now assert
the landmark in both sample and live modes. After that change, `npm test` passed
285 tests (one opt-in network test skipped), and lint/typecheck passed again.
The fix was redeployed and the public sample rescanned: zero violations in
embedded axe 4.12.1, with one incomplete rule covering two decorative minus signs.
The two decorative deduction symbols require manual contrast review in the older
embedded axe engine; their previously measured contrast is 6.26:1.

The AfterBills-only Vercel WAF rule limits `/api/solana/snapshot` to 30 requests per
IP per 60-second fixed window. WAF counters are per region, not a universal
cross-region quota. The in-process limiter remains defense in depth. The Hobby
plan includes one such rule and 1,000,000 allowed requests; no plan was upgraded.
The published project firewall reports one active rule and no pending changes
at publication. Other projects and team-wide firewall settings were not changed.

Dependency audit on 2026-11-01: `npm audit --omit=dev` reports zero vulnerabilities.
The full development audit reports 16 moderate advisories in the ESLint/minimatch
tooling tree. The suggested automatic fixes include incompatible major downgrades
and were not applied. These remain maintenance work, not a clean full-audit claim.

## Earlier local visual evidence

Local generated evidence is ignored by Git:

- `artifacts/screenshots/`: manual production landing/dashboard captures.
- `test-results/`: desktop/mobile landing, purchase, shortfall, stale,
  unknown/empty, zero, and rollover captures from browser tests.
- `.shots/pass-1/` and `.shots/pass-2/`: production visual, keyboard, reduced-motion, performance,
  and accessibility reports.
- `artifacts/html-audit.log` and `artifacts/html-audit-final.log`: HTML/metadata audit.

Pass 1 measured mobile LCP at 632 ms on the landing page and 2,012 ms on the
dashboard, with 4x CPU/slow-4G emulation. CLS was 0.02 and 0 respectively, and
scrolling measured about 60 fps. These are local synthetic measurements, not
field-user metrics. Skip link came first and all inspected focus stops were visible.
Resting motion is intentionally absent for financial information.

HTML audit: zero failures, 13 warnings. Most concern deliberately missing
unpublished canonical/share/sitemap metadata; the app's financial content is
client-rendered. An explicit noopener warning was fixed. Three 404-page
`net::ERR_ABORTED` events were canceled Next.js app prefetches, not JavaScript
exceptions; the recovery link's unnecessary dynamic prefetch was removed.
Pass 2: mobile LCP **660 ms home / 1,984 ms app / 572 ms 404**; CLS **0.02 /
0 / 0**; scroll FPS approximately **60**. Zero reported overflow, hidden
reduced-motion text, axe violations, invisible sampled focus, browser exceptions,
or failed requests on all three page types. The HTML audit has **0 failures,
12 warnings**, all retained as unpublished metadata/CSR release considerations.

An independent evidence-only first-pass critique estimated **7.15/10**, not an
official jury score. It identified a 23px-wide desktop Bills navigation link,
which is now at least 44px and tested. Its two contrast-review nodes were
non-text minus signs: the actual `#52636B` on white contrast is **6.26:1**.
Long-amount and dialog-keyboard checks and screenshots were added to close its
verification gaps.

The fresh final evidence-only critique estimated **7.54/10**: Design **7.5**,
Usability **7.8**, Creativity **7.0**, Content **8.0**. This is an independent
estimate, not an official award or a claim that every craft target was achieved.
It praised the funded-versus-expected distinction and phone composition. Remaining
non-blocking improvements are a more deliberate compact headline for extreme
amounts (currently fully readable across multiple lines) and stronger concept-led
interaction feedback without animating authoritative financial totals.

The sampled pass-2 report predates the final navigation-target enlargement and
explicit modal wrapping. The final 18-test browser run verifies the 44px Bills
target, ten dialog Tab stops, Escape/return focus, and settings-dialog axe checks.
Screenshots alone do not establish full keyboard coverage, WCAG conformance, or
physical-device performance. No further functional blocker was identified.

Use only synthetic screenshots in public materials. Do not publish browser
profiles, RPC URLs, traces containing real notes, or credentials.

## Limitations and public-release gates

- The first Git-linked project request failed with a Vercel repository-access
  error. The user then chose direct CLI upload, which succeeded. The live project
  is not connected to GitHub; source pushes do not automatically update the app.
- Financial input is manual and browser-local, not encrypted or backed up.
- One watched address, canonical devnet USDC, and a fixed 14-day horizon.
- No wallet connection, receipt matching, transfers, automatic bill settlement,
  partial reconciliation, recurring rules, accounts, or multi-device sync.
- RPC refresh is explicit. After 60 seconds or a failed refresh, the last success
  is a stale reference, never a replacement zero or a fresh recommendation.
- In-process API limiting is non-durable; the deployed snapshot API additionally
  uses the scoped Vercel WAF rule described above. Production financial use still
  needs broader provider/CSP/security review, monitoring, and operational controls.
- The public prototype intentionally keeps `noindex` and disallows crawling.
  A production canonical/sitemap/social-metadata package is not claimed.
- No interviews, traction, official Awwwards score, actual mobile hardware/Safari
  testing, real receipt verification, or production readiness is claimed.

# AfterBills validation

Local implementation validated on 2026-10-31. Code repository:
[puri-adityakumar/afterbills](https://github.com/puri-adityakumar/afterbills),
with publication separately authorized by the user on 2026-11-01.
No public app deployment, recording, rendered deck, transfer, or wallet creation.

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

- Financial input is manual and browser-local, not encrypted or backed up.
- One watched address, canonical devnet USDC, and a fixed 14-day horizon.
- No wallet connection, receipt matching, transfers, automatic bill settlement,
  partial reconciliation, recurring rules, accounts, or multi-device sync.
- RPC refresh is explicit. After 60 seconds or a failed refresh, the last success
  is a stale reference, never a replacement zero or a fresh recommendation.
- In-process API limiting is non-durable. Public hosting requires platform-level
  abuse/cost limits and a reviewed provider/origin/CSP configuration.
- Unpublished metadata intentionally uses `noindex` and disallows crawling.
  Public canonical URL, sitemap, share artwork, deployment and external links
  must reflect real resources, not invented links.
- No interviews, traction, official Awwwards score, actual mobile hardware/Safari
  testing, real receipt verification, or production readiness is claimed.

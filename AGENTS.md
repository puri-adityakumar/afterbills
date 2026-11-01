# AfterBills planning and implementation guardrails

## Current authorization

The user has authorized initializing a local repository and implementing
AfterBills. The user subsequently explicitly approved using the current model
instead of waiting for GLM. Implementation may proceed with the parent and
inherited-model coding workers. Do not claim GLM was used.

The local Git repository is initialized on `main`.
The user has separately authorized committing and pushing this project to
`https://github.com/puri-adityakumar/afterbills` on `main`. Do not force-push or
overwrite existing remote history. The user has also authorized an AfterBills
Vercel project and direct local-source CLI deployment, without requiring a
GitHub integration. A one-minute demo video and a presentation were later requested by the user and are stored in `docs/`. Hackathon submission
remains unapproved.

Local implementation, dependency installation, and bounded local tests are in
scope. Bind test servers to loopback only.
Do not create wallets, fund accounts, create remote repositories, push, deploy,
publish, commit, or submit without separate authorization.

## Project boundaries

- Work only inside `/home/factory-user/solana-hackathon/afterbills/`.
- Do not edit, rename, clean, or copy the sibling `agenttab` project.
- There is no requirement to fork the previously researched agent-wallet library.
- Treat external and untracked changes as user work.
- Read `docs/PRD.md`, `docs/TECHNICAL_SPEC.md`, `DESIGN.md`, and your task's contract
  before implementing an approved chunk.

## Non-negotiable product rules

- Unpaid invoices never increase the funded available amount.
- Financial calculations are deterministic; no LLM makes accounting decisions.
- Use integer token units, never floating-point arithmetic for money.
- A reserve is a planning deduction, not locked funds.
- Read-only means no signature, approval, delegation, or private-key requests.
- Failed balance reads are unknown/stale, not a zero balance.
- Demo/sample data and devnet tokens must be visibly labeled.
- Manual invoice status is not blockchain verification.
- An observed payment is already reflected in a fresh balance; never add it again.
- Financial labels stay local; no public blob storage, on-chain notes, or analytics
  containing wallet/client associations.

## Delegation and verification

Use the execution waves and exclusive file ownership in
`docs/TASK_BREAKDOWN.md`. At most three sizeable independent implementation
chunks may write in parallel. The lead controls shared contracts, package/lock
files, root config, and integration decisions. It may assign exclusive write
ownership to a coding worker during foundation/integration chunks; other workers
request shared changes rather than editing concurrently. The parent performs
small checks and review, and may implement integration and bounded fixes.

Every handoff must state files changed, tests run, actual results, known gaps,
assumptions, and whether any real network call was made. A plan or fixture test is
not evidence of devnet integration.

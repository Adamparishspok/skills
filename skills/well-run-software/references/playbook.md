# A Well-Run Software Practice

A practical playbook for shipping software safely and steadily, whether you're a team of one or twenty. Every practice comes with **why** it matters and **how** to set it up, so you can adopt it one piece at a time.

It applies to any kind of software: web and mobile apps, APIs and services, libraries, CLIs, internal tools. Skip a practice only when it truly doesn't fit (a library has no deploys; a CLI has no uptime). Examples use GitHub; GitLab, Bitbucket and others have equivalents for every control.

The one idea behind all of it: **make the right thing the easy thing, and the wrong thing impossible.** Don't rely on people remembering. Encode the rules in tooling that enforces them.

## Contents

1. Source control
2. Every change goes through a pull request
3. Code review
4. Formatting and linting
5. Continuous integration
6. Testing
7. Dependencies and supply chain
8. Secrets management
9. Access control
10. Tracking work
11. Deployment, releases and data
12. Security testing beyond CI
13. Observability and incidents
14. Documentation
15. Working with AI coding agents
16. The exception rule
- Setup checklist
- Quick self-audit

---

## 1. Source control

**Rules**
- All code lives in git, in a hosted repo (GitHub, GitLab) with backups you don't manage by hand.
- `main` is always releasable. If it's broken, fixing it is the top priority.
- Work happens on short-lived branches (hours to a few days, not weeks). Long branches lead to painful merges.
- Commits say *why*, not just *what*. `fix: login loop when session cookie expires` beats `fix bug`.
- Use **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`). They make history scannable and let tools write changelogs and pick version bumps. Enforce with commitlint in a `commit-msg` hook and in CI (`assets/commitlint.yml`).
- Never commit secrets. Keep `.env` in `.gitignore` from day one and commit a `.env.example` with placeholder values.

**Why:** Git history is your audit trail and your undo button. A clean `main` means you can always ship a fix.

**Pre-commit hooks** catch problems in seconds instead of minutes later in CI:
- Block commits on `main`/`master` locally, so nobody has to remember to branch.
- Format and lint only the staged files, so the hook stays fast.
- Check the commit message format.

Node: husky + lint-staged (`assets/husky/`, `assets/package-scripts.json`). Any language: lefthook or the `pre-commit` framework. Hooks are a convenience: anyone can skip them with `--no-verify`. CI and the ruleset are the real gate, so every hook check must also run in CI.

---

## 2. Every change goes through a pull request

**Rules**
- Nobody pushes to `main` directly, including you and admins.
- Each PR is small and does one thing. Aim for under about 400 lines of real change.
- The PR description answers: **What changed? Why? How was it tested? What's the risk?** Link the ticket.
- Use a PR template so this is automatic (see `assets/pull_request_template.md`).

**Enforce it.** On GitHub, prefer a **repository ruleset** (Settings → Rules → Rulesets) over classic branch protection. Rulesets can target several branches, stack, and show who can bypass in one place. Target the default branch and enable:
- Require a pull request before merging, with at least 1 approval
- Dismiss stale approvals when new commits are pushed
- Require approval of the most recent reviewable push
- Require conversation resolution
- Require status checks to pass, with the CI job names, and require branches to be up to date
- Block force pushes, and restrict deletions
- **Leave the bypass list empty.** This is the ruleset version of "include administrators".

With classic branch protection, the same list applies, and "Do not allow bypassing the above settings" (formerly "Include administrators") must be on.

To check from the command line:
```bash
gh api repos/{owner}/{repo}/rules/branches/main    # rules that apply, from any ruleset
gh api repos/{owner}/{repo}/branches/main/protection  # classic protection, 404 if none
```

**Solo?** You can't get a second reviewer, but you can still (a) open a PR for everything so CI gates it, (b) review your own diff on the PR page the next morning with fresh eyes, and (c) ask an AI reviewer or a friend for anything touching auth, payments, or data. Required approvals will block you when solo, so require the PR and status checks, not the approval count.

---

## 3. Code review

**Reviewers look for, in priority order:**
1. **Correctness**: does it do what it claims? What about edge cases, empty or null values, errors?
2. **Security**: input validation, authorization checks, secrets, injection, what data leaves the server.
3. **Tests**: is the new behavior covered? Would the tests fail if the code broke?
4. **Clarity**: will someone understand this in six months?
5. **Style**: only if the linter doesn't already catch it. Don't hand-review what a machine can check.

**Norms**
- Review within one working day. Slow reviews kill momentum.
- Comment on the code, not the person. Prefix optional feedback with `nit:`.
- The author owns the merge. The reviewer's approval means "I'd be comfortable supporting this."
- Use a `CODEOWNERS` file so the right people are requested automatically (see `assets/CODEOWNERS`). Turn on "Require review from Code Owners" for paths that matter, such as auth.

---

## 4. Formatting and linting

Formatting is not a review topic. A machine decides, and humans never argue about it again.

- **One formatter, zero options debated.** Prettier for web stacks, or Biome for one fast tool that formats and lints. Ruff format for Python, `gofmt` for Go, `rustfmt` for Rust. Accept the defaults.
- Add an `.editorconfig` (`assets/editorconfig`) so every editor agrees on line endings, final newline and indentation before the formatter runs.
- **Lint strict, as errors.** Warnings pile up and get ignored. Run the linter with zero warnings allowed (`--max-warnings=0`). For TypeScript use `typescript-eslint` `strict` (not just `recommended`), and make `no-explicit-any` and `no-unused-vars` errors. See `assets/eslint.config.js`, or `assets/biome.json` for Biome.
- Keep the formatter and linter from fighting: `eslint-config-prettier` turns off ESLint's style rules, and Prettier owns formatting.
- **Relax a rule only where it is wrong, by file pattern, with a comment saying why.** For example, non-null assertions in test files, or in Svelte/Vue templates where type narrowing from a template condition does not carry into the expression below it. Never turn a rule off for the whole project to silence one file.
- **Ignore code you do not maintain** (generated output, vendored or copied-in components) instead of letting it block lint.
- **Fix the cause, don't silence the checker.** Replace a non-null assertion (`user!.id`) with a real check that throws a clear error. Replace `any` with the real type or `unknown`.
- **Turning on a stricter config:** land it in one PR that only adds the config and runs the auto-fixer (`prettier --write .`, `eslint --fix`). Hand-fix the rest. Keep logic changes out of it so review stays easy.
- CI runs the **format check** (`prettier --check .`) as its own step, so unformatted code cannot merge even when someone skipped the hook.

---

## 5. Continuous integration (CI)

Every PR runs an automated pipeline. If any step fails, the PR can't merge.

**The minimum pipeline**

Example tools per stack. Use whatever fits yours.

| Step | Node | Python | Go | Catches |
|---|---|---|---|---|
| Install from lockfile | `npm ci`, `pnpm install --frozen-lockfile` | `uv sync --locked`, `pip install -r` with hashes | `go mod download` | "Works on my machine" drift |
| Format check | `prettier --check .`, `biome ci` | `ruff format --check` | `test -z "$(gofmt -l .)"` | Unformatted code |
| Lint | ESLint, Biome | Ruff | `golangci-lint` | Bugs and style issues |
| Typecheck | `tsc --noEmit` | mypy, pyright | (compiler) | Type errors |
| Unit tests | Vitest, Jest | pytest | `go test ./...` | Regressions |
| Build | the real production build | package build | `go build ./...` | Broken builds reaching `main` |
| Dependency audit | `npm audit --audit-level=high` | `pip-audit` | `govulncheck` | Known-vulnerable packages |
| Static security scan (SAST) | Semgrep, CodeQL | Semgrep, CodeQL | Semgrep, CodeQL | Injection, unsafe patterns, secrets |
| Workflow scan | zizmor | zizmor | zizmor | Insecure GitHub Actions config |

A starter workflow is in `assets/ci.yml`. Two small PR-level workflows sit beside it: `assets/commitlint.yml` (Conventional Commits) and `assets/ticket-link.yml` (the PR description links a ticket).

**Hardening details worth adopting**
- **Pin third-party actions to a full commit SHA**, not `@v4`. Tags can be moved by an attacker who compromises the action. Keep the version as a comment: `@<sha> # v4.2.2`. Dependabot updates pinned SHAs and comments.
- Set `permissions: contents: read` at the top of every workflow, and grant more only to the jobs that need it.
- Use `actions/checkout` with `persist-credentials: false` unless a later step needs to push.
- Use `concurrency` to cancel superseded runs, and `timeout-minutes` so a hung job doesn't burn an hour.
- Trigger on `pull_request` and on `push` to `main` only. `on: [pull_request, push]` runs everything twice for each PR commit.
- Avoid `pull_request_target` unless you understand it. It runs with secrets on code from forks.
- Never interpolate untrusted input (`${{ github.event.pull_request.title }}`, branch names) straight into a `run:` script. Pass it through `env:` instead. zizmor flags this.
- Make the required checks in the ruleset match the job names exactly.

---

## 6. Testing

**The pyramid:** many fast unit tests, fewer integration tests, and a handful of end-to-end tests on the critical paths.

**What to test first** (highest value per test):
1. **Security boundaries.** Auth, session and token handling, permission checks. Test the *rejections* (forged token, expired session, wrong role, another user's record), not just the happy path.
2. **Anything that handles secrets.** Assert that secrets never appear in responses, including error responses.
3. **Business logic** with branching rules: pricing, eligibility, filtering.
4. **Data integrity.** Unique IDs and slugs, required fields, valid enum values in config and content files.

**Test the tests.** Break the code on purpose (remove a check, flip a condition) and confirm a test fails. If nothing fails, the test is decoration. This is mutation testing. By hand on your riskiest code it takes five minutes. Tools automate it: Stryker (JS/TS), mutmut (Python), go-mutesting (Go).

**Rules**
- Bug fix = write a failing test first, then fix it. That bug can't come back unnoticed.
- Tests must be deterministic. Fake the clock and mock the network, so a test never depends on the time or a live API.
- Keep the suite fast (seconds, not minutes) so people actually run it.
- A flaky test is a bug. Fix it or delete it. Never retry it until green.

---

## 7. Dependencies and supply chain

- **Commit your lockfile** and install from it in CI (`npm ci`, `--frozen-lockfile`, `uv sync --locked`).
- **Automate updates** with Dependabot or Renovate, grouping minor and patch bumps into one PR. See `assets/dependabot.yml`. Include `github-actions` so pinned SHAs stay current.
- The **cooldown** matters: malicious package releases are usually caught within days. Waiting a week avoids most of them.
- **Block merges on high and critical advisories.** Triage mediums weekly.
- Prefer fewer, well-maintained dependencies. Every package is code you're trusting. Before adding one, check: who maintains it, when it last shipped, how many transitive dependencies it pulls in, and whether it runs install scripts.
- Where your package manager runs install scripts (npm, pip source builds), consider turning them off by default and allowing only the packages that need them.

---

## 8. Secrets management

- Secrets live in the platform's secret store (GitHub Actions secrets, your host's env config, 1Password, a cloud secrets manager). Never in the repo, and never in anything shipped to users.
- **Prefer short-lived credentials.** For deploys from CI to AWS, GCP or Azure, use OIDC federation (`id-token: write`) instead of a long-lived access key stored as a secret. Nothing to leak, nothing to rotate.
- **Never print environment variables in build or CI logs.** A debug line like `env | grep API` leaks your keys into every log viewer. Grep your build configs for `env`, `printenv` and `echo $`.
- Separate keys per environment (dev, staging, prod) and per app, each with the least privilege it needs. Use GitHub **environments** with required reviewers for prod secrets.
- **Rotate** on a schedule, and immediately if a secret might have leaked (logs, screenshots, a public commit, a departed teammate). Assume anything that touched a log is compromised. Deleting the commit is not enough. Rotate.
- Turn on GitHub **secret scanning and push protection**. Push protection blocks the commit before it lands. Also run a scanner in CI (Semgrep `p/secrets`, gitleaks).
- **Anything shipped to users is public**: web bundles, mobile apps, desktop binaries, published packages. A key compiled into any of them can be extracted. Keep secrets on a server you control, and check which variables each build includes.

---

## 9. Access control

- **Least privilege.** People get the minimum access their work needs, and it gets removed when they leave the project.
- Few admins. Admin access should be rare and deliberate.
- Require 2FA on GitHub (enforce it at the org level), your cloud provider, your host, and your domain registrar. Prefer passkeys or hardware keys over SMS.
- Prefer fine-grained personal access tokens with an expiry, scoped to one repo, over classic tokens.
- **Review access monthly.** Put a recurring 10-minute calendar item on it: who has access, do they still need it? Include deploy keys, GitHub Apps, and third-party integrations, not only people.
- Know where every app is hosted. Production should live in accounts the team or company controls, not a personal account nobody else can reach.

---

## 10. Tracking work

- Every change maps to a ticket (Linear, GitHub Issues, Jira) that says **what and why**.
- Link the ticket in the PR and the PR in the ticket, so either one leads you to the other. Enforce the PR side with `assets/ticket-link.yml`, which fails a PR whose description has no ticket key or link. Many trackers (Linear, Jira, GitHub Issues) then link back on their own.
- Write the ticket *before* the work, even as a single line. Tickets written after the fact are fine for catching up, but label them honestly as retroactive.
- Close tickets when the change is deployed or released, not when it's merged.

A good ticket:
```
Title: Users can export invoices as CSV
Why: Accountants retype invoice data by hand every month
Done when: Export button on invoices page; CSV opens in Excel; covered by tests
```

---

## 11. Deployment, releases and data

- **Automate it.** Merging to `main` deploys, or tagging publishes a release. Nobody ships from a laptop.
- **Libraries and packages:** publish from CI with trusted publishing (OIDC) where the registry supports it, use semantic versioning, and keep a changelog. Know how to yank or deprecate a bad release.
- For apps, have **preview environments** per PR if your host supports them. Reviewers click a link instead of pulling the branch.
- **Know how to roll back** before you need to: a one-click redeploy of the previous build, a revert PR, or a patch release. Test it once.
- Use feature flags for risky changes, so a release (turning something on) is separate from the deploy (shipping the code). Delete flags once they're fully on.
- Deploy small and often. Ten small deploys are safer than one big one.
- **Database changes are deploys too** (if you have a database). Make migrations backward-compatible with the running code (add the column, ship code that uses it, then drop the old one in a later deploy). A rollback of code must not need a rollback of data.
- **Backups only count if you've restored one** (for any data you'd lose). Confirm automatic backups are on, know the retention, and do a test restore at least once a quarter.

---

## 12. Security testing beyond CI

| Practice | What | Cadence |
|---|---|---|
| SAST | Scans source for dangerous patterns (Semgrep, CodeQL) | Every PR |
| SCA | Known-vulnerable dependencies (Dependabot, `npm audit`, `pip-audit`) | Every PR + continuous |
| Secrets scanning | Keys committed by mistake (push protection, gitleaks) | Every push |
| DAST | Probes the *running* app or API like an attacker would (OWASP ZAP for web) | Weekly, for anything with a network endpoint |
| Pen test | A human tries to break in | Yearly, or before a big launch |

For a deployed web app or API, a weekly ZAP baseline scan is free and takes one workflow file: `assets/dast.yml`. Point it only at targets you own.

Know the **OWASP Top 10** at a skim level (mobile apps also have the OWASP Mobile Top 10): broken access control, cryptographic failures, injection, insecure design, security misconfiguration, vulnerable components, authentication failures, integrity failures, logging failures, SSRF. Most real breaches are on that list. Broken access control is number one: test that user A can't read user B's data.

Publish a `SECURITY.md` saying how to report a vulnerability, and turn on GitHub private vulnerability reporting.

---

## 13. Observability and incidents

- **Error tracking** (Sentry or similar) on day one for anything users run, so you hear about crashes before users report them. For libraries, an issue tracker and clear bug-report template do this job.
- **Structured logs** without personal data or secrets. Scrub request bodies and headers by default.
- For services, **uptime monitoring** on the critical endpoints, alerting to somewhere you'll actually see.
- **Alert on symptoms users feel** (errors, latency, failed checkouts), not on every CPU spike. An alert nobody acts on trains people to ignore alerts.
- When something breaks: fix it, then write a short **blameless postmortem** covering what happened, why, how it was detected, what we'll change. The goal is a system fix, not a person to blame. Each postmortem should produce at least one ticket.

---

## 14. Documentation

- A `README` that gets a new person from clone to running in under 15 minutes.
- A `CONTRIBUTING.md` (or a section of the README) with the branch, PR and review rules above.
- Document **decisions**, not just code. A short "we chose X over Y because Z" note (an ADR, or architecture decision record) saves hours of re-arguing later.
- Keep docs next to the code so they're updated in the same PR.
- If AI agents work in the repo, keep an agent instructions file (`CLAUDE.md`, `AGENTS.md`) with the commands to build, test and lint, and the rules that matter here.

---

## 15. Working with AI coding agents

AI agents write a lot of code fast. The practices above are what keep that safe. Specifically:

- **AI-written code goes through the same PR, CI and review as human code.** No exceptions for "the agent ran the tests".
- The human who opens the PR owns it, and must have read the diff.
- Don't give agents production credentials or admin tokens. Give them the same least-privilege access a new contractor would get.
- Watch for agent-specific failure modes in review: tests changed to match broken code, checks deleted to make CI pass, new dependencies nobody asked for, and invented package names (a typosquatting risk). Verify every new dependency exists and is the one you meant.
- Treat content an agent reads (issues, web pages, files from outside) as untrusted. It can contain instructions.

---

## 16. The exception rule

Sometimes you need to break a rule, such as an emergency hotfix or bootstrapping the rules themselves. When you do:
1. Make it **deliberate**: one named person decides.
2. Make it **recorded**: a comment on the PR and ticket saying what was bypassed and why.
3. Make it **temporary**: restore the control right away and verify it's back on.
4. Make it **rare**: if exceptions become routine, the rule is wrong. Fix the rule instead.

---

## Setup checklist for a new project

Work top to bottom. The first block is an afternoon's work.

**Day one**
- [ ] Repo owned by an org or account the team controls, `.gitignore` with `.env*` (and `!.env.example`), `.env.example` committed
- [ ] Secret scanning and push protection on
- [ ] Formatter, strict linter (zero warnings) and typechecker configured, plus `.editorconfig`
- [ ] Pre-commit hooks: block commits on `main`, format and lint staged files, commitlint on `commit-msg`
- [ ] Test runner with at least one real test
- [ ] CI workflow: install (frozen), format check, lint, typecheck, test, build, audit, Semgrep
- [ ] Commitlint and ticket-link workflows on PRs, as required checks
- [ ] Actions pinned to commit SHAs, `permissions: contents: read` at the top
- [ ] Ruleset on `main` with empty bypass list, CI jobs as required checks
- [ ] PR template and `CODEOWNERS`
- [ ] Dependabot (or Renovate) with cooldown, including `github-actions`
- [ ] 2FA on every account

**First week**
- [ ] Automated deploys or releases from CI; rollback tested once
- [ ] Deploy and publish credentials via OIDC where supported
- [ ] Error tracking, and uptime monitoring for services
- [ ] Tests covering auth and secret handling (including the rejection paths)
- [ ] README that gets someone running in 15 minutes
- [ ] `SECURITY.md`

**Ongoing**
- [ ] Weekly: triage Dependabot PRs and advisories; ZAP scan results
- [ ] Monthly: access review (people, tokens, apps); check secrets and keys are still least-privilege
- [ ] Quarterly: test a backup restore
- [ ] Per incident: blameless postmortem
- [ ] Yearly: rotate long-lived secrets; consider a pen test

---

## Quick self-audit

Answer honestly. Every "no" is your next task.

1. Could someone push broken or malicious code to `main` without anyone else seeing it?
2. If `main` broke right now, would CI have caught it first?
3. Does anything print, log or ship a secret?
4. Would you know within an hour if users started hitting errors?
5. Can you roll back (or yank a bad release) in under five minutes?
6. Does every person, token and app with access still need it?
7. If you deleted a security check in the code, would a test fail?
8. Could a new person ship a small change on their first day, following only the docs?
9. If you hold data: have you ever restored from a backup?

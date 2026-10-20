---
name: well-run-software
description: Audit or set up the engineering practices that keep software shipping safely - git hygiene, pre-commit hooks, formatting and strict linting, conventional commits, pull requests and branch protection, code review, CI, testing, dependency and supply-chain security, secrets, access control, deploys, observability and incident response. Use when the user asks to audit a repo's practices, "harden" or "set up" a new project, add CI or branch protection, set up Prettier/Biome/ESLint or husky/lint-staged or commitlint, require ticket links on PRs, write a PR template or CODEOWNERS, configure Dependabot or Renovate, pin GitHub Actions, check for leaked secrets, prepare for a security review or SOC 2 style questions, or asks "is this repo well run?" / "what are we missing?". Applies to any kind of software (apps, services, libraries, CLIs) in any language, and to a team of one or twenty.
---

# Well-Run Software Practice

One idea behind everything here: **make the right thing the easy thing, and the wrong thing impossible.** Prefer a control that tooling enforces over a rule people must remember.

## Pick the mode

| User wants | Mode |
|---|---|
| "Audit this repo", "what are we missing", "is this well run" | **Audit** |
| "Set up a new project", "add CI", "harden this repo" | **Setup** |
| A question about one practice ("how should we do code review?") | **Advise**: answer from `references/playbook.md`, the matching section only |

## Audit

1. Run the checker from the repo root:
   ```bash
   bash <skill-dir>/scripts/audit.sh .
   ```
   It checks files, workflows and (if `gh` is logged in) branch protection. It prints `PASS`/`WARN`/`FAIL`/`SKIP` lines and exits non-zero on any `FAIL`.
2. The script covers only what a file scan can see. Then check by hand what it cannot, using `references/playbook.md`:
   - Are tests real? Pick the riskiest check (auth, permissions) and break it on purpose. Does a test fail?
   - Does anything log, print or ship a secret? Grep logging calls, and anything shipped to users (web bundles, mobile builds, binaries, published packages).
   - Is deploy or release automated, and is rollback known?
   - For running services: is there error tracking and uptime monitoring?
   - Skip any practice that does not fit what this is (a library has no deploys, a CLI has no uptime). Say which you skipped.
3. Report findings **ranked by risk**, not by section order. Use this priority:
   1. Secrets exposed (committed, logged, or shipped to users)
   2. Anyone can push to `main` unreviewed, or admins bypass protection
   3. No CI gate, or CI not a required check
   4. Supply chain gaps: unpinned actions, no lockfile, no dependency updates
   5. Missing tests on security boundaries
   6. Everything else
4. For each finding give: what is wrong, why it matters (one line), the exact fix. End with the 9-question self-audit from the playbook, answered for this repo where you can tell.

Do not change anything in Audit mode unless the user asks.

## Setup

Work through the **Day one** checklist in `references/playbook.md`. Copy templates from `assets/` and fill them in for the stack you find (language, package manager, scripts). The templates use GitHub. On GitLab, Bitbucket or another host, apply the same controls with that host's equivalents.

| File | Goes to |
|---|---|
| `assets/pull_request_template.md` | `.github/pull_request_template.md` |
| `assets/CODEOWNERS.txt` | `.github/CODEOWNERS` |
| `assets/ci.yml` | `.github/workflows/ci.yml` |
| `assets/commitlint.yml` + `assets/commitlint.config.js` | `.github/workflows/commitlint.yml` + `commitlint.config.js` |
| `assets/ticket-link.yml` | `.github/workflows/ticket-link.yml` (set `TICKET_PATTERN` for the tracker) |
| `assets/editorconfig.ini` | `.editorconfig` |
| `assets/eslint.config.js` | `eslint.config.js` (TypeScript projects; or `assets/biome.json` as `biome.json` to replace Prettier + ESLint) |
| `assets/package-scripts.json` | merge into `package.json` (scripts + lint-staged), then `npx husky init` |
| `assets/husky/pre-commit.sh`, `assets/husky/commit-msg.sh` | `.husky/pre-commit` and `.husky/commit-msg`, no extension (Node; use lefthook or `pre-commit` for other stacks) |
| `assets/dependabot.yml` | `.github/dependabot.yml` |
| `assets/dast.yml` | `.github/workflows/dast.yml` (only for a deployed web app or API) |

### Rules for Setup

- **Never invent commit SHAs.** Resolve each action's SHA for real:
  ```bash
  gh api repos/actions/checkout/releases/latest --jq .tag_name          # e.g. v4.2.2
  gh api repos/actions/checkout/commits/v4.2.2 --jq .sha                # full 40-char SHA
  ```
  Write it as `uses: actions/checkout@<sha> # v4.2.2`. If `gh` is unavailable, leave the placeholder and tell the user. Tools like `pinact` or `ratchet` can pin a whole workflow.
- Replace every `<...>` placeholder in `ci.yml` with the project's real commands. If a step has no tool yet (no typechecker, say), add one or drop the step. Say which.
- **Branch protection and rulesets change shared settings.** Show the user the exact `gh api` call or settings list and get a yes before you apply it. Prefer a repository **ruleset** over classic branch protection. See `references/playbook.md` section 2.
- Never commit a real secret, even to test. Use `.env.example` with placeholders.
- Add a test only if a test runner already exists or the user agrees to one.
- Stricter lint or a new formatter on an existing codebase: land the config plus auto-fix output (`prettier --write .`, `eslint --fix`) in its own PR, with no logic changes. Hand-fix what remains properly (throw on a missing value instead of `!`, real types instead of `any`). Relax a rule only by file pattern with a comment, and ignore vendored code rather than fixing it.
- Every hook check must also run in CI. Hooks can be skipped with `--no-verify`.

## Scale to the team

- **Solo:** keep PRs and CI gates. Replace the second reviewer with next-morning self-review on the PR page, plus an AI or friend review for auth, payments and data changes.
- **2 to 20:** everything in the playbook applies. `CODEOWNERS` and required reviews start to matter most.
- **Regulated or handling payments/health data:** add the yearly pen test, documented access reviews and incident postmortems as hard requirements, not suggestions.

## Exceptions

When the user must bypass a control (hotfix, bootstrapping), follow the exception rule: one named person decides, it is recorded on the PR and ticket, the control is restored right away and verified, and routine exceptions mean the rule needs fixing.

## Files

- `references/playbook.md` - the full practice, with why and how for each area, setup checklist and self-audit. Read the section you need, not the whole file.
- `scripts/audit.sh` - repo checker. Read-only.
- `assets/` - templates for Setup.

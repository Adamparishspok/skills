#!/usr/bin/env bash
# Read-only checks for a repo against the well-run-software playbook.
# Usage: audit.sh [repo-dir]   Exit 1 if any FAIL.
set -u
cd "${1:-.}" || exit 2

fails=0
pass() { printf 'PASS  %s\n' "$1"; }
warn() { printf 'WARN  %s\n' "$1"; }
fail() { printf 'FAIL  %s\n' "$1"; fails=$((fails + 1)); }
skip() { printf 'SKIP  %s\n' "$1"; }
first() { for f in "$@"; do [ -e "$f" ] && { echo "$f"; return 0; }; done; return 1; }

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  fail "Not a git repository"
  exit 1
fi

echo "== Source control and secrets"
if [ -f .gitignore ] && grep -qE '^\s*/?\.env' .gitignore; then
  pass ".gitignore covers .env"
else
  fail ".gitignore does not ignore .env files"
fi
tracked_env=$(git ls-files | grep -E '(^|/)\.env($|\.)' | grep -vE '\.(example|sample|template)$' || true)
if [ -n "$tracked_env" ]; then
  fail "Env files tracked in git (rotate any real secrets in them): $(echo $tracked_env)"
else
  pass "No .env files tracked"
fi
[ -n "$(first .env.example .env.sample .env.template)" ] && pass ".env example committed" || warn "No .env.example for new contributors"

echo "== Dependencies"
lock=$(first package-lock.json pnpm-lock.yaml yarn.lock bun.lock bun.lockb uv.lock poetry.lock Pipfile.lock Cargo.lock go.sum Gemfile.lock composer.lock)
manifest=$(first package.json pyproject.toml requirements.txt Pipfile Cargo.toml go.mod Gemfile composer.json)
if [ -n "$lock" ]; then
  git ls-files --error-unmatch "$lock" >/dev/null 2>&1 && pass "Lockfile committed ($lock)" || fail "Lockfile $lock exists but is not committed"
elif [ -n "$manifest" ]; then
  fail "No lockfile next to $manifest"
else
  skip "No package manifest found"
fi
upd=$(first .github/dependabot.yml .github/dependabot.yaml renovate.json renovate.json5 .github/renovate.json .github/renovate.json5 .renovaterc .renovaterc.json)
if [ -z "$upd" ]; then
  fail "No Dependabot or Renovate config"
else
  pass "Automated dependency updates ($upd)"
  case "$upd" in
    *dependabot*)
      grep -q 'cooldown' "$upd" || warn "Dependabot has no cooldown (wait ~7 days before adopting new releases)"
      grep -q 'github-actions' "$upd" || warn "Dependabot does not update github-actions"
      ;;
    *) grep -qE 'minimumReleaseAge|stabilityDays' "$upd" || warn "Renovate has no minimumReleaseAge" ;;
  esac
fi

echo "== CI"
wf_dir=.github/workflows
wfs=$(ls "$wf_dir"/*.yml "$wf_dir"/*.yaml 2>/dev/null || true)
other_ci=$(first .gitlab-ci.yml .circleci/config.yml bitbucket-pipelines.yml azure-pipelines.yml Jenkinsfile .buildkite/pipeline.yml .woodpecker.yml)
if [ -z "$wfs" ] && [ -n "$other_ci" ]; then
  pass "CI config found ($other_ci)"
  skip "GitHub Actions checks (SHA pinning, permissions, log leaks): review $other_ci by hand"
elif [ -z "$wfs" ]; then
  fail "No CI configuration found"
else
  pass "Workflows found: $(echo $wfs | wc -w | tr -d ' ')"
  # Pinned = 40-hex SHA. Local (./) and docker:// refs are exempt.
  unpinned=$(grep -nE '^\s*-?\s*uses:' $wfs | grep -vE 'uses:\s*["'\'']?(\./|docker://)' | grep -vE '@[0-9a-f]{40}' || true)
  if [ -n "$unpinned" ]; then
    fail "Actions not pinned to a commit SHA:"
    echo "$unpinned" | sed 's/^/        /'
  else
    pass "All actions pinned to SHAs"
  fi
  for f in $wfs; do
    grep -qE '^permissions:' "$f" || fail "No top-level permissions block: $f"
  done
  grep -lE 'pull_request_target' $wfs 2>/dev/null | while read -r f; do warn "Uses pull_request_target (runs fork code with secrets if misused): $f"; done
  leaks=$(grep -nE '(^|[^A-Za-z_])(printenv|env)\s*($|\|)|echo\s+"?\$\{?[A-Z_]*(KEY|TOKEN|SECRET|PASSWORD)' $wfs || true)
  if [ -n "$leaks" ]; then
    fail "Workflow may print secrets to logs:"
    echo "$leaks" | sed 's/^/        /'
  fi
  inject=$(grep -nE 'run:.*\$\{\{\s*github\.(event\.(pull_request|issue|comment|review)|head_ref)' $wfs || true)
  if [ -n "$inject" ]; then
    warn "Untrusted input interpolated into run: (pass via env: instead):"
    echo "$inject" | sed 's/^/        /'
  fi
  grep -qiE 'semgrep|codeql|gitleaks|trufflehog' $wfs && pass "SAST or secrets scan in CI" || warn "No Semgrep/CodeQL/gitleaks step in CI"
fi

echo "== Formatting, linting and hooks"
fmt=$(first .prettierrc .prettierrc.json .prettierrc.js .prettierrc.cjs .prettierrc.mjs .prettierrc.yaml .prettierrc.yml prettier.config.js prettier.config.mjs prettier.config.cjs biome.json biome.jsonc .rustfmt.toml rustfmt.toml)
if [ -z "$fmt" ] && [ -f package.json ] && grep -q '"prettier"' package.json; then fmt=package.json; fi
if [ -z "$fmt" ] && [ -f pyproject.toml ] && grep -qE '^\[tool\.(ruff|black)' pyproject.toml; then fmt=pyproject.toml; fi
[ -n "$fmt" ] || [ -f go.mod ] && pass "Formatter configured (${fmt:-gofmt})" || warn "No formatter config (Prettier, Biome, Ruff...)"
[ -f .editorconfig ] && pass ".editorconfig" || warn "No .editorconfig"
if [ -n "$wfs" ]; then
  grep -qE 'format:check|prettier --check|biome (ci|check)|ruff format --check|gofmt|cargo fmt|black --check' $wfs && pass "Format check in CI" || warn "CI does not check formatting"
  grep -qiE 'commitlint' $wfs && pass "Commit messages checked in CI" || warn "No commitlint (Conventional Commits) in CI"
fi
hooks=$(first .husky/pre-commit lefthook.yml lefthook.yaml .lefthook.yml .pre-commit-config.yaml)
if [ -n "$hooks" ]; then
  pass "Pre-commit hooks ($hooks)"
  grep -qE 'main|master' "$hooks" || warn "Pre-commit hook does not block commits on main"
else
  warn "No pre-commit hooks (husky, lefthook, pre-commit)"
fi
if [ -f eslint.config.js ] || [ -f eslint.config.mjs ] || [ -f eslint.config.ts ]; then
  cfg=$(first eslint.config.js eslint.config.mjs eslint.config.ts)
  grep -qE 'configs\.(strict|strictTypeChecked)' "$cfg" || warn "ESLint not on typescript-eslint strict ($cfg)"
fi

echo "== Review"
[ -n "$(first .github/pull_request_template.md .github/PULL_REQUEST_TEMPLATE.md pull_request_template.md docs/pull_request_template.md .github/PULL_REQUEST_TEMPLATE)" ] && pass "PR template" || warn "No PR template"
[ -n "$(first .github/CODEOWNERS CODEOWNERS docs/CODEOWNERS)" ] && pass "CODEOWNERS" || warn "No CODEOWNERS"
[ -n "$wfs" ] && grep -qiE 'ticket|linear|jira' $wfs && pass "PR ticket link checked in CI" || warn "PRs not required to link a ticket"

echo "== Docs"
[ -n "$(first README.md README README.rst)" ] && pass "README" || fail "No README"
[ -n "$(first CONTRIBUTING.md .github/CONTRIBUTING.md docs/CONTRIBUTING.md)" ] && pass "CONTRIBUTING" || warn "No CONTRIBUTING.md (or put the PR rules in the README)"
[ -n "$(first SECURITY.md .github/SECURITY.md docs/SECURITY.md)" ] && pass "SECURITY.md" || warn "No SECURITY.md (how to report a vulnerability)"

echo "== Branch protection (GitHub)"
if ! command -v gh >/dev/null 2>&1 || ! gh auth status >/dev/null 2>&1; then
  skip "gh not installed or not logged in"
elif ! repo=$(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null); then
  skip "No GitHub remote"
else
  branch=$(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name)
  rules=$(gh api "repos/$repo/rules/branches/$branch" --jq '[.[].type] | join(" ")' 2>/dev/null || true)
  classic=$(gh api "repos/$repo/branches/$branch/protection" 2>/dev/null || true)
  if echo "$rules" | grep -q pull_request; then
    pass "Ruleset requires PRs on $branch"
    echo "$rules" | grep -q required_status_checks || fail "Ruleset on $branch has no required status checks"
    echo "$rules" | grep -q non_fast_forward || warn "Ruleset on $branch does not block force pushes"
    warn "Check the ruleset bypass list is empty (Settings > Rules) - not readable without admin"
  elif echo "$classic" | grep -q required_pull_request_reviews; then
    pass "Classic protection requires PRs on $branch"
    echo "$classic" | grep -q '"required_status_checks"' || fail "No required status checks on $branch"
    echo "$classic" | tr -d ' \n' | grep -q '"enforce_admins":{[^}]*"enabled":true' || fail "Admins can bypass protection on $branch"
  else
    fail "Anyone with write access can push to $branch unreviewed (no ruleset or protection found)"
  fi
fi

echo
echo "Not checked by this script: test quality, secrets in logs or shipped builds, deploy/release and rollback, monitoring, access reviews."
[ "$fails" -eq 0 ] && echo "Result: no FAILs" || echo "Result: $fails FAIL(s)"
[ "$fails" -eq 0 ]

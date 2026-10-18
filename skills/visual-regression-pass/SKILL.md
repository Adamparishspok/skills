---
name: visual-regression-pass
description: Make large UI refactors safe by screenshotting every app before and after and triaging the pixel diffs. Covers capturing baselines from existing walkthrough scripts, running many apps in parallel on shifted ports, ranking diffs by changed area, telling noise (animation timing, clocks, random data, scroll position) from real regressions, and the common real ones (tailwind-merge dropping a size, line-height shifts). Use before and after a design-system migration, a token change, a component swap, or any change across many screens. Triggers on: visual regression, screenshot diff, before/after screenshots, baseline, pixel diff, refactor safety, playwright screenshots.
license: MIT
---

# Visual regression pass

Typecheck proves the code compiles. Screenshots prove it still looks right.
For a change that touches shared tokens or components, take a baseline of
every screen **before** editing anything shared, then diff after each layer.

## 1. Baseline first

- Reuse each app's existing walkthrough (a Playwright script that clicks through the app and saves PNGs) instead of writing a new one.
- Capture into a scratch directory outside the repo, with labels: `before`, `kit`, `final`.
- Run each app on its port + 1000, never its usual port. The user's own dev servers are probably running, and `strictPort` fails while `reuseExistingServer` silently tests the wrong code.
- Patch the walkthrough into a temporary copy (port, output dir, `channel: "chrome"` if Playwright's bundled browser isn't installed). Delete the copy afterwards.
- Run apps in parallel with a lock per app (`mkdir lock || skip`): four workers cut 18 apps from about an hour to about 15 minutes.
- Don't edit shared files while a baseline run is in flight; the dev servers hot-reload.

## 2. Diff and rank

`scripts/shotdiff.py <labelA> <labelB> [app…]` compares same-named PNGs. It:
- thresholds per-pixel differences;
- counts changed pixels and reports size changes and missing shots;
- writes side-by-sides for every changed shot.

Sort by changed area and look at the largest first. Never diff a run that is still in progress: partial folders look like missing shots.

## 3. Triage

**Noise:**
- an entrance or stagger caught mid-animation;
- toasts mid-fade;
- live clocks and relative dates;
- random data;
- a different scroll position after a click (same content, shifted);
- 1px sub-pixel text shifts.

**Real:**
- a control changed height or width;
- text size or weight changed;
- page height changed;
- colour changed where you didn't change colour;
- something missing;
- console errors.

Crop the region at full or 2x resolution before deciding. Thumbnails hide 4px.

Real regressions this caught in practice:
- tailwind-merge dropping a caller's `h-10` beside a token height;
- named type steps with their own line-height shifting every converted line;
- a mask utility replacing a menu's exit animation so it never closed;
- a canvas map rejecting `oklch(calc())` colours.

## 4. Gate

Per app, before calling it done:
- typecheck passes;
- the walkthrough exits clean with no console errors;
- every large diff is triaged as noise or intended;
- the contrast audit passes if colours changed.

Record the intended differences in the commit or PR. If the repo has stored
page-screenshot baselines, check whether they predate unrelated commits on
main before trusting their failures.

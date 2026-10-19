---
name: oklch-palette-formula
description: Build or migrate a UI's neutral palette (grounds, surfaces, lines, ink/text) as an OKLCH formula driven by a few inputs instead of dozens of hand-picked hex values, with light and dark themes, per-step ladder overrides, a fit script that reproduces existing colours, and a browser contrast audit. Use when creating a theme, adding dark mode, retinting a product, auditing text contrast, or consolidating several apps' palettes. Triggers on: palette, neutrals, grey ramp, dark mode, theme tokens, oklch, retint, hue, contrast audit, design tokens, Tailwind @theme colours.
license: MIT
---

# OKLCH palette formula

A product's neutrals (page ground, card surface, wells, hairlines, four
steps of text) are usually 15 to 30 hex values per theme, picked by eye. They
drift, dark mode is a second hand-picked set, and nobody knows which pairs
still pass contrast. Replace them with a formula:

```
surface-ish token:  L = paper + depth  × n(token)     chroma = tint      hue = hue
ink token:          L = ink   + step   × n(token)     chroma = ink-tint  hue = hue
```

`n(token)` is the token's position on a **ladder**, one ladder per theme.
Move an input and the whole ramp moves together, so the gaps between steps,
which is where contrast lives, survive a retint. Retinting a product is one
line (`--hue`).

Seven inputs per theme drive every colour: `--hue` for all of them; `--paper`,
`--depth` and `--tint` for grounds and lines; `--ink-l`, `--ink-step` and
`--ink-tint` for text.

## Files

- `references/palette.css`: drop-in rules with starter inputs and ladders.
- `scripts/fit_palette.py`: fit inputs to an existing hex palette and print ΔE per token.
- `scripts/ladders.json`: the default ladders (light, dark).
- `scripts/palette-audit.js`: resolve every token in a real browser in both themes and fail on contrast.
- `scripts/oklch.py`: conversions and ΔE / WCAG helpers.

## Procedure

1. **Name the tokens by role, not value.** The defaults:
   - **Grounds:** `ground` (page), `panel` (rails, bars), `surface` (cards, menus), `surface-2` (wells), `surface-3` (chips, hovered rows), `field`.
   - **Lines:** `line`, `line-2`, `line-3` (hairlines, lightest to darkest), plus `field-line`, a control's edge, which must clear 3:1.
   - **Ink:** `ink`, `ink-2`, `ink-3`, `ink-4` (text, darkest to quietest). Every ink step is text, so each must clear 4.5:1.
2. **Fit, don't re-pick.** For an existing product run
   `python3 scripts/fit_palette.py theme.css`. It reads the `--color-*` hex
   declarations (light, then the `[data-theme="dark"]` rule), fits the inputs
   against the default ladder, and prints ΔE per token. Under 2 is visually
   identical.
3. **Override ladder steps where the design spaces them differently**, never
   the colour. Evaluate candidates with
   `fit_palette.py theme.css light '<inputs>' '<overrides>'` until the worst ΔE is under ~2.
   Typical overrides: `field: 0` (fields are the card face), a wider `line-3`,
   a bigger gap between `ink` and `ink-2`.
4. **Write the rules** (see `references/palette.css`):
   - Put the inputs and the `--color-*` formulas on the element that carries
     the theme attribute.
   - Restate every input you change in the dark rule. A dark rule written for
     the kit's defaults otherwise wins with *its* values.
   - With Tailwind v4, keep the token names in `@theme` so the utilities
     exist; the runtime declarations override them.
5. **Audit in a real browser:** `node scripts/palette-audit.js <url>`. It
   paints each token, reads back sRGB, and checks:
   - every ink step at 4.5:1 against every ground;
   - `field-line` and `ring` at 3:1.

   Fix a FAIL by moving that token's ladder step, not by special-casing a
   colour. Expect FAILs on existing palettes: in a 17-app migration the audit
   found failing `ink-4` or `field-line` values in more than half of them, all
   of them previously shipped.

## Traps

- **`var()` inside a custom property resolves where it is declared.**
  - Declare the formulas on `:root` and set inputs on a child: the child never recolours.
  - Alias tokens (`--color-heading: var(--color-ink)`) must be declared on the same themed element too.
- **Tailwind v4 `@theme` values live on `:root`.** A theme scoped to an app
  root (`[data-app]`) must declare the formula there, not in `@theme`.
- **Anything that hands colours to a canvas or map library**
  (`getComputedStyle(...).getPropertyValue('--color-x')`) now receives an
  unresolved `oklch(calc(...))` string. Resolve it first: paint a probe element
  and read a 1px canvas, the same way the audit does.
- **One hue for grounds and inks.** If the design's inks carry a different
  hue from its grounds, keep `--ink-tint` low; at L 0.98 any chroma reads as a
  colour cast.
- **Brand, status and chart colours stay outside the formula.** Derive
  text-on-tint variants (for example `brand-text`) from the same hue at a fixed
  lightness instead of picking them separately.
- **Mixed-hue, light-only palettes sampled off comps may not fit within ~2 ΔE.**
  Skip them rather than distort the design. The audit still applies.

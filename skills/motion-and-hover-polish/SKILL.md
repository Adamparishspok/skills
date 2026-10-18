---
name: motion-and-hover-polish
description: Give an interface one shared tempo and a small vocabulary of hover and state micro-interactions: duration tiers (tap/pop/hover/card/layout) for CSS and Motion, swap hand-offs, rows whose highlight grows in, trailing arrows, chevron nudges, card lifts without translate, scroll-edge fades, and icon/label swaps for copy and toggle buttons. Use when animations feel inconsistent, durations are scattered magic numbers, hovers only change colour, or a product feels flat or unfinished. Triggers on: animation duration, transition timing, hover state, micro-interaction, polish, copy button feedback, menu icon to close, back arrow, card hover, scroll fade, motion tokens, Framer Motion durations.
license: MIT
---

# Motion tiers and hover recipes

Two ideas, proven across 17 prototype apps:

1. **Durations are a scale, not a number per component.** The eye reads a
   shared tempo as one product. Smaller things move faster.
2. **Hovers move geometry, gently.** A highlight that *grows* into the row, an
   arrow that *arrives*, a chevron that *leans* toward where it goes, a label
   that *rolls* to its next state. Colour-only hovers read as a switch flipping.

## Files

- `references/recipes.css`: Tailwind v4 `@theme` tokens and `@utility` recipes.
- `references/timing.ts`: the same tiers for Motion and WAAPI.
- `references/swap.tsx`: `IconSwap` and `LabelSwap` (React).

## Tiers

| Tier     | ms  | For                                       |
| -------- | --- | ----------------------------------------- |
| `tap`    | 100 | an icon swapping, a press                 |
| `pop`    | 150 | a menu, popover or tooltip opening        |
| `hover`  | 200 | a row or control answering the pointer    |
| `card`   | 300 | a card lifting, a list settling, a page swap |
| `layout` | 500 | a panel collapsing, the page reflowing    |

- Entrances ease out (`cubic-bezier(0.22,1,0.36,1)`). Exits ease in and run one tier shorter.
- When two things trade places, the outgoing one leaves at once and the incoming one starts `delay-handoff` (50ms) later.
- Value tweens (a counter, a bar filling, a chart line drawing) may run longer: the eye is following the data.
- Keep deliberate springs.

Migration: map every ad-hoc duration to the nearest tier.

| Ad-hoc value | Tier |
| ------------ | ---- |
| 0.12 | `tap` |
| 0.15–0.18 | `pop` |
| 0.2–0.24 | `hover` |
| 0.28–0.35 | `card` |
| 0.4–0.5 | `layout` |

Expect on-screen timing to change by under 20ms almost everywhere.

## Recipes (one per element)

- **`hover-grow`** (navigation rows, link rows):
  - The highlight is a `::before` that starts inset (3px by 6px) and transparent, then swells to the full row as it fades in.
  - It also shows for `:focus-visible`, `data-state=open` and `aria-current=page`.
  - Square or brutalist designs (Carbon-like) should keep a flat highlight instead.
- **`trail`** (link rows, "Browse plans"):
  - A trailing glyph at half scale and transparent until the parent `.group` is hovered or focused, growing from its leading edge.
  - `trail-out` (grows from the bottom-left) plus `arrow-up-right` marks links that leave the app.
- **`nudge` / `nudge-back`** (chevrons, "View all", back links): a 2px lean toward the destination.
- **`lift`** (clickable cards):
  - One surface step lighter and one shadow step deeper, over the `card` tier.
  - **Never translate**: a card that jumps under the cursor moves the thing being aimed at.
- **`scroll-fade`** (scrolling panes):
  - Mask-based edge fades, only on a side that can still scroll. It is driven by the container's own scroll timeline and needs no ground colour.
  - Unsupported browsers simply show no fade.
- **`IconSwap`** (menu to close, copy to check, sun to moon):
  - The outgoing glyph shrinks, tilts −22° and fades on an ease-in.
  - The incoming one follows after the hand-off delay.
  - Both stay mounted, so it reverses cleanly mid-flight.
- **`LabelSwap`** ("Copy link" to "Copied", "Collapse" to "Expand"):
  - Both labels sit in one grid cell, so there's no width jump.
  - The hidden label goes `invisible` via `transition-discrete`, so assistive tech hears only the current one.

## Traps

- **`scroll-fade` on an element that animates itself** (Radix menu, popover
  or select content) replaces that element's exit animation. Radix waits for an
  exit that never ends, and the menu stays open. Put the fade on a scrolling
  child inside.
- **`scroll-fade` masks borders and shadows too.** Don't put it on a bordered
  card; put it on the inner scroller.
- **Custom `duration-*` utilities in Tailwind v4** must also set
  `--tw-duration`, or a `transition-[…]` utility on the same element wins
  depending on sort order.
- **Named type steps that carry a line-height** (`--text-meta--line-height`)
  shift every converted line by a pixel when replacing arbitrary sizes that
  inherited the parent's leading. Give in-between steps no line-height of their own.
- **Gate hovers behind `@media (hover: hover)`.** Show the same state on
  `:focus-visible`, and respect `prefers-reduced-motion` (Motion:
  `<MotionConfig reducedMotion="user">`).

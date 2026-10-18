---
name: multi-app-design-system
description: Consolidate several apps or prototypes onto one shared component library without flattening their looks. Covers finding duplicated local components (buttons, selects, fields, modals, pagers, toasts), making shared components token-sized so each suite or app sets its own measurements, mapping variant names, deciding what stays app-specific, and the tailwind-merge traps that silently break custom tokens. Use when several apps each grew their own Btn/Select/Modal, when a design system's components "don't fit" a second product, or when retheming a family of apps. Triggers on: shared component library, design system consolidation, duplicate components, retheme, suite of apps, shadcn retokened, token-driven components, cn tailwind-merge custom tokens, variant mapping.
license: MIT
---

# Many apps, one system

The usual failure: a kit is built for app A, app B's buttons are 4px taller and
2px rounder, so B forks the button "just this once". Five apps later there are
six buttons, eight selects and three modals, all doing the same job.

Make the shared component token-sized: it carries behaviour, markup and
states, and each theme supplies measurements. Then consolidate app by app.

## Token-sized components

Read every measurement that differs between apps from a theme token:

```css
@theme {
  --spacing-btn-sm: 1.75rem;  --spacing-btn-px-sm: 0.625rem;
  --spacing-btn-md: 2.25rem;  --spacing-btn-px-md: 0.875rem;
  --spacing-field: 2.125rem;  /* input / select height */
  --text-label: 0.8125rem;
}
```

```tsx
md: "h-btn-md px-btn-px-md text-sm",
icon: "size-btn-md",
```

Then:
- A suite overrides the tokens once in its theme, and every app in it gets its own measured control.
- Radius, fills and shadows are already tokens (`rounded-field`, `bg-accent`, `--shadow-card`).
- Paint fills as colour plus a decorative class, for example `bg-accent accent-fill`. A theme that only defines the decoration (a sheen) then never renders a transparent button.

See `references/button.tsx`.

## Consolidation pass, per app

1. **Inventory local copies.** Grep each app for `export function (Btn|Button|IconBtn|Select|Field|Input|Modal|Dialog|Sheet|Badge|Empty|Pager|Toast|Stat|Status|Spinner)`. Count call sites.
2. **Replace and delete** where the shared one matches after theming. Map variant names explicitly and write the mapping down:

   | Local name | Shared variant |
   | ---------- | -------------- |
   | `primary`, `navy` | `accent` |
   | `secondary` | `outline` |
   | `quiet`, `soft` | `subtle` |
   | `danger` (solid) | `danger-solid` |

3. **Keep app-specific pieces app-specific:**
   - domain widgets, charts and app chrome;
   - controls whose *shape* is the brand (iOS slabs, Carbon flat controls, 48px pill CTAs);
   - controls with behaviour the shared one lacks (tri-state checkbox, removable chips, an "Any" reset item, multi-select filters).

   A thin wrapper is fine when it adds one thing. Note why in a comment.
4. **Retire native `<select>`s and menu-based selects for one Select.**
   - Radix Select reserves `""` as "no value": use a sentinel like `"all"` and map it back.
   - Forward `aria-labelledby` and `aria-describedby`.
   - Walkthrough scripts that call `selectOption()` must click the combobox, then the option.
5. **Verify each app against its own screenshots** (see `visual-regression-pass`). Real diffs are usually intended: sizes, sheen, press scale.

## tailwind-merge traps (`cn()`)

tailwind-merge only knows Tailwind's built-in scale. Custom tokens break it in three silent ways:

- **Unknown spacing tokens.** `cn("h-btn-md", "h-10")` keeps *both*, because it doesn't know `h-btn-md` is a height, and stylesheet order picks the winner. A caller's `h-10` lost to the token and a 40px button rendered at 36px. Register tokens:
  `extendTailwindMerge({ extend: { theme: { spacing: ["btn-sm","btn-md","field", …] } } })`.
- **Unknown text sizes.** `cn("text-meta", "text-ink")` treats `text-meta` as a colour and drops it. Register sizes:
  `theme: { text: ["meta","micro","label"] }`.
- **Custom shadows and colours.** `text-14` beside `text-t3`, or arbitrary `shadow-[var(--x)]` beside a named shadow: the same problem. When a codebase has a closed custom scale everywhere, use plain `clsx` there.

See `references/cn.ts`.

## Focus and validation

- An `aria-invalid:ring-*` style outranks `focus-visible:ring-*` and hides the focus ring on a focused invalid field. Write `aria-invalid:not-focus-visible:ring-…`.
- Bare `<button>`s inside forms submit them. If the shared Button doesn't default `type="button"`, every converted non-submit call site must set it.

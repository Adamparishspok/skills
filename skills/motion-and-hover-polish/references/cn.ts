import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only knows the utilities Tailwind ships. The kit's radii are
 * named after their role rather than their size — `rounded-card`,
 * `rounded-field`, `rounded-panel`, plus whatever an app adds — so out of the
 * box `cn("rounded-full", "rounded-field")` keeps both and the winner is
 * whichever Tailwind happens to emit last. That is how a 40px avatar meant to
 * be a rounded square comes out a circle.
 *
 * Registering them in the same conflict group as `rounded-*` restores the
 * rule the whole kit relies on: a caller's className always wins.
 */
/* The kit's measurement tokens (base.css): without them tailwind-merge does
   not know `h-btn-md` is a height, keeps it beside a caller's `h-10`, and the
   stylesheet's order decides — which silently shrank a 40px call site to the
   token's 36. */
const SPACING = [
  ...["xs", "sm", "md", "lg", "xl"].flatMap((s) => [`btn-${s}`, `btn-px-${s}`]),
  "field",
];

const build = (text: string[]) =>
  extendTailwindMerge({
    extend: {
      theme: { spacing: SPACING, ...(text.length ? { text } : {}) },
      classGroups: {
        rounded: [{ rounded: ["chip", "field", "card", "panel"] }],
      },
    },
  });
// The kit's own in-between steps (base.css / recipes.css), known from the start.
let sizes: string[] = ["meta", "micro", "label"];
let merge = build(sizes);

/**
 * Teach `cn` an app's own type scale (`--text-body`, `--text-h1`…).
 *
 * tailwind-merge files any `text-<name>` it does not recognise as a colour,
 * so out of the box `cn("text-body", "text-brand")` keeps only the colour,
 * and a caller's `className="text-body"` on a kit component knocks out the
 * component's own text colour. Registering the step names as font sizes
 * keeps the two groups apart. Call it once at module scope in the file that
 * defines the scale's helpers (it is idempotent), before anything renders.
 */
export function registerTextSizes(names: string[]) {
  const next = [...new Set([...sizes, ...names])];
  if (next.length === sizes.length) return;
  sizes = next;
  merge = build(sizes);
}

/** Merge conditional classes, with later Tailwind utilities beating earlier
 *  ones — so a caller's `className` can always override a component default. */
export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs));
}

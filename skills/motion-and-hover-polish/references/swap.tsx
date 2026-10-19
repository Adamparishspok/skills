import type { ReactNode } from "react";
import { cn } from "./cn"; // clsx + tailwind-merge, taught the kit's tokens

/**
 * Two glyphs that trade places: a menu that becomes a close, a copy icon that
 * becomes a check. The outgoing one shrinks, tilts and fades at once on an
 * ease-in; the incoming one follows `--delay-handoff` later on an ease-out, so
 * they never sit on top of each other at full strength. Both stay mounted, so
 * the swap reverses cleanly mid-flight.
 *
 * The wrapper is a box of the glyph's own size; pass `className` to size it.
 */
export function IconSwap({
  on,
  off,
  onIcon,
  className,
}: {
  /** Show `onIcon` instead of `off`. */
  on: boolean;
  off: ReactNode;
  onIcon: ReactNode;
  className?: string;
}) {
  const glyph =
    "col-start-1 row-start-1 transition-[scale,rotate,opacity] duration-tap";
  const shown = "scale-100 rotate-0 opacity-100 delay-handoff ease-out";
  const hidden = "scale-50 opacity-0 delay-0 ease-in";
  return (
    <span
      aria-hidden
      className={cn("inline-grid place-items-center", className)}
    >
      <span className={cn(glyph, on ? cn(hidden, "-rotate-[22deg]") : shown)}>
        {off}
      </span>
      <span className={cn(glyph, on ? shown : cn(hidden, "rotate-[22deg]"))}>
        {onIcon}
      </span>
    </span>
  );
}

/**
 * A label that rolls to its next state: "Copy link" lifts out as "Copied"
 * rises in. Both labels share one grid cell, so the control is as wide as the
 * longer one and never changes width mid-roll. The hidden label is
 * `invisible` once its exit finishes (`transition-discrete`), which takes it
 * out of the accessibility tree: a screen reader hears only the current one.
 */
export function LabelSwap({
  on,
  off,
  onLabel,
  className,
}: {
  on: boolean;
  off: ReactNode;
  onLabel: ReactNode;
  className?: string;
}) {
  const line =
    "col-start-1 row-start-1 transition-[translate,opacity,visibility] transition-discrete duration-hover ease-out-quint";
  return (
    <span className={cn("inline-grid overflow-hidden", className)}>
      <span
        className={cn(
          line,
          on ? "invisible -translate-y-3 opacity-0" : "visible opacity-100",
        )}
      >
        {off}
      </span>
      <span
        className={cn(
          line,
          on ? "visible opacity-100" : "invisible translate-y-3 opacity-0",
        )}
      >
        {onLabel}
      </span>
    </span>
  );
}

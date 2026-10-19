import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../lib/cn";
import { focusRing } from "../lib/focus";

/**
 * One button for every app on the kit. What differs between apps is
 * measurement, not markup, so the measurements are theme tokens: each size
 * reads its height and side padding from `--spacing-btn-<size>` and
 * `--spacing-btn-px-<size>` (base.css). The kit's defaults are 36px on a 6px
 * radius; a suite of apps sets its own in its theme file.
 * An icon button is a square of the same height.
 *
 * `accent` is the high-commitment action. It paints `bg-accent` and adds
 * `.accent-fill`, which an app's theme turns into either a gradient over the
 * fill (for example a two-stop near-black) or a sheen on top of it (for example
 * over a navy) — so it is never transparent in a theme that only defines one.
 */
const button = cva(
  cn(
    "relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-field font-medium whitespace-nowrap select-none",
    "transition-[background-color,border-color,color,box-shadow,filter,scale] duration-hover ease-out",
    "active:scale-[0.96] disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45",
    "aria-invalid:border-danger aria-invalid:not-focus-visible:ring-[3px] aria-invalid:not-focus-visible:ring-danger/20",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    focusRing,
  ),
  {
    variants: {
      variant: {
        accent:
          "accent-fill bg-accent text-accent-ink shadow-[var(--shadow-accent)] hover:brightness-115",
        brand: "bg-brand text-brand-ink hover:brightness-105",
        outline:
          "border border-line-2 bg-surface text-ink shadow-[var(--shadow-card)] hover:bg-surface-2 data-[state=open]:bg-surface-2",
        "outline-strong":
          "border border-line-3 bg-surface text-ink shadow-[var(--shadow-card)] hover:bg-surface-2",
        subtle: "bg-surface-3 text-ink hover:bg-line",
        ghost:
          "text-ink-3 hover:bg-surface-3 hover:text-ink data-[state=open]:bg-surface-3 data-[state=open]:text-ink",
        link: "h-auto! px-0! text-[var(--color-link,var(--color-ink))] underline-offset-[3px] hover:underline active:scale-100",
        danger:
          "border border-line-2 bg-surface text-danger shadow-[var(--shadow-card)] hover:border-danger/30 hover:bg-danger-soft",
        /* A filled destructive confirm. Its own fill token: the text red is
           too light to carry white type at 4.5:1 (#ef4444 is 3.8:1). */
        "danger-solid":
          "bg-danger-fill text-danger-fill-ink hover:brightness-95",
        "danger-ghost": "text-danger hover:bg-danger-soft",
      },
      size: {
        xs: "h-btn-xs px-btn-px-xs text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-btn-sm px-btn-px-sm text-meta [&_svg:not([class*='size-'])]:size-3.5",
        md: "h-btn-md px-btn-px-md text-sm [&_svg:not([class*='size-'])]:size-4",
        lg: "h-btn-lg px-btn-px-lg text-sm [&_svg:not([class*='size-'])]:size-4",
        xl: "h-btn-xl px-btn-px-xl text-[0.9375rem] [&_svg:not([class*='size-'])]:size-[1.125rem]",
        "icon-xs": "size-btn-xs [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-btn-sm [&_svg:not([class*='size-'])]:size-3.5",
        icon: "size-btn-md [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-btn-lg [&_svg:not([class*='size-'])]:size-4",
        "icon-xl": "size-btn-xl [&_svg:not([class*='size-'])]:size-[1.125rem]",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "outline", size: "md", block: false },
  },
);

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof button> & { asChild?: boolean };

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(button({ variant, size, block }), className)}
      {...props}
    />
  );
}

export { button as buttonVariants };

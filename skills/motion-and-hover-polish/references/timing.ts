/**
 * The motion tiers, for Motion (`motion/react`) and the Web Animations API.
 * The same values as the CSS `--duration-*` tokens in base.css, in seconds
 * (Motion's unit) — use `ms()` for WAAPI and GSAP-style millisecond APIs.
 *
 *   tap     an icon swapping, a press
 *   pop     a menu, popover or tooltip opening
 *   hover   a row or control answering the pointer
 *   card    a card lifting, a list settling, a page swap
 *   layout  a panel collapsing, the page reflowing
 *
 * Exits run at the next tier down from their entrance and ease in; a value
 * tween that reads as data (a count, a bar filling) may run longer than
 * `layout`, because the eye is following the number, not the motion.
 */
export const DUR = {
  tap: 0.1,
  pop: 0.15,
  hover: 0.2,
  card: 0.3,
  layout: 0.5,
} as const;

/** Second handed to the incoming half of a swap. */
export const HANDOFF = 0.05;

/** The kit's easings, as Motion cubic-bezier arrays. */
export const EASE = {
  out: [0.22, 1, 0.36, 1] as const, // --ease-out-quint
  outExpo: [0.16, 1, 0.3, 1] as const, // --ease-out-expo
  in: [0.4, 0, 1, 1] as const,
};

export const ms = (s: number) => Math.round(s * 1000);

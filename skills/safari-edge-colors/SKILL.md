---
name: safari-edge-colors
description: Make the areas behind iOS Safari's status bar and bottom toolbar match the page's top and bottom edge colors, including colors that change as you scroll. Uses two thin fixed edge strips that Safari samples, matching html/body backgrounds, theme-color, viewport-fit=cover and safe-area insets, with an optional fade into the content. Use when a hero, full-bleed background or fixed gradient is framed by white or mismatched bars on iPhone, or when top and bottom need different colors. Triggers on: mobile Safari, iOS Safari, status bar color, toolbar color, theme-color, safe area, env(safe-area-inset-top), viewport-fit=cover, notch, chrome bars, seamless background, overscroll color.
license: MIT
---

# Safari edge colors

On iPhone, Safari paints its status bar and bottom toolbar with a color it
samples from the page. By default that is often white, which frames a
full-bleed hero in ugly bars.

`<meta name="theme-color">` alone is not enough. In the browser (not an
installed web app) it is unreliable, and it sets one color for both edges.

**The fix:** Safari extends the background of a **fixed element** at each
edge behind its controls. Put a thin solid strip at the top and bottom.
At least 5px of each strip must be visible for Safari to pick up its color.

## 1. Static colors

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#004bff" />
...
<body>
  <div class="edge-top" aria-hidden="true"></div>
  <div class="edge-bottom" aria-hidden="true"></div>
  ...
</body>
```

```css
:root {
  --edge-top-background: #004bff;
  --edge-bottom-background: #004bff;
}
html { background: var(--edge-top-background); }
body { background: var(--edge-bottom-background); }

.edge-top::after, .edge-bottom::after {
  content: "";
  position: fixed;
  left: 0;
  right: 0;
  pointer-events: none;
}
.edge-top::after {
  top: 0;
  height: max(12px, env(safe-area-inset-top));
  background: var(--edge-top-background);
}
.edge-bottom::after {
  bottom: 0;
  height: max(12px, env(safe-area-inset-bottom));
  background: var(--edge-bottom-background);
}
```

Rules:
- Place the edge elements outside any ancestor with `transform`, `filter` or `contain`. Those ancestors turn `position: fixed` into positioning relative to themselves.
- Set `html` to the top color and `body` to the bottom color. Overscroll then shows the right color at each end.
- `viewport-fit=cover` lets the page draw under the notch. Keep text and controls inside the safe areas with `padding: env(safe-area-inset-*)`.
- Keep the strips clear of content. They sit above the page and cover anything under them.
- Use one source of truth for each color. Every value (visible background, strip, document background, meta tag) must match exactly, or the seam shows.

## 2. Soft fade (optional)

A hard 12px line can look like a bar. Shift the solid strip mostly off-screen,
leaving 5px visible for Safari to sample. Then fade from the edge color into
the content:

```css
.edge-top::after, .edge-bottom::after { height: 12px; z-index: 10; }
.edge-top::after    { top: -7px;    background: var(--edge-top-background); }
.edge-bottom::after { bottom: -7px; background: var(--edge-bottom-background); }

.edge-top::before, .edge-bottom::before {
  content: "";
  position: fixed;
  left: 0;
  right: 0;
  height: 48px;
  z-index: 10;
  pointer-events: none;
}
.edge-top::before    { top: 5px;    background: linear-gradient(to bottom, var(--edge-top-background), transparent); }
.edge-bottom::before { bottom: 5px; background: linear-gradient(to top, var(--edge-bottom-background), transparent); }
```

## 3. Colors that change on scroll

Compute the palette once per frame and write it to every place that uses it.

```js
const meta = document.querySelector('meta[name="theme-color"]');
const root = document.documentElement;
const prev = { top: root.style.getPropertyValue("--edge-top-background"),
               bottom: root.style.getPropertyValue("--edge-bottom-background"),
               theme: meta.content };

// colorsAt: your palette function, scroll progress 0..1 -> { top, bottom }
function apply() {
  const max = root.scrollHeight - innerHeight;
  const { top, bottom } = colorsAt(max > 0 ? scrollY / max : 0);
  root.style.setProperty("--edge-top-background", top);
  root.style.setProperty("--edge-bottom-background", bottom);
  meta.content = top;
}

let frame = 0;
const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(apply); };
addEventListener("scroll", schedule, { passive: true });
addEventListener("resize", schedule);                  // window resize
visualViewport?.addEventListener("resize", schedule);  // Safari toolbar expanding or collapsing
addEventListener("pageshow", schedule);                // bfcache return and restored scroll position
apply();

// On leaving the page (SPA route change, component unmount):
function cleanup() {
  cancelAnimationFrame(frame);
  removeEventListener("scroll", schedule);
  removeEventListener("resize", schedule);
  visualViewport?.removeEventListener("resize", schedule);
  removeEventListener("pageshow", schedule);
  root.style.setProperty("--edge-top-background", prev.top);
  root.style.setProperty("--edge-bottom-background", prev.bottom);
  meta.content = prev.theme;
}
```

Make the visible page background read the same variables (for example a fixed
gradient from `--edge-top-background` to `--edge-bottom-background`), so the
strips and the page can never drift apart.

## Limits

- Each edge must be a solid color. The color can change over time, but not across the width.
- Images and left-to-right gradients do not extend behind the controls. Pick the dominant edge color instead.

## Verify

Test on a real iPhone or the iOS Simulator. Desktop responsive mode does not
render Safari's chrome.
1. At the top of the page, the status bar and toolbar match the page edges with no seam.
2. Scroll until the toolbar collapses, then scroll back. Both edges follow the palette.
3. Overscroll past the top and bottom. The rubber-band areas match.
4. Navigate away and back. The colors restore to the right scroll position.
5. Check that no text or button sits under a strip or in the notch.

Technique from Josh Puckett, "Seamless Backgrounds on Mobile Safari"
(joshpuckett.me, October 2026), with a fade refinement from Joe Bell.

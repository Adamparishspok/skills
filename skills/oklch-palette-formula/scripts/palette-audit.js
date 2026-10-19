/**
 * Palette audit: resolves an app's colour tokens in a real browser, in both
 * themes, and checks WCAG contrast floors for text and control edges.
 *
 *   node palette-audit.js http://localhost:5173/                 audit
 *   node palette-audit.js http://localhost:5173/ --print         and list tokens
 *   node palette-audit.js <url> --root "#app" --attr data-theme  theme on #app
 *
 * The theme is switched by setting <attr>="light"|"dark" on the root element
 * (default: the <html> element and data-theme). Requires `playwright` and a
 * local Chrome (channel "chrome").
 *
 * Floors, measured against every ground the app declares:
 *   ink, ink-2, ink-3, ink-4   text           4.5:1
 *   field-line, ring           control edges  3:1   (WCAG 1.4.11)
 *
 * Exits 1 on any failure. Runs against a dev server; start the app first.
 */
import { chromium } from "playwright";

const url = process.argv[2];
const print = process.argv.includes("--print");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const rootSel = arg("--root", "html");
const attr = arg("--attr", "data-theme");
if (!url) {
  console.error("usage: node palette-audit.js <url> [--print] [--root <selector>] [--attr <name>]");
  process.exit(2);
}

const GROUNDS = ["ground", "panel", "surface", "surface-2", "surface-3", "field"];
const TEXT = ["ink", "ink-2", "ink-3", "ink-4"];
const EDGES = ["field-line", "ring"];

const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => p - q);
  return (y + 0.05) / (x + 0.05);
};
const hex = (c) => "#" + c.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
await page.goto(url, { waitUntil: "networkidle" });

let failed = 0;
for (const theme of ["light", "dark"]) {
  const tokens = await page.evaluate(
    ({ theme, names, rootSel, attr }) => {
      const root = document.querySelector(rootSel);
      root.setAttribute(attr, theme);
      const probe = document.createElement("span");
      root.appendChild(probe);
      // Paint each token onto a probe so the browser resolves oklch(), calc()
      // and var() chains to sRGB, then read it back from a canvas pixel.
      const cv = document.createElement("canvas").getContext("2d");
      const out = {};
      for (const n of names) {
        probe.style.color = `var(--color-${n})`;
        cv.fillStyle = "#000";
        cv.fillStyle = getComputedStyle(probe).color;
        cv.fillRect(0, 0, 1, 1);
        const [r, g, b] = cv.getImageData(0, 0, 1, 1).data;
        out[n] = [r / 255, g / 255, b / 255];
      }
      probe.remove();
      return out;
    },
    { theme, names: [...GROUNDS, ...TEXT, ...EDGES], rootSel, attr },
  );
  console.log(`\n${theme}`);
  if (print) for (const [n, c] of Object.entries(tokens)) console.log(`  ${n.padEnd(11)} ${hex(c)}`);
  for (const [set, floor] of [[TEXT, 4.5], [EDGES, 3]]) {
    for (const fg of set) {
      const worst = GROUNDS.map((g) => [g, ratio(tokens[fg], tokens[g])]).sort((a, b) => a[1] - b[1])[0];
      const ok = worst[1] >= floor;
      if (!ok) failed++;
      console.log(`  ${ok ? "ok  " : "FAIL"} ${fg.padEnd(11)} ${worst[1].toFixed(2)}:1 on ${worst[0]} (floor ${floor})`);
    }
  }
}
await browser.close();
process.exit(failed ? 1 : 0);

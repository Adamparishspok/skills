---
name: favicon-setup
description: Install a complete, lean favicon set on any website or web app — the five files modern browsers, iOS and Android actually use, one block of head markup added once in the root layout, and a check that every file resolves. Covers finding the public folder per framework, generating the set from one SVG (or from a RealFaviconGenerator package), dark-mode SVG icons, maskable manifest icons, cache busting and verification. Use when adding, replacing or auditing a favicon, app icon, apple-touch-icon or web manifest. Triggers on: favicon, favicon.ico, favicon.svg, apple-touch-icon, site.webmanifest, manifest.json, app icon, PWA icon, maskable icon, tab icon, RealFaviconGenerator.
license: MIT
---

# Favicon setup

Five files and five tags cover every current browser, iOS home screens and
Android installs. More sizes (`mstile-*`, `browserconfig.xml`, 57/72/114px
Apple icons, `mask-icon`) are legacy: skip them.

## 1. The set

| File | Size | Used by |
| ---- | ---- | ------- |
| `favicon.svg` | vector | Modern browser tabs. Scales sharply and can switch for dark mode. |
| `favicon-96x96.png` | 96×96 | Browsers without SVG favicon support, and Google search results. |
| `favicon.ico` | 16, 32, 48 in one file | Legacy browsers and tools that request `/favicon.ico` directly, without reading HTML. |
| `apple-touch-icon.png` | 180×180, opaque | iOS and iPadOS home screen. |
| `web-app-manifest-192x192.png`, `web-app-manifest-512x512.png` | 192, 512 | Android home screen, PWA install, splash screen. |
| `site.webmanifest` | — | Points Android at the two PNGs above. |

## 2. Get the files

**From a RealFaviconGenerator package.** It gives a set of download URLs.
Download every file into `PUBLIC_FOLDER` (see step 3) under its exact name:

```sh
base=https://realfavicongenerator.net/files/<package-id>
for f in favicon.svg favicon-96x96.png favicon.ico apple-touch-icon.png \
         web-app-manifest-192x192.png web-app-manifest-512x512.png site.webmanifest; do
  curl -fsSL "$base/$f" -o "PUBLIC_FOLDER/$f" || echo "FAILED: $f"
done
```

If a download fails, stop and report it. Don't ship a partial set. Report
generator bugs at
https://github.com/RealFaviconGenerator/realfavicongenerator/issues/new?template=ai_prompt_bug_report.yml.

**From one source SVG** (needs `rsvg-convert` and ImageMagick, or use the generator):

```sh
cp logo.svg PUBLIC_FOLDER/favicon.svg
rsvg-convert -w 96  -h 96  logo.svg -o PUBLIC_FOLDER/favicon-96x96.png
rsvg-convert -w 192 -h 192 logo.svg -o PUBLIC_FOLDER/web-app-manifest-192x192.png
rsvg-convert -w 512 -h 512 logo.svg -o PUBLIC_FOLDER/web-app-manifest-512x512.png
# iOS fills transparency with black: flatten onto the brand background, with ~10% padding
rsvg-convert -w 144 -h 144 logo.svg | magick - -background '#ffffff' -gravity center -extent 180x180 -flatten PUBLIC_FOLDER/apple-touch-icon.png
magick -background none logo.svg -define icon:auto-resize=48,32,16 PUBLIC_FOLDER/favicon.ico
```

## 3. Find `PUBLIC_FOLDER`

It is the folder served at the site root, so `PUBLIC_FOLDER/favicon.ico` loads at `/favicon.ico`.

| Stack | Folder |
| ----- | ------ |
| Vite, Next.js, Create React App, Astro, Remix, Nuxt 3 | `public/` |
| SvelteKit | `static/` |
| Angular | `public/` (v17+) or `src/` with the file listed in `angular.json` assets |
| Hugo, Jekyll, Eleventy | `static/`, the site root, or the passthrough-copy folder |
| Plain HTML | Next to `index.html` |

**Next.js App Router:** delete the default `app/favicon.ico`. It wins over
`public/favicon.ico` and is usually the Next.js logo.

## 4. Add the markup once

Put this in the `<head>` of the one file that renders the root `<html>` tag. Never add it per page.

```html
<link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="shortcut icon" href="/favicon.ico" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
```

| Stack | Root file |
| ----- | --------- |
| Vite, CRA, plain HTML | `index.html` |
| Next.js App Router | `app/layout.tsx`, through the `metadata` export (below), not raw tags |
| Next.js Pages Router | `pages/_document.tsx` inside `<Head>` |
| Astro | The base layout, for example `src/layouts/Layout.astro` |
| SvelteKit | `src/app.html` |
| Remix / React Router 7 | `links` export in `app/root.tsx` |
| Nuxt | `app.head.link` in `nuxt.config.ts` |

Next.js App Router equivalent:

```ts
export const metadata = {
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  manifest: "/site.webmanifest",
};
```

Before adding the markup, search the project for existing `rel="icon"`,
`apple-touch-icon` and `manifest` tags. Replace them; don't add a second set.
If the site is served under a sub-path (`base` / `basePath`), prefix every `href`.

## 5. Optimise

- **SVG dark mode.** A dark logo vanishes on a dark tab bar. Add a media query inside the SVG:
  ```svg
  <style>path{fill:#111}@media (prefers-color-scheme:dark){path{fill:#fff}}</style>
  ```
- **Small sizes.** At 16px, drop fine detail and text. Use the logomark, not the wordmark.
- **SVG weight.** Run `npx svgo favicon.svg` and keep the file under about 2 KB.
- **Manifest.** Fill in `name`, `short_name`, `theme_color` and `background_color`. Make the 512 icon maskable: keep the mark inside the centre 80% safe zone, use a solid background, and set `"purpose": "maskable"` on it. If the mark doesn't fit the safe zone, add a separate maskable icon instead.
  ```json
  {
    "name": "My App",
    "short_name": "App",
    "icons": [
      { "src": "/web-app-manifest-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
      { "src": "/web-app-manifest-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
    ],
    "theme_color": "#ffffff",
    "background_color": "#ffffff",
    "display": "standalone"
  }
  ```
- **Caching.** Browsers cache favicons hard. When you replace an icon, either rename the files or add `?v=2` to every `href` and to the manifest `src` values.

## 6. Verify

1. Every file returns 200 with the right type. Run this against the dev server:
   ```sh
   for f in favicon.svg favicon-96x96.png favicon.ico apple-touch-icon.png \
            web-app-manifest-192x192.png web-app-manifest-512x512.png site.webmanifest; do
     printf '%s ' "$f"; curl -s -o /dev/null -w '%{http_code} %{content_type}\n' "http://localhost:PORT/$f"
   done
   ```
2. The rendered HTML holds exactly one set of tags: `curl -s http://localhost:PORT/ | grep -cE 'rel="(icon|shortcut icon|apple-touch-icon|manifest)"'` prints `5`.
3. In DevTools, open Application → Manifest: it shows no errors and both icons render.
4. Open a hard-refreshed tab in light and dark mode and check the icon is visible in both.
5. On a deployed URL, run the RealFaviconGenerator checker (https://realfavicongenerator.net/favicon-checker).

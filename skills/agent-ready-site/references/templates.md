# Templates

Replace `example.com` and every placeholder. Delete any block that SKILL.md
section 2 marks "not applicable": don't ship placeholders.

## robots.txt

```
# Content signals: https://contentsignals.org
User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=no
Allow: /
Disallow: /account
Disallow: /cart
Disallow: /checkout
Disallow: /admin

# AI search and user-triggered fetchers: allow, so the site can be cited and used
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: PerplexityBot
User-agent: Perplexity-User
Allow: /

# Training crawlers: allow or disallow per the owner's choice. Ask; don't assume.
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: CCBot
User-agent: meta-externalagent
User-agent: Bytespider
Disallow: /

Sitemap: https://example.com/sitemap.xml
```

`ai-train=no` and blocking training crawlers are policy choices. Confirm them
with the owner. Content Signals state a preference only; nothing enforces them.

## Markdown for Agents (not on Cloudflare)

Next.js middleware. It rewrites Markdown requests to a route that renders the
page's data as Markdown:

```ts
// middleware.ts
import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  if (!req.headers.get("accept")?.includes("text/markdown")) return;
  const url = req.nextUrl.clone();
  url.pathname = `/md${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = { matcher: ["/((?!_next|api|md|.*\\..*).*)"] };
```

```ts
// app/md/[[...path]]/route.ts
export async function GET(_: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  const markdown = await pageToMarkdown(path); // build from the same data the page renders
  return new Response(markdown, {
    headers: { "Content-Type": "text/markdown; charset=utf-8", Vary: "Accept" },
  });
}
```

Also add `Vary: Accept` to the HTML responses of the same paths, through
`headers()` in `next.config`. For a static site, generate a `.md` file next to
each page at build time, and use a header-based rewrite on the host instead.

## Link header (homepage)

```
Link: </.well-known/api-catalog>; rel="api-catalog", </index.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"; type="text/markdown"
```

`vercel.json`:

```json
{
  "headers": [
    { "source": "/", "headers": [{ "key": "Link", "value": "</.well-known/api-catalog>; rel=\"api-catalog\"" }] },
    { "source": "/.well-known/api-catalog", "headers": [{ "key": "Content-Type", "value": "application/linkset+json" }] }
  ]
}
```

Netlify or Cloudflare Pages `_headers`:

```
/
  Link: </.well-known/api-catalog>; rel="api-catalog"
/.well-known/api-catalog
  Content-Type: application/linkset+json
```

## /.well-known/api-catalog (RFC 9727)

```json
{
  "linkset": [
    {
      "anchor": "https://api.example.com/v1",
      "service-desc": [{ "href": "https://api.example.com/v1/openapi.json", "type": "application/openapi+json" }],
      "service-doc": [{ "href": "https://example.com/docs/api", "type": "text/html" }],
      "status": [{ "href": "https://api.example.com/v1/health", "type": "application/json" }]
    }
  ]
}
```

## /.well-known/oauth-protected-resource (RFC 9728)

Serve this from the API's origin:

```json
{
  "resource": "https://api.example.com",
  "authorization_servers": ["https://auth.example.com"],
  "scopes_supported": ["read", "write"],
  "bearer_methods_supported": ["header"],
  "resource_documentation": "https://example.com/docs/api"
}
```

An unauthenticated API request returns:

```
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="https://api.example.com/.well-known/oauth-protected-resource"
```

`https://auth.example.com/.well-known/oauth-authorization-server` must exist,
and its `issuer` must equal `https://auth.example.com`.

## /auth.md

```markdown
# Example auth.md

Agents act for a signed-in user through OAuth 2.1 with PKCE.

- Protected resource metadata: https://api.example.com/.well-known/oauth-protected-resource
- Authorization server: https://auth.example.com (metadata at /.well-known/oauth-authorization-server)
- Scopes: `read` (catalog, orders), `write` (cart, orders)
- Send the access token as `Authorization: Bearer <token>`.
- Agents without a user: not supported. Contact api@example.com.
```

For self-service agent registration (`agent_auth`, ID-JAG, anonymous
credentials), fetch the `auth-md` fix skill. Its fields are still changing.

## /llms.txt

```markdown
# Example Store

> Organic produce from local farms, delivered in Portland. Prices in USD.

## Shop
- [All products](https://example.com/shop): catalog with prices and stock
- [Delivery areas](https://example.com/delivery): zip codes and fees

## Help
- [FAQ](https://example.com/faq)
- [Returns](https://example.com/returns)
```

## JSON-LD: product page

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Heirloom tomatoes, 1 lb",
  "image": "https://example.com/img/tomatoes.jpg",
  "description": "Mixed heirloom tomatoes from Sauvie Island.",
  "sku": "TOM-HEIR-1LB",
  "brand": { "@type": "Brand", "name": "Example Farm" },
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/product/heirloom-tomatoes",
    "price": "5.99",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
}
</script>
```

Build it from the same data as the visible price and stock, so they never
disagree.

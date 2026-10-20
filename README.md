# Skills

Open-source agent skills by Adam Parish, for design engineering and shipping
the web. Each one is drawn from real work. For example, the design skills come
from moving 17 prototype apps onto one shared component library, one palette
formula, one motion tempo and a contrast audit, without losing any app's look.

Each skill is a folder with a `SKILL.md` (frontmatter `name` + `description`,
then the method) plus the reference code and scripts it uses. They work with
Claude Code, Cursor, Codex and any agent that reads `SKILL.md` folders.

| Skill | What it does |
| ----- | ------------ |
| [`oklch-palette-formula`](skills/oklch-palette-formula/SKILL.md) | Neutrals from a few OKLCH inputs and a ladder per theme. A fit script reproduces an existing palette within ΔE 2, and a browser audit enforces WCAG floors. |
| [`motion-and-hover-polish`](skills/motion-and-hover-polish/SKILL.md) | One duration scale (tap/pop/hover/card/layout), plus hover recipes: grow-in rows, trailing arrows, nudges, lifts, scroll fades, icon and label swaps. |
| [`multi-app-design-system`](skills/multi-app-design-system/SKILL.md) | Consolidate many apps onto token-sized shared components. Covers variant mapping, what stays app-specific, and the tailwind-merge traps. |
| [`visual-regression-pass`](skills/visual-regression-pass/SKILL.md) | Before/after screenshots across many apps in parallel, ranked diffs, and triage of noise vs real regressions. |
| [`favicon-setup`](skills/favicon-setup/SKILL.md) | The lean five-file favicon set, head markup added once per framework, dark-mode SVG, maskable manifest icons, cache busting and verification. |
| [`agent-ready-site`](skills/agent-ready-site/SKILL.md) | Make a site, app or store ready for AI agents. Scans with Cloudflare's Agent Readiness checks and sorts out which apply. Ships robots/Content Signals, Markdown for Agents, Link headers, API catalog and OAuth discovery, plus JSON-LD and llms.txt. |
| [`well-run-software`](skills/well-run-software/SKILL.md) | Audit or set up the practices that keep software shipping safely: rulesets, PR template, CI with SHA-pinned actions, pre-commit hooks, Prettier/Biome and strict ESLint, Conventional Commits, ticket-linked PRs, Dependabot, secrets and incident basics. A read-only script scores any repo. |
| [`safari-edge-colors`](skills/safari-edge-colors/SKILL.md) | Match iOS Safari's status bar and toolbar to the page's top and bottom edges with fixed edge strips, including scroll-driven colors. |

## Honorable mentions

Skills from elsewhere that I reach for and recommend.

| Skill set | Why it's here |
| --------- | ------------- |
| [Cloudflare Agent Readiness](https://isitagentready.com/.well-known/agent-skills/index.json) | One skill per check in Cloudflare's [Agent Readiness scan](https://isitagentready.com): robots.txt and AI bot rules, Content Signals, sitemap, llms.txt, Markdown negotiation, Web Bot Auth and more, each with the fix. Published through their [Agent Skills discovery RFC](https://github.com/cloudflare/agent-skills-discovery-rfc), so agents can find it at a well-known URL. See the [launch post](https://blog.cloudflare.com/agent-readiness/). |

## Install

Claude Code (user-wide):

```
git clone https://github.com/Adamparishspok/skills.git ~/adam-skills
ln -s ~/adam-skills/skills/* ~/.claude/skills/
```

Per project: copy a skill folder into `.claude/skills/` (Claude Code) or
`.cursor/skills/` (Cursor).

## License

MIT licensed.

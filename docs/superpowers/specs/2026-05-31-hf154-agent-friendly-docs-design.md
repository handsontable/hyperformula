# HF-154: Agent-Friendly Docs — Design Spec

**Date:** 2026-05-31
**Status:** Approved (meeting 2026-05-28, Marcin + Kuba)
**Branch target:** develop

## Context

Joseph (GreenFlux) already shipped in `hyperformula-website` repo: robots.txt, sitemap, llms.txt, public HF skill, Git MCP. He also has DRAFT PR #1686 migrating VuePress → Astro Starlight with `starlight-page-actions` (auto `.md` companions + Copy Markdown button). We stay on VuePress for this release and implement equivalent functionality, borrowing Joseph's UX patterns where useful.

## Scope

Five independent components, all targeted at VuePress 1.x under `docs/`.

---

## C1: `vuepress-plugin-md-companions`

**What it does:** Post-build VuePress plugin. For every guide page source file, strips VuePress-specific syntax and emits a clean `.md` companion file into `dist/` alongside the `.html`. Also emits `dist/llms-full.txt`.

**Strips from source markdown:**
- Custom containers (`:::tip`, `:::warning`, `:::danger`) → strip fence, keep body text
- Inline `<script>`, `<style>` blocks → omit entirely
- `[[toc]]` tokens → omit
- VuePress-specific frontmatter keys (`pageClass`, `sidebarDepth`, `prev`, `next`) → omit

**Keeps:** headings, paragraphs, code blocks (fenced and indented), links (resolved to absolute URLs using `DOCS_HOSTNAME`), images, tables.

**Output per page:** `dist/guide/<slug>.md` and `dist/api/<slug>.md`

**llms-full.txt format:**
```
# HyperFormula Documentation

> Full documentation corpus for LLM consumption.
> Individual pages also available at /docs/guide/<slug>.md

---

## <Page Title>

URL: https://hyperformula.handsontable.com/guide/<slug>

<cleaned markdown content>

---
```

**VuePress hook:** `generated(pagePaths)` lifecycle + Node.js fs to read source `.md` files from `docs/guide/` and `docs/api/` and write companions to `dist/`. `DOCS_HOSTNAME` defaults to `https://hyperformula.handsontable.com` (same env var used in `config.js`).

**File:** `docs/.vuepress/plugins/md-companions/index.js`

---

## C2: `CopyMarkdownButton.vue`

**What it does:** Global UI component (registered in `config.js` `globalUIComponents`) rendered on every page. Displays a "Copy Markdown" button. On click: constructs the `.md` URL for the current page, copies to clipboard, shows a brief "Copied!" flash.

**URL construction:** `window.location.href` with `.html` replaced by `.md` (or appended if no `.html`).

**Placement:** Fixed `position: fixed; bottom: 1.5rem; right: 1.5rem` — matches the intent of Joseph's sidebar button but works within VuePress default theme without theme overrides. CSS scoped to the component; z-index above content, below modals (z-index: 100).

**File:** `docs/.vuepress/components/CopyMarkdownButton.vue`
**Registration:** `globalUIComponents: ['CopyMarkdownButton']` in `config.js`

---

## C3: `setup-coding-agent.md` (Version A — static)

**What it does:** New guide page at `docs/guide/setup-coding-agent.md`. Reachable from the sidebar. Covers how to set up a coding agent to work with HyperFormula.

**Page structure:**
```
# Set Up Your Coding Agent for HyperFormula

One-paragraph intro.

## Claude Code
install command + install prompt + what the skill enables

## Cursor
AGENTS.md / .cursorrules setup + link to skill

## GitHub Copilot
instructions file setup

## Other agents
Generic: point at llms-full.txt + AGENTS.md pattern

## Resources
Links: skill repo, llms-full.txt, AGENTS.md, llms.txt
```

**Sidebar:** Add entry to `docs/.vuepress/config.js` sidebar under the existing "Getting started" or a new "AI & Agents" group.

**File:** `docs/guide/setup-coding-agent.md`

---

## C4: `CodingAgentWizard.vue` (Version B — interactive)

**What it does:** Vue SFC embedded in `setup-coding-agent.md` via `<CodingAgentWizard />`. Step 1: card-based IDE selector. Step 2: rendered instructions with a "Copy prompt" button.

**IDEs supported:** Claude Code, Cursor, GitHub Copilot, Other.

**Step 2 content per IDE:**
- **Claude Code:** `/install hyperformula` command + explanation
- **Cursor:** Paste into `.cursorrules` or `AGENTS.md` block to add
- **Copilot:** GitHub Copilot instructions file snippet
- **Other:** Generic llms-full.txt fetch instruction

**State:** Local Vue `data` (no Vuex). `selectedIde: null | string`, `copied: false`.

**File:** `docs/.vuepress/components/CodingAgentWizard.vue`

Both versions (A static + B wizard) live on the same page. Version A provides the fallback readable content; Version B is the progressive enhancement above it.

---

## C5: `llms.txt` and `robots.txt` update

`docs/.vuepress/public/robots.txt` already exists and points to sitemap. Add `llms-full.txt` reference:

Add a comment line pointing to the full corpus (robots.txt doesn't have a formal LLMs field, but a comment is discoverable):

```
# AI/LLM agent index
# Full documentation corpus: https://hyperformula.handsontable.com/llms-full.txt
```

Also create `docs/.vuepress/public/llms.txt` if not present (Joseph added it to the website repo only; the main HF repo currently has none). Minimal format per the llms.txt standard:

```
# HyperFormula

> HyperFormula is an open-source spreadsheet calculation engine.

## Docs

- Guide: https://hyperformula.handsontable.com/guide/
- Full corpus: https://hyperformula.handsontable.com/llms-full.txt
```

---

## Build pipeline impact

```
npm run docs:build
  └─ vuepress build docs
       └─ generated() hook fires
            ├─ emits dist/guide/*.md
            ├─ emits dist/api/*.md
            └─ emits dist/llms-full.txt
```

No new npm scripts needed. Plugin self-registers via `config.js`.

---

## Reference: Joseph's approach (PR #1686)

- `starlight-page-actions@^0.6.0` handles .md companions + button in Astro
- Button placement: right sidebar under "On this page"
- Also adds "Open in ChatGPT" and "Open in Claude" buttons — **not in our scope** for this PR, but the UX pattern is worth noting for a follow-up

---

## Out of scope

- Migrating to Astro Starlight (Joseph's PR #1686 — separate track)
- "Open in ChatGPT" / "Open in Claude" buttons (Joseph's PR)
- Skill content updates (Joseph owns the published skill)
- Testing whether the skill gives correct results (Ola's job)
- Printing Press CLI evaluation (research backlog)

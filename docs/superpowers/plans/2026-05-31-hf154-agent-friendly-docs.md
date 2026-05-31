# HF-154 Agent-Friendly Docs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make HyperFormula's VuePress docs agent-friendly by emitting clean `.md` companions + `llms-full.txt`, adding a Copy Markdown button, and a "Set up your coding agent" page (static + interactive wizard).

**Architecture:** Five components targeting VuePress 1.x under `docs/`. A post-build plugin (`generated` hook) writes `.md` companions and `llms-full.txt` into the dist dir. A global Vue component renders the Copy Markdown button using `$page.path`. A new guide page hosts both a static IDE matrix and an interactive wizard component. All paths respect `base: '/docs/'`.

**Tech Stack:** VuePress 1.9.10, Vue 2 SFCs, markdown-it, Node.js fs, plain `node` test scripts (matching existing `docs/.vuepress/plugins/*/test.js` pattern).

**Critical constraint:** `docs/.vuepress/build.config.js` sets `base: '/docs/'`, `dest: 'docs/.vuepress/dist/docs'`. `ctx.outDir` already includes the `/docs` segment. Page paths (`$page.path`) do NOT include base — prepend with `$withBase`.

**Parallelization units** (for subagent dispatch):
- **Unit A** = Task 1 (C1 plugin) — independent
- **Unit B** = Task 2 (C2 button) — independent
- **Unit C** = Tasks 3+4 (C3 page + C4 wizard, coupled, same page) — independent
- **Unit D** = Task 5 (C5 llms.txt/robots.txt) — independent
- **Task 6** = integration (wire into config.js, full build, verify) — runs LAST, after A–D merge

---

## Task 1: C1 — `md-companions` VuePress plugin

**Files:**
- Create: `docs/.vuepress/plugins/md-companions/strip.js` (pure stripping function)
- Create: `docs/.vuepress/plugins/md-companions/strip.test.js` (node test)
- Create: `docs/.vuepress/plugins/md-companions/index.js` (plugin: generated hook)
- Create: `docs/.vuepress/plugins/md-companions/fixture.md` (test fixture)

- [ ] **Step 1: Write the failing test for `stripVuePressSyntax`**

Create `docs/.vuepress/plugins/md-companions/strip.test.js`:

```js
const assert = require('assert');
const { stripVuePressSyntax } = require('./strip');

let passed = 0;
const check = (name, actual, expected) => {
  assert.strictEqual(actual, expected, `FAIL: ${name}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`);
  passed++;
};

// 1. :::tip container -> blockquote, body kept
check('tip container',
  stripVuePressSyntax(':::tip Heads up\nBe careful here.\n:::'),
  '> **Heads up**\n>\n> Be careful here.');

// 2. :::warning without title
check('warning no title',
  stripVuePressSyntax(':::warning\nDanger zone.\n:::'),
  '> Danger zone.');

// 3. CRITICAL: ::: inside a fenced code block is NOT touched
check('code fence with ::: inside',
  stripVuePressSyntax('```js\nconst x = ":::tip";\n```'),
  '```js\nconst x = ":::tip";\n```');

// 4. <script> block removed entirely
check('script removed',
  stripVuePressSyntax('Text before\n<script>\nconsole.log(1)\n</script>\nText after'),
  'Text before\nText after');

// 5. standalone Vue component removed
check('vue component removed',
  stripVuePressSyntax('Intro\n<CodingAgentWizard />\nOutro'),
  'Intro\nOutro');

// 6. [[toc]] removed
check('toc removed',
  stripVuePressSyntax('# Title\n[[toc]]\nBody'),
  '# Title\nBody');

// 7. headings, code, links, tables preserved
check('content preserved',
  stripVuePressSyntax('# H\n\n`code`\n\n[link](/guide/x)\n\n| a | b |\n|---|---|'),
  '# H\n\n`code`\n\n[link](/guide/x)\n\n| a | b |\n|---|---|');

console.log(`PASS md-companions/strip (${passed} assertions)`);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node docs/.vuepress/plugins/md-companions/strip.test.js`
Expected: FAIL — `Cannot find module './strip'`

- [ ] **Step 3: Implement `strip.js`**

Create `docs/.vuepress/plugins/md-companions/strip.js`:

```js
/**
 * Strips VuePress-specific markdown syntax, producing clean markdown
 * suitable for LLM consumption. Fence-aware: never edits inside code blocks.
 * @param {string} src raw markdown (frontmatter already removed)
 * @returns {string} cleaned markdown
 */
function stripVuePressSyntax(src) {
  const lines = src.split('\n');
  const out = [];
  let inFence = false;
  let fenceMarker = '';
  let inScript = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track fenced code blocks (``` or ~~~). Inside a fence, copy verbatim.
    const fenceMatch = trimmed.match(/^(```+|~~~+)/);
    if (fenceMatch && !inScript) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fenceMatch[1][0];
      } else if (trimmed.startsWith(fenceMarker)) {
        inFence = false;
      }
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }

    // Remove <script> / <style> blocks entirely.
    if (/^<(script|style)[\s>]/i.test(trimmed)) { inScript = true; continue; }
    if (inScript) {
      if (/<\/(script|style)>/i.test(trimmed)) inScript = false;
      continue;
    }

    // Remove standalone Vue component tags (e.g. <CodingAgentWizard />).
    if (/^<[A-Z][A-Za-z0-9]*(\s[^>]*)?\/?>$/.test(trimmed)) continue;

    // Remove [[toc]].
    if (/^\[\[toc\]\]$/i.test(trimmed)) continue;

    // Convert custom container opening :::type [title].
    const open = trimmed.match(/^:::\s*(tip|warning|danger|details)\s*(.*)$/i);
    if (open) {
      const title = open[2].trim();
      // collect body until closing :::
      const body = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ':::') { body.push(lines[i]); i++; }
      if (title) { out.push(`> **${title}**`); out.push('>'); }
      body.forEach(b => out.push(b.trim() === '' ? '>' : `> ${b}`));
      // trim a single trailing '>' artifact
      while (out.length && out[out.length - 1] === '>') out.pop();
      continue;
    }

    out.push(line);
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

module.exports = { stripVuePressSyntax };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node docs/.vuepress/plugins/md-companions/strip.test.js`
Expected: `PASS md-companions/strip (7 assertions)`

- [ ] **Step 5: Write the plugin `index.js`**

Create `docs/.vuepress/plugins/md-companions/index.js`:

```js
const fs = require('fs');
const path = require('path');
const { stripVuePressSyntax } = require('./strip');

/**
 * VuePress plugin: after build, write a clean `.md` companion next to each
 * rendered `.html`, plus an aggregate `llms-full.txt`. Respects ctx.outDir
 * (which already includes the configured base segment).
 * @param {object} options plugin options
 * @param {object} ctx VuePress app context
 */
module.exports = (options, ctx) => ({
  name: 'md-companions',
  async generated() {
    const hostname = (options && options.hostname) || 'https://hyperformula.handsontable.com';
    const base = ctx.base || '/';
    const pages = ctx.pages.filter(p => /\.html$/.test(p.path) && p.path !== '/404.html');
    const corpus = [
      '# HyperFormula Documentation',
      '',
      '> Full documentation corpus for LLM consumption.',
      '> Individual pages also available at <base>/guide/<slug>.md',
      '',
    ];

    for (const page of pages) {
      const clean = stripVuePressSyntax(page._strippedContent || '');
      const relPath = page.path.replace(/\.html$/, '.md');           // /guide/foo.md
      const outFile = path.join(ctx.outDir, relPath.replace(/^\//, ''));
      await fs.promises.mkdir(path.dirname(outFile), { recursive: true });
      await fs.promises.writeFile(outFile, clean, 'utf8');

      const url = hostname + base.replace(/\/$/, '') + page.path.replace(/\.html$/, '');
      corpus.push('---', '', `## ${page.title || page.path}`, '', `URL: ${url}`, '', clean, '');
    }

    const llmsFull = path.join(ctx.outDir, 'llms-full.txt');
    await fs.promises.writeFile(llmsFull, corpus.join('\n'), 'utf8');
  }
});
```

- [ ] **Step 6: Commit**

```bash
git add docs/.vuepress/plugins/md-companions/
git commit -m "feat(docs): add md-companions plugin for .md exports and llms-full.txt"
```

---

## Task 2: C2 — `CopyMarkdownButton.vue`

**Files:**
- Create: `docs/.vuepress/components/CopyMarkdownButton.vue`

VuePress auto-registers any `.vue` file under `docs/.vuepress/components/` as a global component (no manual registration needed). It is rendered globally via `globalUIComponents` in Task 6.

- [ ] **Step 1: Create the component**

Create `docs/.vuepress/components/CopyMarkdownButton.vue`:

```vue
<template>
  <button
    v-if="mdUrl"
    class="copy-md-button"
    type="button"
    :title="'Copy this page as Markdown URL for LLMs'"
    @click="copy"
  >{{ label }}</button>
</template>

<script>
export default {
  name: 'CopyMarkdownButton',
  data() {
    return { copied: false };
  },
  computed: {
    // Build the served .md URL from the canonical page path + base.
    // Homepage / index pages have no .html slug -> hide the button.
    mdUrl() {
      const p = this.$page && this.$page.path;
      if (!p || !/\.html$/.test(p)) return null;
      return this.$withBase(p.replace(/\.html$/, '.md'));
    },
    label() {
      return this.copied ? 'Copied!' : 'Copy Markdown';
    },
  },
  methods: {
    copy() {
      const absolute = window.location.origin + this.mdUrl;
      navigator.clipboard.writeText(absolute).then(() => {
        this.copied = true;
        setTimeout(() => { this.copied = false; }, 1500);
      });
    },
  },
};
</script>

<style scoped>
.copy-md-button {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 100;
  padding: 0.5rem 0.9rem;
  font-size: 0.85rem;
  border: 1px solid #3eaf7c;
  border-radius: 4px;
  background: #fff;
  color: #3eaf7c;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);
}
.copy-md-button:hover { background: #3eaf7c; color: #fff; }
</style>
```

- [ ] **Step 2: Verify it parses (lint)**

Run: `npx eslint docs/.vuepress/components/CopyMarkdownButton.vue --no-eslintrc --parser vue-eslint-parser 2>/dev/null || echo "manual review: confirm template/script/style blocks well-formed"`
Expected: no parse error (or fall back to manual confirmation — the project's ESLint targets `.js,.ts`, not `.vue`).

- [ ] **Step 3: Commit**

```bash
git add docs/.vuepress/components/CopyMarkdownButton.vue
git commit -m "feat(docs): add Copy Markdown button global component"
```

---

## Task 3: C3 — `setup-coding-agent.md` static page

**Files:**
- Create: `docs/guide/setup-coding-agent.md`

**Install-command source of truth:** `handsontable/handsontable-skills` README. Verified real commands:
- Claude Code marketplace: `/plugin marketplace add handsontable/handsontable-skills` then `/plugin install handsontable-skills@handsontable-skills`
- Manual: `git clone https://github.com/handsontable/handsontable-skills.git` then `cp -r handsontable-skills/skills/hyperformula ~/.claude/skills/`
- Cowork/web: zip from GitHub releases
- API: folder upload

The published skill has **no Cursor- or Copilot-specific installer**. Do NOT invent one. Cursor/Copilot/Other sections point to `llms-full.txt` + the manual clone, framed honestly.

- [ ] **Step 1: Write the page**

Create `docs/guide/setup-coding-agent.md`:

```markdown
# Set up your coding agent

HyperFormula ships an official Claude skill and machine-readable docs so your AI coding agent can scaffold, configure, and debug HyperFormula correctly. Pick your tool below, or use the interactive wizard.

<CodingAgentWizard />

## Claude Code

Install the official skill from the plugin marketplace:

\```
/plugin marketplace add handsontable/handsontable-skills
/plugin install handsontable-skills@handsontable-skills
\```

Claude Code loads the `hyperformula` skill automatically based on what you ask.

## Cursor, Copilot & other agents

These tools don't yet support the Claude skill format. Point your agent at the machine-readable docs instead:

- **Full corpus:** [`/docs/llms-full.txt`](/llms-full.txt) — the entire documentation in one LLM-friendly file.
- **Per-page Markdown:** append `.md` to any docs URL, or use the **Copy Markdown** button on any page.

For agents that read a rules file (e.g. Cursor's `AGENTS.md`), add a line pointing at the corpus URL so the agent fetches authoritative docs on demand.

## Manual install (any Claude Code setup)

\```bash
git clone https://github.com/handsontable/handsontable-skills.git
cp -r handsontable-skills/skills/hyperformula ~/.claude/skills/
\```

## Resources

- [Official skill repository](https://github.com/handsontable/handsontable-skills)
- [`llms-full.txt`](/llms-full.txt)
- [API reference](/api/)
```

(Note: the `\``` fences above are escaped only in this plan; write real triple-backtick fences in the file.)

- [ ] **Step 2: Verify links resolve under base**

Run: `grep -n "llms-full.txt\|handsontable-skills" docs/guide/setup-coding-agent.md`
Expected: links present. `$withBase` is applied by VuePress to root-absolute links like `/llms-full.txt` automatically in rendered output.

- [ ] **Step 3: Commit**

```bash
git add docs/guide/setup-coding-agent.md
git commit -m "docs: add Set up your coding agent guide page"
```

---

## Task 4: C4 — `CodingAgentWizard.vue` interactive component

**Files:**
- Create: `docs/.vuepress/components/CodingAgentWizard.vue`

Embedded in the Task 3 page via `<CodingAgentWizard />`. Local Vue state only. Content per IDE mirrors the verified commands from Task 3 — no invented commands.

- [ ] **Step 1: Create the component**

Create `docs/.vuepress/components/CodingAgentWizard.vue`:

```vue
<template>
  <div class="agent-wizard">
    <div v-if="!selected" class="agent-wizard__choices">
      <p class="agent-wizard__prompt">Which coding agent do you use?</p>
      <button
        v-for="opt in options"
        :key="opt.id"
        class="agent-wizard__choice"
        type="button"
        @click="selected = opt.id"
      >{{ opt.label }}</button>
    </div>

    <div v-else class="agent-wizard__result">
      <button class="agent-wizard__back" type="button" @click="reset">&larr; Change</button>
      <h3>{{ current.label }}</h3>
      <pre class="agent-wizard__snippet"><code>{{ current.snippet }}</code></pre>
      <button class="agent-wizard__copy" type="button" @click="copy">{{ copied ? 'Copied!' : 'Copy' }}</button>
      <p class="agent-wizard__note" v-html="current.note"></p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CodingAgentWizard',
  data() {
    return {
      selected: null,
      copied: false,
      options: [
        {
          id: 'claude-code',
          label: 'Claude Code',
          snippet: '/plugin marketplace add handsontable/handsontable-skills\n/plugin install handsontable-skills@handsontable-skills',
          note: 'Installs the official <code>hyperformula</code> skill. Claude Code loads it automatically.',
        },
        {
          id: 'cursor',
          label: 'Cursor',
          snippet: 'Add to your AGENTS.md / rules file:\nHyperFormula docs (LLM-friendly): https://hyperformula.handsontable.com/docs/llms-full.txt',
          note: 'Cursor has no Claude-skill installer yet — point it at the full docs corpus instead.',
        },
        {
          id: 'copilot',
          label: 'GitHub Copilot',
          snippet: 'Add to .github/copilot-instructions.md:\nReference HyperFormula docs: https://hyperformula.handsontable.com/docs/llms-full.txt',
          note: 'Copilot reads an instructions file — link it to the corpus so it fetches authoritative docs.',
        },
        {
          id: 'other',
          label: 'Other / API',
          snippet: 'curl -s https://hyperformula.handsontable.com/docs/llms-full.txt',
          note: 'Fetch the full corpus, or upload the skill folder from <code>handsontable/handsontable-skills</code> to the Claude API.',
        },
      ],
    };
  },
  computed: {
    current() {
      return this.options.find(o => o.id === this.selected) || null;
    },
  },
  methods: {
    reset() { this.selected = null; this.copied = false; },
    copy() {
      navigator.clipboard.writeText(this.current.snippet).then(() => {
        this.copied = true;
        setTimeout(() => { this.copied = false; }, 1500);
      });
    },
  },
};
</script>

<style scoped>
.agent-wizard { border: 1px solid #eaecef; border-radius: 6px; padding: 1rem 1.25rem; margin: 1.5rem 0; }
.agent-wizard__prompt { font-weight: 600; margin: 0 0 0.75rem; }
.agent-wizard__choice,
.agent-wizard__copy,
.agent-wizard__back {
  cursor: pointer; border: 1px solid #3eaf7c; background: #fff; color: #3eaf7c;
  border-radius: 4px; padding: 0.4rem 0.8rem; margin: 0 0.5rem 0.5rem 0; font-size: 0.9rem;
}
.agent-wizard__choice:hover,
.agent-wizard__copy:hover { background: #3eaf7c; color: #fff; }
.agent-wizard__back { border-color: #ccc; color: #666; }
.agent-wizard__snippet { background: #f6f6f6; padding: 0.75rem; border-radius: 4px; overflow-x: auto; }
.agent-wizard__note { font-size: 0.85rem; color: #666; }
</style>
```

- [ ] **Step 2: Verify wizard snippets match Task 3 verified commands**

Run: `grep -c "handsontable/handsontable-skills" docs/.vuepress/components/CodingAgentWizard.vue`
Expected: `>= 2` (Claude Code marketplace + Other/API reference). Confirm NO command absent from the published skill README appears.

- [ ] **Step 3: Commit**

```bash
git add docs/.vuepress/components/CodingAgentWizard.vue
git commit -m "feat(docs): add interactive coding-agent setup wizard"
```

---

## Task 5: C5 — `llms.txt` + `robots.txt`

**Files:**
- Create: `docs/.vuepress/public/llms.txt`
- Modify: `docs/.vuepress/public/robots.txt`

Files in `docs/.vuepress/public/` are copied verbatim to the dist root (under base `/docs/`). So `llms.txt` lands at `/docs/llms.txt`.

- [ ] **Step 1: Create `llms.txt`**

Create `docs/.vuepress/public/llms.txt`:

```
# HyperFormula

> HyperFormula is an open-source, high-performance calculation engine for spreadsheets and web applications.

## Docs

- Guide: https://hyperformula.handsontable.com/docs/guide/
- API reference: https://hyperformula.handsontable.com/docs/api/
- Full corpus: https://hyperformula.handsontable.com/docs/llms-full.txt
- Official Claude skill: https://github.com/handsontable/handsontable-skills
```

- [ ] **Step 2: Append corpus pointer to `robots.txt`**

Current `docs/.vuepress/public/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://hyperformula.handsontable.com/sitemap.xml
```

Add at the end:

```
# AI/LLM agent index
# Full documentation corpus: https://hyperformula.handsontable.com/docs/llms-full.txt
```

- [ ] **Step 3: Verify files**

Run: `cat docs/.vuepress/public/llms.txt && echo "---" && tail -3 docs/.vuepress/public/robots.txt`
Expected: both show the corpus URL `.../docs/llms-full.txt`.

- [ ] **Step 4: Commit**

```bash
git add docs/.vuepress/public/llms.txt docs/.vuepress/public/robots.txt
git commit -m "docs: add llms.txt and link llms-full.txt from robots.txt"
```

---

## Task 6: Integration — wire into `config.js` and verify build

**Files:**
- Modify: `docs/.vuepress/config.js` (require plugin, register in `plugins`, add `globalUIComponents`, add sidebar entry)

Runs AFTER Tasks 1–5 are merged.

- [ ] **Step 1: Require the plugin at top of `config.js`**

Add after the existing `includeCodeSnippet` require (around line 7):

```js
const mdCompanions = require('./plugins/md-companions');
```

- [ ] **Step 2: Register the plugin in the `plugins` array**

In the `plugins: [` array (after the sitemap entry), add:

```js
[mdCompanions, { hostname: DOCS_HOSTNAME }],
```

- [ ] **Step 3: Register the global button component**

Change line 34 from `globalUIComponents: [],` to:

```js
globalUIComponents: ['CopyMarkdownButton'],
```

- [ ] **Step 4: Add sidebar entry for the new page**

In `themeConfig.sidebar['/']`, inside the `Getting started` group's `children` array, add after the `license-key` entry:

```js
['/guide/setup-coding-agent', 'Set up your coding agent'],
```

- [ ] **Step 5: Run the full docs build**

Run: `npm run docs:build 2>&1 | tail -20`
Expected: build succeeds, "Generated static files in ...".

- [ ] **Step 6: Verify companion + corpus output exists**

Run:
```bash
ls docs/.vuepress/dist/docs/guide/basic-usage.md docs/.vuepress/dist/docs/llms-full.txt docs/.vuepress/dist/docs/llms.txt
echo "--- companion is clean markdown (no <script>, no :::) ---"
grep -c ":::" docs/.vuepress/dist/docs/guide/basic-usage.md || true
```
Expected: all three files exist; companion has no `:::` container fences.

- [ ] **Step 7: Verify the button URL resolves (no 404)**

Run:
```bash
# the page's .md companion must exist at the path the button computes
test -f docs/.vuepress/dist/docs/guide/setup-coding-agent.md && echo "button target OK"
```
Expected: `button target OK`.

- [ ] **Step 8: Lint**

Run: `npm run lint 2>&1 | tail -5`
Expected: exit 0 (config.js is the only linted file touched).

- [ ] **Step 9: Commit**

```bash
git add docs/.vuepress/config.js
git commit -m "feat(docs): wire md-companions plugin, Copy Markdown button, and setup page"
```

---

## Acceptance Criteria

- [ ] `.md` companion generated for every guide/api page under `dist/docs/`
- [ ] `llms-full.txt` aggregates all pages with absolute URLs (under `/docs/`)
- [ ] Copy Markdown button appears on content pages, hidden on homepage, copies correct `.md` URL
- [ ] `setup-coding-agent.md` reachable from sidebar; all install commands traceable to `handsontable/handsontable-skills` README — zero invented commands
- [ ] Interactive wizard renders, IDE selection shows verified snippet, copy works
- [ ] `llms.txt` + `robots.txt` point at `/docs/llms-full.txt`
- [ ] Code-fence-with-`:::` fixture test passes (no false stripping)
- [ ] Full `npm run docs:build` succeeds; `npm run lint` exit 0

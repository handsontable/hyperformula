# Documentation Standards

This document is written for both human authors and AI agents. All rules are stated explicitly so both roles can apply them without ambiguity.

Astro Starlight-based documentation site. **Requires Node 20** (separate from core's runtime requirements).

---

## 1. Documentation Architecture (Diátaxis)

Every page belongs to exactly one of four content types from the [Diátaxis framework](https://diataxis.fr/). Mixing types on a single page creates confusion. When content doesn't fit one type, split it into two pages.

### The four content types

| Type | Serves | User's question | HyperFormula example |
|---|---|---|---|
| **Tutorial** | Learning | "Teach me to do X" | "Build a discount calculator with HyperFormula" |
| **How-to guide** | Goals | "How do I accomplish X?" | "How to localize function names" |
| **Reference** | Information | "What are the options for X?" | "Configuration options" |
| **Explanation** | Understanding | "Why does X work this way?" | "Understanding the dependency graph" |

### Decision tree

Use this to pick the right type for a new page:

1. Is the reader a beginner who needs guided instruction? → **Tutorial**
2. Does the reader already know the basics and needs to accomplish a specific task? → **How-to guide**
3. Is the reader looking up a specific fact, option, or API signature? → **Reference**
4. Is the page answering "why?" or explaining a concept, design, or trade-off? → **Explanation**
5. Does the content fit two or more types? → Split into separate pages.

### Folder-to-type mapping

| Folder / page pattern | Expected type |
|---|---|
| `guide/client-side-installation`, `guide/server-side-installation`, `guide/basic-usage`, `guide/advanced-usage` | How-to |
| `guide/integration-with-*`, `guide/mcp-server` | How-to |
| `guide/key-concepts`, `guide/dependency-graph`, `guide/volatile-functions`, `guide/order-of-precendece` | Explanation |
| `guide/configuration-options`, `guide/built-in-functions`, `guide/types-of-values`, `guide/types-of-errors`, `guide/types-of-operators`, `guide/specifications-and-limits` | Reference |
| `guide/migration-from-*` | How-to |
| `guide/release-notes`, `guide/known-limitations`, `guide/list-of-differences`, `guide/supported-browsers` | Reference |
| `guide/compatibility-with-microsoft-excel`, `guide/compatibility-with-google-sheets` | Reference |
| `guide/branding`, `guide/code-of-conduct`, `guide/contributing`, `guide/licensing`, `guide/license-key`, `guide/quality`, `guide/support`, `guide/contact`, `guide/dependencies` | Reference |
| `api/` | Reference (auto-generated from TypeDoc) |

### Required frontmatter field

Every page **must** declare its Diátaxis type in frontmatter:

```yaml
type: tutorial | how-to | reference | explanation
```

This field is in addition to the other required frontmatter fields (see [§6 Frontmatter Schema](#6-frontmatter-schema)).

---

## 2. Voice and Style

### Person, tense, and voice

- **Second person**: "you", not "we" or "the user".
- **Present tense**: "the engine evaluates", not "the engine will evaluate".
- **Active voice**: "Call `setCellContents()`", not "`setCellContents()` should be called".
- **Direct imperative for instructions**: "Call `setCellContents()`", not "You should call `setCellContents()`".

### Words to avoid

| Avoid | Use instead |
|---|---|
| simply, just, easy, straightforward | (omit -- state the fact directly) |
| note that, please | (omit -- restructure as a callout or sentence) |
| allows you to | "lets you" or rephrase actively |
| in order to | "to" |
| utilize | "use" |

### Sentence length

- Instructions: max ~25 words per sentence.
- One idea per sentence.
- Separate compound sentences at conjunctions.

### Technical terms

- Define on first use in the page: "A *named expression* -- a label that resolves to a formula or value -- can be used in place of a cell reference."
- On subsequent uses, link to the reference page once per page section.
- Use code formatting for all API names, option keys, file paths, and code values.

### Formatting conventions

- Hyphens (`-`) or double hyphens (`--`) to separate clauses. No en dashes or em dashes.
- Straight quotes (`"` and `'`) only. No curly/smart quotes.
- Bold for UI elements: **Save**, **Add sheet**.
- Inline code for API names: `buildFromArray()`, `setCellContents()`, `licenseKey`.
- Oxford comma in lists of three or more items.
- American English spelling.

---

## 3. Page Structure Templates

Use the appropriate template for each Diátaxis type. Do not omit required sections.

### Tutorial template

```markdown
---
type: tutorial
id: <8-char alphanum>
title: <Verb phrase -- Build/Create/Set up X>
metaTitle: <title> | HyperFormula
description: <1-2 sentences summarizing outcome and who benefits>
permalink: /<slug>
tags: [keyword1, keyword2]
category: <nav category>
---

In this tutorial, you will [concrete outcome]. You will learn [skill or concept].

## Before you begin

- [prerequisite 1]
- [prerequisite 2]

## Step 1 -- [Action phrase]

[Instruction text. Keep to ~3-5 sentences. Show one code block.]

## Step 2 -- [Action phrase]

...

## What you learned

- [learning point 1]
- [learning point 2]

## Next steps

- [link to related how-to or reference]
- [link to deeper topic]
```

### How-to guide template

```markdown
---
type: how-to
id: <8-char alphanum>
title: How to [specific goal]
metaTitle: How to [specific goal] | HyperFormula
description: <1-2 sentences: what this achieves and when to use it>
permalink: /<slug>
tags: [keyword1, keyword2]
category: <nav category>
---

[One sentence: what this accomplishes and when to use it.]

## Prerequisites

- [prerequisite 1]

## Steps

1. [First action]

   [Explanation and code block]

2. [Second action]

   [Explanation and code block]

## Result

[Describe what the reader now has. One or two sentences.]

## Related

- [link to related reference]
- [link to related how-to]
```

### Reference template

```markdown
---
type: reference
id: <8-char alphanum>
title: [Feature / option / API name]
metaTitle: [Feature / option / API name] | HyperFormula
description: <1-2 sentences describing what this is>
permalink: /<slug>
tags: [keyword1, keyword2]
category: <nav category>
---

[One sentence describing what this is and what it does.]

## Syntax / Signature

```typescript
// function/option signature
```

## Parameters / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | `'value'` | What this controls. |

## Returns

[Return type and description, if applicable.]

## Examples

[Minimal, runnable code example with language tag.]

## Related

- [link to how-to for this feature]
- [link to related reference]
```

### Explanation template

```markdown
---
type: explanation
id: <8-char alphanum>
title: Understanding [concept]
metaTitle: Understanding [concept] | HyperFormula
description: <1-2 sentences: why this concept matters and who should read this>
permalink: /<slug>
tags: [keyword1, keyword2]
category: <nav category>
---

[Why this concept matters and when it is relevant. 2-3 sentences.]

## Background

[Historical or architectural context.]

## How it works

[Mechanism, flow, or design explanation.]

## Trade-offs

[What you gain and what you give up. When to choose differently.]

## Related

- [link to how-to that applies this concept]
- [link to reference for this feature]
```

---

## 4. Example Data Standards

### Never use

The following placeholder values are banned from all published documentation:

`A1`, `A2`, `A3`, `foo`, `bar`, `baz`, `test`, `Column1`, `Column2`, `Item1`, `value1`, `xxx`, `sample`, `dummy`, `placeholder`, `name1`, `name2`, `data1`, `data2`

Cell coordinates (`A1`, `B2`) are still acceptable when discussing cell-reference syntax itself -- but never as stand-in data values.

### Always use domain-realistic data

Each example must use data from a coherent, plausible real-world domain. Pick one domain per example and stay consistent throughout.

**Approved example domains:**

| Domain | Example data |
|---|---|
| **Financial modeling** | NPV / IRR / DCF inputs, fiscal quarters (Q1 2026), currencies (USD, EUR), cash flows ($4.2M, -$1.1M) |
| **Pricing & quotes** | Line-item totals, discount tiers (10%, 15%, 20%), tax brackets, unit prices ($24.99, $199.00) |
| **HR / payroll** | Employee names (diverse: Ana García, James Okafor, Li Wei), hours worked, salaries, commissions, hire dates (2024-03-14) |
| **Inventory** | Product SKUs (SKU-4821), supplier names (Harbor Goods, Alpine Supply Co.), stock quantities (142, 0, 67), reorder points, COGS |
| **Analytics / KPIs** | Campaign names (Spring Sale 2026), conversion rates (3.4%, 8.1%), weighted scores, channels (Email, Paid Search, Organic) |
| **Project budgets** | Task hours, milestone dates (2026-06-30), assignees, status counts (In progress, Blocked), cost rollups |

### Data coherence rules

- All rows in an example use the same domain.
- Values must be plausible: no negative ages, no revenue of $1, no dates in 1900.
- The dataset should make the demonstrated feature meaningful. A `SUMIF` example must use data where conditional summing is useful. An array-formula example must use data where the array dimension is visible.
- Use at least five rows in table examples so the feature behavior is visible.

---

## 5. Code Example Standards

### Language tags

All code blocks **must** include a language tag:

````markdown
```javascript
```typescript
```html
```css
```shell
```json
```yaml
````

Untagged code blocks (```` ``` ````) are not allowed.

### Example quality rules

- Examples must be self-contained and runnable (or clearly labeled as a snippet).
- Use `const` and `let`. Never use `var`.
- Use the supported builders -- `HyperFormula.buildFromArray()`, `HyperFormula.buildFromSheets()`, or `HyperFormula.buildEmpty()` -- not the raw constructor.
- Every code example that constructs a HyperFormula instance must include a `licenseKey:` option. Use `'gpl-v3'` for all guide examples -- this is the open-source license key documented at [`guide/license-key`](/guide/license-key). The placeholder proprietary form (`'xxxx-xxxx-xxxx-xxxx-xxxx'`) appears only on the license-key page itself.
- No inline `// TODO` or `// ...` comments in published examples.
- Keep examples between 25 and 60 lines. If longer, link to a sandbox (CodeSandbox, StackBlitz) instead.
- TypeScript is the primary language for new examples. The JavaScript variant should match it line-for-line.
- Each HyperFormula example should follow the input → formula → output pattern: build the engine with realistic data, evaluate a formula, then show the returned value (via `getCellValue()` or equivalent).

### Example embedding

The site uses VuePress-style example containers preprocessed by `src/plugins/vuepress-preprocessor.mjs`. A live example references files in `docs/examples/`:

```markdown
::: example #example1
@[code](@/docs/examples/category/feature/example1.html)
@[code](@/docs/examples/category/feature/example1.css)
@[code](@/docs/examples/category/feature/example1.js)
:::
```

The runner renders an interactive preview followed by a collapsible **Source code** block.

---

## 6. Frontmatter Schema

Required fields for all pages:

```yaml
---
type: tutorial | how-to | reference | explanation   # Diátaxis type (required)
id: abc12345                              # 8 random alphanumeric chars -- NEVER change existing IDs
title: Feature name                       # Matches H1; do NOT add H1 in body (Starlight renders title once)
metaTitle: Feature name | HyperFormula
description: Short SEO description (1-2 sentences)
permalink: /feature-name
tags: [keyword1, keyword2]                # Optional; lowercase kebab-case
category: Feature group                   # Sidebar grouping label
menuTag: new                              # Optional; sidebar badge ("new", "updated", "deprecated")
canonicalUrl: /feature-name               # Optional; override Starlight's auto-generated canonical
---
```

**Rules:**

- Never change an existing `id:` value. IDs are permanent and used for cross-version redirects if HyperFormula adopts versioned docs.
- For new pages, generate 8 random lowercase alphanumeric characters (e.g. `q63yhvq5`).
- `title:` is the only H1. Do not add `# Title` in the Markdown body.
- `description:` is used in SEO meta and link previews -- make it specific and accurate (avoid generic phrases like "HyperFormula documentation").
- `tags:` must be lowercase kebab-case.
- `metaTitle:` uses the suffix ` | HyperFormula` (note the space-pipe-space).

---

## 7. Links and Paths

Use clean, site-root-relative URLs (including the `/docs` base prefix) for internal links:

```markdown
[link text](/docs/guide/page-slug#anchor)
[link text](/docs/api/classes/hyperformula#buildfromarray)
```

Rules:

- Always include the `/docs` base prefix in internal links -- Starlight does not add it when authoring inline.
- Do not use relative paths (`../`) for internal links.
- Do not use absolute URLs (`https://hyperformula.handsontable.com/docs/...`) for internal links -- they break in dev and PR preview builds.
- External links use full `https://` URLs.

---

## 8. Asides and Inline Components

Use Starlight's native aside syntax for callouts (no leading space after the colons):

| Syntax | Renders as | Use for |
|---|---|---|
| `:::tip[Title]` | Blue tip aside | Helpful info, recommendations |
| `:::caution[Title]` | Yellow caution aside | Things that can go wrong |
| `:::danger[Title]` | Red danger aside | Data loss, security, irreversible actions |
| `:::note[Title]` | Neutral note aside | Side notes, parenthetical context |

Close every aside with a bare `:::` on its own line. The `[Title]` portion is optional; without it, Starlight uses a default heading derived from the type.

For collapsible content, use the HTML `<details>` element:

```markdown
<details>
<summary>Title</summary>

Long supplementary content here.

</details>
```

For live interactive HyperFormula examples, use the established HTML pattern (see [§5](#5-code-example-standards) for example file conventions). The runner in [`src/scripts/example-runner.ts`](./src/scripts/example-runner.ts) hydrates any element with `data-example-js` and loads the referenced JS module:

```html
<div class="hf-example not-content">
  <style>
    /* example-specific CSS (optional) */
  </style>
  <div class="hf-example__preview" data-example-js="/examples/<category>/<feature>/example1.js">
    <!-- the DOM the example mounts into -->
  </div>
</div>
```

Copy an existing live-example block as the starting template for new ones -- the `hf-example` / `hf-example__preview` class names are required for theme styling and runner discovery.

---

## 9. Trademark Notices

HyperFormula documents Excel-compatible and Google Sheets-compatible behavior on several pages. Each such page must include a trademark callout at the bottom:

**Excel-only pages** (`guide/compatibility-with-microsoft-excel`, `guide/migration-from-*` where Excel is referenced):

```markdown
::: tip Trademark notice
Microsoft® and Excel® are registered trademarks of Microsoft Corporation.
:::
```

**Google-Sheets-only pages** (`guide/compatibility-with-google-sheets`):

```markdown
::: tip Trademark notice
Google Sheets™ is a trademark of Google LLC.
:::
```

**Pages mentioning both** (`guide/list-of-differences`):

```markdown
::: tip Trademark notice
Microsoft® and Excel® are registered trademarks of Microsoft Corporation. Google Sheets™ is a trademark of Google LLC.
:::
```

---

## 10. Sidebar Registration

Register new pages in `src/sidebar.mjs`. A page not registered there will not appear in navigation.

Each top-level group has shape:

```javascript
{
  label: 'Group name',
  items: [
    { label: 'Page title', link: '/guide/page-slug' },
    ...
  ],
}
```

`link:` values are site-root relative -- Starlight prepends the configured `base` (`/docs`) automatically.

The API Reference group is auto-generated from the `api/` content directory; do not edit it manually.

---

## 11. Content Sources

### Guides, homepage, 404

Guide pages, the homepage (`index.md`), and the 404 (`404.md`) are authored directly in `docs/src/content/docs/` and tracked in git. They use Starlight-native markdown -- no preprocessing runs on them at request or build time.

### API reference

The API reference under `docs/src/content/docs/api/` is auto-generated from TypeDoc against the HyperFormula source. It is the only content path that still passes through the VuePress preprocessor (run by `scripts/generate-content.mjs`) because TypeDoc emits links and badge tokens that need normalizing. To update the API reference:

1. Edit the relevant TSDoc / JSDoc comment in the HyperFormula library source (the `src/` at the repo root, not under `docs/`).
2. From the repo root, regenerate the API content:
   ```bash
   npm run typedoc:build-api
   ```
3. Re-run `npm run dev` (or `npm run build`) inside `docs/`.

Do not edit the generated `.md` files under `docs/src/content/docs/api/` by hand -- they are overwritten on every build.

### Example files

Live examples referenced from page HTML live in `docs/examples/<category>/<feature>/`. Each folder contains `example1.{html,css,js,ts}` files. The runner in [`src/scripts/example-runner.ts`](./src/scripts/example-runner.ts) loads the `.js` module at request time; the `.html` / `.css` files exist as the single source of truth for the inline DOM and styles you paste into the guide page.

---

## 12. Checklist Before Submitting a Docs PR

Copy and complete this checklist in your PR description:

```markdown
## Docs PR checklist

- [ ] `type:` field added to frontmatter (tutorial | how-to | reference | explanation)
- [ ] Page uses the correct Diátaxis template for its type
- [ ] Title matches Diátaxis naming convention for its type
  - Tutorial: verb phrase ("Build X", "Create X")
  - How-to: starts with "How to ..."
  - Reference: feature, option, or API name
  - Explanation: starts with "Understanding ..."
- [ ] Intro paragraph states: what, for whom, and what outcome the reader gains
- [ ] No banned placeholder data (foo, bar, A1 as a value, Column1, etc.)
- [ ] All example data is domain-realistic and internally consistent
- [ ] All code blocks have language tags (```javascript, ```typescript, etc.)
- [ ] No `var` in code examples; uses `const` / `let`
- [ ] All HyperFormula instances are created via `buildFromArray` / `buildFromSheets` / `buildEmpty` with a `licenseKey:` option
- [ ] Heading hierarchy is correct (no skipped levels, e.g., H2 → H4)
- [ ] Active voice and second person ("you") used throughout
- [ ] No banned words: simply, just, easy, straightforward, note that, please
- [ ] Tutorials and how-tos have a Prerequisites section
- [ ] Tutorials have "What you learned" and "Next steps" sections
- [ ] How-tos have a "Result" section
- [ ] New page registered in `src/sidebar.mjs`
- [ ] `id:` field uses 8 random alphanumeric chars (existing IDs are unchanged)
- [ ] Trademark notice added on Excel or Google Sheets pages
- [ ] `metaTitle:` uses the ` | HyperFormula` suffix
- [ ] Asides use Starlight syntax (`:::tip[Title]`), not legacy VuePress `::: tip Title`
- [ ] Internal links include the `/docs` base prefix
```

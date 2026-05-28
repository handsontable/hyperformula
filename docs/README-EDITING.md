# Documentation editing guidelines

This page covers practical, hands-on guidelines for editing the [HyperFormula documentation](https://hyperformula.handsontable.com/). It complements the higher-level rules in [CLAUDE.md](./CLAUDE.md) -- read that first.

## Maintenance rules

When adding new documentation files, check the documentation [directory structure](./README.md#directory-structure), and follow the guidelines below.

### Filenames

- Use only lower-case characters.
- Separate words with hyphens (`-`).
- Use the `.md` file extension.
- Match the slug used in [`src/sidebar.mjs`](./src/sidebar.mjs).

### Frontmatter

Every page declares its metadata in YAML frontmatter at the top of the file.

| Tag | Meaning | Default value |
|---|---|---|
| `type` | The page's Diátaxis type: `tutorial`, `how-to`, `reference`, or `explanation`. | Required (see [CLAUDE.md §1](./CLAUDE.md#1-documentation-architecture-diataxis)). |
| `id` | The page's unique 8-character alphanumeric ID. Used for cross-version redirects if HyperFormula adopts versioned docs. Don't change existing IDs. For new pages, generate 8 random lowercase alphanumeric characters (e.g. via [random.org](https://www.random.org/strings/?num=20&len=8&digits=on&loweralpha=on&unique=on&format=html&rnd=new)). | Required for new pages. |
| `title` | The page's H1. Starlight renders this as the page title -- do not also add `# Title` in the body. | Required. |
| `metaTitle` | The page's `<title>` element. Use the suffix ` \| HyperFormula`. | Optional (Starlight auto-generates if absent). |
| `description` | The page's SEO meta description and social-card preview text (1-2 sentences). | Strongly recommended. |
| `permalink` | The page's unique URL. | Optional; Starlight derives the URL from the file path if absent. |
| `canonicalUrl` | Canonical URL override (rarely needed). | None. |
| `category` | Sidebar group label for organizing pages. | None. |
| `menuTag` | Optional sidebar badge: `new`, `updated`, `deprecated`. | None. |
| `tags` | Optional search tags. Use lowercase kebab-case. | None. |

#### Frontmatter example

```yaml
---
type: how-to
id: q63yhvq5
title: How to localize function names
metaTitle: How to localize function names | HyperFormula
description: Translate HyperFormula's built-in function names into any of 17 supported languages, or define your own translations.
permalink: /localizing-functions
category: Internationalization
tags: [i18n, localization, languages]
---
```

## Editing the documentation

### Editing guide pages

Guide pages, the homepage, and the 404 are authored directly in `src/content/docs/*.md` using Starlight-native markdown. There is no preprocessing step for these files -- what you write is what Astro renders. Add new pages to [`src/sidebar.mjs`](./src/sidebar.mjs) so they appear in the navigation tree.

To preview changes locally, run `npm run dev` from the `docs/` directory and browse to [http://localhost:4321/docs/](http://localhost:4321/docs/). Astro's content collection cache is sticky -- after editing `.md` files, restart with `npm run dev -- --force` to invalidate it.

### Editing the API reference

The API reference under `src/content/docs/api/` is auto-generated from TSDoc / JSDoc comments in the HyperFormula source code. To update it:

1. Edit the relevant TSDoc / JSDoc comment in `src/` (the HyperFormula library code, not under `docs/`).
2. From the repository root, regenerate the API content:
   ```bash
   npm run typedoc:build-api
   ```
3. Re-run `npm run docs:dev` (or `npm run dev` inside `docs/`) to see the updated reference.

Do **not** edit the generated `.md` files under `src/content/docs/api/` by hand -- changes are overwritten on every build.

## Reviewing the documentation

When reviewing someone else's changes:

- **Locally:** check out the branch, run `npm run dev` from `docs/`, and browse to [http://localhost:4321/docs/](http://localhost:4321/docs/).
- **Netlify deploy preview:** Netlify builds a per-PR preview and posts the URL on the PR. See [README-DEPLOYMENT.md](./README-DEPLOYMENT.md) for deploy-context details.

## Markdown links

Use clean, site-root-relative URLs that include the `/docs` base prefix:

```markdown
[Basic usage](/docs/guide/basic-usage)
[buildFromArray](/docs/api/classes/hyperformula#buildfromarray)
```

Starlight does **not** add the `/docs` prefix automatically when authoring inline -- you must include it in the link.

### Rules

- Always include the `/docs` base prefix.
- Don't use relative paths (`../guide/...`).
- Don't use absolute URLs (`https://hyperformula.handsontable.com/docs/...`) for internal links -- they break in dev and PR preview builds.
- External links use full `https://` URLs.

## Asides and inline components

Use Starlight's native aside syntax for callouts -- there is no preprocessing layer for guide pages, so VuePress-style `::: tip` (with a space) does not work.

| Syntax | Renders as | Use for |
|---|---|---|
| `:::tip[Title]` | Starlight tip (blue) | Helpful info, recommendations |
| `:::caution[Title]` | Starlight caution (yellow) | Things that can go wrong |
| `:::danger[Title]` | Starlight danger (red) | Data loss, security, irreversible actions |
| `:::note[Title]` | Starlight note (neutral) | Side notes, parenthetical context |

Close every aside with a bare `:::` on its own line. The `[Title]` portion is optional; without it, Starlight uses a default heading derived from the type.

### Aside examples

```markdown
:::tip[Quick win]
The `buildFromArray()` method is the fastest way to get started with sample data.
:::

:::caution[Performance]
Volatile functions re-evaluate on every recalculation. Use them sparingly.
:::

:::danger[Data loss]
Calling `destroy()` releases all internal state. Save results before destroying the instance.
:::
```

### Collapsible content

Starlight does not have a dedicated container for accordions -- use the HTML `<details>` element directly:

```markdown
<details>
<summary>See the full options list</summary>

Long supplementary content here.

</details>
```

## Adding interactive code examples

The live runner in [`src/scripts/example-runner.ts`](./src/scripts/example-runner.ts) hydrates any element with `data-example-js` and loads the referenced JavaScript module from the site root. Author live examples as inline HTML inside guide pages:

```html
<div class="hf-example not-content">
  <style>
    /* example-specific CSS (optional, inline) */
  </style>
  <div class="hf-example__preview" data-example-js="/examples/basic-usage/example1.js">
    <!-- the DOM the example mounts into -->
    <div class="example">
      <button id="calculate">Calculate</button>
      <div id="output"></div>
    </div>
  </div>
</div>

<details class="hf-example__source">
<summary>Source code</summary>

```javascript
import { HyperFormula } from 'hyperformula';

const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });
// ...
```

</details>
```

The `hf-example` / `hf-example__preview` class names are required -- the runner discovers mount points via the `data-example-js` attribute, and the theme styling targets those classes.

### File layout

Each example lives in its own folder under `docs/examples/<category>/<feature>/`:

```bash
docs/examples/basic-usage/
├── example1.html       # Reference HTML — copy this into the page inline
├── example1.css        # Reference CSS — copy this into the page <style> block (optional)
├── example1.js         # The runnable JavaScript module loaded by the runner
└── example1.ts         # Optional TypeScript source for the JS file
```

The runner only fetches the `.js` file (via the `data-example-js` URL). The `.html` / `.css` files are not loaded at runtime -- they exist as a single source of truth for the inline DOM and styles you paste into the guide page HTML.

### Tip: copy an existing example

The fastest way to add a new live example is to copy the `<div class="hf-example not-content">...</div>` block from an adjacent guide page and adapt it.

### Line highlighting in fenced code blocks

For static code blocks (not interactive examples), use Expressive Code's `{n}` metadata to highlight lines:

````markdown
```javascript {3,5-7}
import { HyperFormula } from 'hyperformula';

const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });
hf.setCellContents({ sheet: 0, row: 0, col: 0 }, [['=SUM(1, 2)']]);

const value = hf.getCellValue({ sheet: 0, row: 0, col: 0 });
console.log(value);
hf.destroy();
```
````

This renders lines 3, 5, 6, and 7 with a highlight background.

## Sidebar registration

A new page only appears in the navigation if it's listed in [`src/sidebar.mjs`](./src/sidebar.mjs). Find the appropriate group and add an entry:

```javascript
{
  label: 'Internationalization',
  items: [
    { label: 'Internationalization features', link: '/guide/i18n-features' },
    { label: 'Localizing functions', link: '/guide/localizing-functions' },
    { label: 'Date and time handling', link: '/guide/date-and-time-handling' },
    { label: 'Your new page', link: '/guide/your-new-page' },   // ← add here
  ],
},
```

`link:` values are site-root relative; Starlight prepends the configured `base` (`/docs`) automatically.

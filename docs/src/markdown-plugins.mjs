/**
 * Markdown plugins for the pages, run by Astro's Sätteri processor before Starlight's own.
 *
 * - `{{ $page.<name> }}` values and the engine's build-time constants are filled in.
 * - Links and images keep working under the `/docs/hyperformula/` base: a link to a page's Markdown source
 *   (`basic-usage.md`, `/guide/basic-usage.md`, `../api/README.md`) becomes the URL of the page built from it, and a
 *   root-relative URL (`/hf_logo.png`) gets the base.
 * - `:::example{#id}` blocks become live examples: the HTML, CSS and compiled JS they include render on the page,
 *   and the TypeScript opens in StackBlitz.
 * - A heading whose VuePress anchor differs from its new one keeps the old anchor too (`legacyAnchorsPlugin`).
 */
import { readFileSync } from 'node:fs';
import { posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import GithubSlugger from 'github-slugger';
import { substituteBuildConstants, substituteDocsData } from './docs-data.mjs';
import { pageId } from './page-id.mjs';

const DOCS_ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const REPO_ROOT = resolve(DOCS_ROOT, '..');

/**
 * @param {string} base The site base, with the leading and trailing slash.
 * @returns {object} The Sätteri mdast plugin.
 */
export function docsMarkdownPlugin(base) {
  return {
    name: 'hyperformula-docs',

    text(node, ctx) {
      const value = substituteBuildConstants(substituteDocsData(node.value));

      if (value !== node.value) {
        ctx.setProperty(node, 'value', value);
      }
    },

    inlineCode(node, ctx) {
      const value = substituteDocsData(node.value);

      if (value !== node.value) {
        ctx.setProperty(node, 'value', value);
      }
    },

    link(node, ctx) {
      const url = resolveUrl(node.url, ctx.fileURL, base);

      if (url !== node.url) {
        ctx.setProperty(node, 'url', url);
      }
    },

    image(node, ctx) {
      const url = resolveUrl(node.url, ctx.fileURL, base);

      if (url !== node.url) {
        ctx.setProperty(node, 'url', url);
      }
    },

    // A table written as HTML gets the same scrolling wrapper as a Markdown one (see `tableWrapperPlugin`).
    html(node, ctx) {
      if (/^\s*<table[\s>]/.test(node.value)) {
        ctx.setProperty(node, 'value', `<div class="table-container">${node.value}</div>`);
      }
    },

    containerDirective(node, ctx) {
      if (node.name !== 'example') {
        return;
      }

      ctx.replaceNode(node, { type: 'html', value: renderExample(node, ctx) });
    },
  };
}

/**
 * @param {string} url The URL as the page writes it.
 * @param {URL | undefined} fileURL The page's source file.
 * @param {string} base The site base.
 * @returns {string} The URL the built page should use.
 */
function resolveUrl(url, fileURL, base) {
  url = substituteDocsData(url);

  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//') || url.startsWith('#') || url.startsWith('@/')) {
    return url;
  }

  const [, path, suffix] = url.match(/^([^?#]*)(.*)$/);

  if (path.endsWith('.md') && fileURL) {
    const sourceDir = posix.dirname(relative(DOCS_ROOT, fileURLToPath(fileURL)).split('\\').join('/'));
    const target = path.startsWith('/') ? path.slice(1) : posix.join(sourceDir, path);
    const id = pageId(target);

    return `${base}${id === 'index' ? '' : `${id}.html`}${suffix}`;
  }

  if (path.startsWith('/')) {
    return `${base}${path.slice(1)}${suffix}`;
  }

  return url;
}

/** Removes the markers that only matter to the code generator and StackBlitz. */
const previewCode = (code) => code
  .replace(/\/\*(\s+)?(start|end):skip-in-preview(\s+)?\*\/\r?\n/gm, '')
  .replace(/\/\*(\s+)?(start|end):skip-in-sandbox(\s+)?\*\/\r?\n/gm, '')
  .replace(/\/\*(\s+)?start:skip-in-compilation(\s+)?\*\/\r?\n.*?\/\*(\s+)?end:skip-in-compilation(\s+)?\*\/\r?\n/gms, '')
  .replace(/\/\* end-file \*\//gm, '');

/** Keeps what StackBlitz needs (the imports), drops what only the page needs. */
const sandboxCode = (code) => code
  .replace(/\/\*(\s+)?start:skip-in-sandbox(\s+)?\*\/\r?\n.*?\/\*(\s+)?end:skip-in-sandbox(\s+)?\*\/\r?\n/gms, '')
  .replace(/\/\*(\s+)?(start|end):skip-in-preview(\s+)?\*\/\r?\n/gm, '')
  .replace(/\/\*(\s+)?(start|end):skip-in-compilation(\s+)?\*\/\r?\n/gm, '');

const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Renders an example from the files its `@[code](@/docs/examples/...)` lines name.
 *
 * @param {object} node The `example` container directive.
 * @param {object} ctx The visitor context.
 * @returns {string} The example's HTML.
 */
function renderExample(node, ctx) {
  const id = node.attributes?.id || 'example1';
  const files = {};

  collectLinks(node).forEach((url) => {
    const file = resolve(REPO_ROOT, url.replace(/^@\//, ''));

    files[file.split('.').pop()] = readFileSync(file, 'utf8');
  });

  for (const ext of ['html', 'css', 'js', 'ts']) {
    if (!(ext in files)) {
      throw new Error(`${ctx.fileURL}: the example #${id} includes no .${ext} file.`);
    }
  }

  const sandboxFiles = {
    'package.json': JSON.stringify({ name: 'hyperformula-demo', version: '1.0.0', main: 'index.html', dependencies: { hyperformula: 'latest', moment: 'latest' } }, null, 2),
    'index.html': `<!DOCTYPE html>\n<html>\n  <head>\n    <meta charset="utf-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>HyperFormula demo</title>\n  </head>\n\n  <body>\n    ${files.html}\n  </body>\n</html>`,
    'styles.css': files.css,
    'index.ts': `import './styles.css'\n${sandboxCode(files.ts)}`,
  };

  // The script runs in a block of its own, so two examples on one page cannot clash over a top-level name.
  return `<div class="hf-example not-content" id="${escapeHtml(id)}">
<style>${files.css}</style>
<div class="hf-example__preview">${files.html}</div>
<script>{
${previewCode(files.js)}
}</script>
<form class="hf-example__stackblitz" action="https://stackblitz.com/run" method="post" target="_blank">
${Object.entries(sandboxFiles).map(([name, content]) => `<textarea hidden name="project[files][${name}]" readonly>${escapeHtml(content)}</textarea>`).join('\n')}
<input type="hidden" name="project[title]" value="hyperformula-demo">
<input type="hidden" name="project[dependencies]" value="${escapeHtml(JSON.stringify({ hyperformula: 'latest', moment: 'latest' }))}">
<input type="hidden" name="project[template]" value="typescript">
<button type="submit">Open in StackBlitz</button>
</form>
</div>`;
}

/**
 * @param {object} node An mdast node.
 * @returns {string[]} The URLs of the links under it that name a repository file (`@/...`).
 */
function collectLinks(node) {
  if (node.type === 'link' && node.url.startsWith('@/')) {
    return [node.url];
  }

  return (node.children || []).flatMap(collectLinks);
}

/**
 * Wraps every table in `<div class="table-container">`, which the site's table styles (copied from the Handsontable
 * docs, `src/styles/components/tables.css`) scroll horizontally on narrow screens.
 */
export const tableWrapperPlugin = {
  name: 'hyperformula-docs-table-wrapper',
  element: {
    filter: ['table'],
    visit(node, ctx) {
      ctx.wrapNode(node, { type: 'element', tagName: 'div', properties: { className: ['table-container'] }, children: [] });
    },
  },
};

const HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

/**
 * The heading id the VuePress site gave a heading: `slugify` from `@vuepress/shared-utils` 1.9.
 * @param {string} text The heading text.
 * @returns {string} The id, before numbering a repeat.
 */
function vuepressSlug(text) {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’–—<>,.?/]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase();
}

/**
 * Keeps the VuePress heading anchors working. Headings get their ids from `github-slugger` now, which turns
 * `## 3.5.0` into `#350` where VuePress made `#_3-5-0`; deep links into the docs from elsewhere use the old form.
 * A heading whose old id differs from its new one gets an empty `<span id="<old id>">` as its first child, so the
 * old link scrolls to the same heading.
 *
 * Runs before Astro's heading-ids plugin, so it works out the new ids the same way: one slugger per page, over the
 * same heading text, in page order. The spans go in once every heading is seen, and an old id that is some other
 * heading's new id is left out: the new links win.
 * @param {{ data: { astro?: { frontmatter?: { title?: string } } } }} factory What Sätteri tells a plugin factory.
 * @returns {object} The Sätteri hast plugin.
 */
export function legacyAnchorsPlugin({ data }) {
  const slugger = new GithubSlugger();
  const newIds = new Set();
  const legacy = [];
  // markdown-it-anchor 5, which VuePress used, numbered a repeated id from 2 (`#added`, `#added-2`), and counted the
  // `# Title` heading the pages began with, which is the frontmatter title now.
  const oldCounts = new Map();
  const oldId = (text) => {
    const slug = vuepressSlug(text);
    const count = (oldCounts.get(slug) ?? 0) + 1;
    oldCounts.set(slug, count);
    return count > 1 ? `${slug}-${count}` : slug;
  };
  const title = data.astro?.frontmatter?.title;
  if (title) oldId(title);

  return {
    name: 'hyperformula-docs-legacy-anchors',
    element: {
      filter: HEADINGS,
      visit(node, ctx) {
        const text = ctx.textContent(node);
        const id = typeof node.properties?.id === 'string' ? node.properties.id : slugger.slug(text);
        newIds.add(id);
        legacy.push({ node, id: oldId(text) });
      },
    },
    after(root, ctx) {
      for (const { node, id } of legacy) {
        if (id && !newIds.has(id)) {
          ctx.prependChild(node, { type: 'element', tagName: 'span', properties: { id }, children: [] });
        }
      }
    },
  };
}

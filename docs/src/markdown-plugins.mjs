/**
 * Markdown plugins for the pages, run by Astro's Sätteri processor before Starlight's own.
 *
 * - `{{ $page.<name> }}` values and the engine's build-time constants are filled in.
 * - Links and images keep working under the `/docs/hyperformula/` base: a link to a page's Markdown source
 *   (`basic-usage.md`, `/guide/basic-usage.md`, `../api/README.md`) becomes the URL of the page built from it, and a
 *   root-relative URL (`/hf_logo.png`) gets the base.
 * - `:::example{#id}` blocks become live examples: the HTML, CSS and compiled JS they include render on the page, and
 *   a "Source code" toggle under each one shows its files. A preview build writes the internal test license key into
 *   the script each example runs, once the pages are written (`preview-license-key.mjs`).
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

      ctx.replaceNode(node, renderExample(node, ctx));
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

/**
 * The lines only the page needs, kept in a comment so the example files stay valid modules:
 * `/* start:skip-in-source` ... `end:skip-in-source *\/`. They stand in for imports, which the page cannot run.
 */
const SKIP_IN_SOURCE = /\/\*\s*start:skip-in-source\r?\n(.*?)end:skip-in-source\s*\*\/\r?\n/gs;

/**
 * The script the page runs. The engine is the CDN build's global `HyperFormula`, so the imports between the
 * `skip-in-compilation` markers go, and the lines in the `skip-in-source` comment take their place.
 */
const previewCode = (code) => code
  .replace(/\/\*(\s+)?(start|end):skip-in-preview(\s+)?\*\/\r?\n/gm, '')
  .replace(SKIP_IN_SOURCE, '$1')
  .replace(/\/\*(\s+)?start:skip-in-compilation(\s+)?\*\/\r?\n.*?\/\*(\s+)?end:skip-in-compilation(\s+)?\*\/\r?\n/gms, '')
  .replace(/\/\* end-file \*\//gm, '');

/**
 * The code the "Source code" toggle shows: the example as a reader would write it, with its imports, without the
 * `skip-in-source` comment and without any marker.
 */
const sourceCode = (code) => code
  .replace(new RegExp(`${SKIP_IN_SOURCE.source}(\\r?\\n)?`, 'gs'), '')
  .replace(/\/\*(\s+)?(start|end):skip-in-preview(\s+)?\*\/\r?\n/gm, '')
  .replace(/\/\*(\s+)?(start|end):skip-in-compilation(\s+)?\*\/\r?\n/gm, '')
  .replace(/\/\* end-file \*\//gm, '')
  .trimEnd();

const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The files an example shows, in the order of the Handsontable docs: the scripts, then the markup and the styles. */
const SOURCE_FILES = [
  { ext: 'js', lang: 'js', label: 'JavaScript', script: true },
  { ext: 'ts', lang: 'ts', label: 'TypeScript', script: true },
  { ext: 'html', lang: 'html', label: 'HTML', script: false },
  { ext: 'css', lang: 'css', label: 'CSS', script: false },
];

// The icons of the Handsontable docs' example toolbar (`buildExampleHtml()` in `docs/src/plugins/framework-loader.mjs`).
const ICON_CODE = '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>';
const ICON_CHEVRON = '<svg class="hot-example-source-chevron" aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6l6 -6"/></svg>';
const ICON_GITHUB = '<svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';

/**
 * Renders an example from the files its `@[code](@/docs/examples/...)` lines name, with the markup and behavior of the
 * Handsontable docs' examples: the live preview, a toolbar with a "Source code" toggle and a "See on GitHub" link, and
 * the files as code blocks that Expressive Code highlights. `public/example-tabs.js` moves the code blocks, which follow
 * the example between two markers, into it as tabs, hidden until the toggle opens them.
 *
 * @param {object} node The `example` container directive.
 * @param {object} ctx The visitor context.
 * @returns {object[]} The mdast nodes that replace the directive.
 */
function renderExample(node, ctx) {
  const id = node.attributes?.id || 'example1';
  const files = {};
  let exampleDir = '';

  collectLinks(node).forEach((url) => {
    const path = url.replace(/^@\//, '');

    files[path.split('.').pop()] = readFileSync(resolve(REPO_ROOT, path), 'utf8');
    exampleDir = posix.dirname(path);
  });

  for (const { ext } of SOURCE_FILES) {
    if (!(ext in files)) {
      throw new Error(`${ctx.fileURL}: the example #${id} includes no .${ext} file.`);
    }
  }

  const scripts = SOURCE_FILES.filter((file) => file.script);
  const others = SOURCE_FILES.filter((file) => !file.script);
  const tabs = ['JavaScript', ...others.map((file) => file.label)];
  const githubUrl = `https://github.com/handsontable/hyperformula/tree/develop/${exampleDir}`;

  // The script runs in a block of its own, so two examples on one page cannot clash over a top-level name. The
  // `data-hf-example` attribute marks it as the script a preview build gives the license key (`preview-license-key.mjs`).
  // The code blocks show the source files, so they keep the placeholder key in every build.
  const example = `<div class="hot-example hf-example not-content" id="hot-example-${escapeHtml(id)}">
<style>${files.css}</style>
<div class="hot-example-preview">${files.html}</div>
<script data-hf-example>{
${previewCode(files.js)}
}</script>
<div class="hot-example-toolbar">
  <button class="hot-example-source-btn" type="button" aria-expanded="false" aria-controls="hot-code-${escapeHtml(id)}">
    ${ICON_CODE} Source code ${ICON_CHEVRON}
  </button>
  <div class="hot-example-actions">
    <a class="hot-example-github-btn" href="${escapeHtml(githubUrl)}" target="_blank" rel="noopener noreferrer" title="See on GitHub" aria-label="See on GitHub">
      ${ICON_GITHUB}
    </a>
  </div>
</div>
</div>`;
  const codeStart = `<div class="hot-example-code-start" data-example="${escapeHtml(id)}" data-tabs="${escapeHtml(tabs.join(','))}" data-script-langs="${escapeHtml(scripts.map((file) => file.label).join(','))}" data-script-count="${scripts.length}"></div>`;
  const codeBlocks = [...scripts, ...others].map(({ ext, lang, label }) => ({
    type: 'code',
    lang,
    meta: `title="${label}"`,
    value: ext === 'js' || ext === 'ts' ? sourceCode(files[ext]) : files[ext].trimEnd(),
  }));

  return [
    { type: 'html', value: example },
    { type: 'html', value: codeStart },
    ...codeBlocks,
    { type: 'html', value: '<div class="hot-example-code-end"></div>' },
  ];
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

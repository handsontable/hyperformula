/**
 * Markdown plugins for the pages, run by Astro's Sätteri processor before Starlight's own.
 *
 * - `{{ $page.<name> }}` values and the engine's build-time constants are filled in.
 * - Links and images keep working under the `/docs/hyperformula/` base: a link to a page's Markdown source
 *   (`basic-usage.md`, `/guide/basic-usage.md`, `../api/README.md`) becomes the URL of the page built from it, and a
 *   root-relative URL (`/hf_logo.png`) gets the base.
 * - `:::example{#id}` blocks become live examples: the HTML, CSS and compiled JS they include render on the page,
 *   and the TypeScript opens in StackBlitz.
 */
import { readFileSync } from 'node:fs';
import { posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
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

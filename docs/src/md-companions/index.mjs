import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { substituteDocsData } from '../docs-data.mjs';
import { PAGE_EXCLUDES, PAGE_SOURCES, pageId } from '../page-id.mjs';
import { stripSiteSyntax } from './strip.mjs';

const DOCS_ROOT = fileURLToPath(new URL('../..', import.meta.url));

/**
 * Rewrite root-relative Markdown links (`](/guide/…)`, `](/api/…)`) to include
 * the configured `base` (`/docs/hyperformula/`). The site's Markdown plugin rebases these for
 * the HTML pages, but the raw `.md` companions do not — so without this an agent
 * resolving them from the site origin lands outside `/docs/hyperformula/` and 404s. Protocol-relative
 * (`//…`), absolute (`http…`), anchor (`#…`) and relative links are untouched.
 * @param {string} md stripped markdown
 * @param {string} base configured base, e.g. '/docs/hyperformula/'
 * @returns {string}
 */
function rebaseRootLinks(md, base) {
  const prefix = (base || '/').replace(/\/$/, '');
  if (!prefix) return md;
  // Fence-aware: never touch link-shaped text inside fenced code blocks.
  const out = [];
  let inFence = false;
  let marker = '';
  for (const line of md.split('\n')) {
    const t = line.trim();
    const fm = t.match(/^(```+|~~~+)/);
    if (fm && (!inFence || (fm[1][0] === marker[0] && fm[1].length >= marker.length))) {
      if (!inFence) { inFence = true; marker = fm[1]; } else { inFence = false; }
      out.push(line);
      continue;
    }
    out.push(inFence ? line : line.replace(/(\]\()\/(?!\/)/g, `$1${prefix}/`));
  }
  return out.join('\n');
}

/**
 * Resolve every Markdown link in a page to an ABSOLUTE URL, relative to that
 * page's own URL. Needed only for `llms-full.txt`: it aggregates all pages into
 * one file at a single URL, so page-relative links (`](basic-usage.md)`,
 * `](../api/x.md)`) would otherwise resolve against the corpus URL and 404.
 * Per-page `.md` companions keep relative links (they resolve within the
 * companion tree). Fence-aware; leaves absolute/protocol/anchor links alone.
 * @param {string} md
 * @param {string} pageUrl absolute URL of the page this content came from
 * @returns {string}
 */
function absolutizeLinks(md, pageUrl) {
  const out = [];
  let inFence = false;
  let marker = '';
  for (const line of md.split('\n')) {
    const t = line.trim();
    const fm = t.match(/^(```+|~~~+)/);
    if (fm && (!inFence || (fm[1][0] === marker[0] && fm[1].length >= marker.length))) {
      if (!inFence) { inFence = true; marker = fm[1]; } else { inFence = false; }
      out.push(line);
      continue;
    }
    if (inFence) { out.push(line); continue; }
    out.push(line.replace(/\]\(([^)\s]+)\)/g, (m, target) => {
      if (/^(https?:|mailto:|#)/i.test(target) || target.startsWith('//')) return m;
      try { return `](${new URL(target, pageUrl).href})`; } catch (_) { return m; }
    }));
  }
  return out.join('\n');
}

/**
 * The Markdown sources of the pages, in the order the corpus lists them: the home page, the guides, the API reference.
 * @returns {string[]} paths relative to `docs/`, with forward slashes
 */
function pageSources() {
  // The same files as the content collection, so every page has a companion and nothing else gets one.
  return PAGE_SOURCES.flatMap(pattern => fs.globSync(pattern, { cwd: DOCS_ROOT, exclude: PAGE_EXCLUDES })
    .map(file => file.split(path.sep).join('/'))
    .sort());
}

/**
 * Splits a page source into its title and its body.
 * @param {string} source the page's Markdown source
 * @returns {{ title: string, body: string }}
 */
function readPage(source) {
  const [, frontmatter = '', body = source] = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) || [];
  const title = (frontmatter.match(/^title:\s*(.*)$/m) || [])[1] || '';

  return { title: title.startsWith('"') ? JSON.parse(title) : title, body };
}

/**
 * Astro integration: after the build, write a clean `.md` companion next to each
 * page (`guide/basic-usage.html` gets `guide/basic-usage.md`; a `README.md`
 * source gets `index.md`), plus an aggregate `llms-full.txt` and an `llms.txt` index.
 * @param {{ base: string, hostname: string }} options the site base and origin
 * @returns {import('astro').AstroIntegration}
 */
export function mdCompanions({ base, hostname }) {
  return {
    name: 'md-companions',
    hooks: {
      async 'astro:build:done'({ dir, logger }) {
        const outDir = fileURLToPath(dir);
        const corpus = [
          '# HyperFormula Documentation',
          '',
          '> Full documentation corpus for LLM consumption.',
          '> Each page below is also served as clean Markdown — append `.md` to a docs page URL.',
          '',
        ];
        // Index entries for `llms.txt`: one link per page, grouped by section.
        const index = { home: [], guide: [], api: [] };

        for (const source of pageSources()) {
          try {
            const { title, body } = readPage(fs.readFileSync(path.join(DOCS_ROOT, source), 'utf8'));
            const clean = rebaseRootLinks(stripSiteSyntax(`# ${title}\n\n${substituteDocsData(body)}`), base);
            const outFile = path.join(outDir, source.replace(/(^|\/)README\.md$/, '$1index.md'));
            await fs.promises.mkdir(path.dirname(outFile), { recursive: true });
            await fs.promises.writeFile(outFile, clean, 'utf8');

            const id = pageId(source);
            const url = hostname + base + (id === 'index' ? '' : `${id}.html`);
            // The per-page `.md` keeps relative links (resolve within the companion
            // tree); the aggregated corpus needs absolute links (single-file URL).
            corpus.push('---', '', `## ${title || id}`, '', `URL: ${url}`, '', absolutizeLinks(clean, url), '');

            const mdUrl = hostname + base + source.replace(/(^|\/)README\.md$/, '$1index.md');
            const section = id === 'index' ? 'home' : id.split('/')[0];
            (index[section] || index.guide).push(`- [${title || id}](${mdUrl})`);
          } catch (err) {
            logger.warn(`skipping ${source}: ${err.message}`);
          }
        }

        // Best-effort like the per-page writes: a corpus-write failure warns rather
        // than aborting the whole docs build.
        try {
          await fs.promises.writeFile(path.join(outDir, 'llms-full.txt'), corpus.join('\n'), 'utf8');
        } catch (err) {
          logger.warn(`failed to write llms-full.txt: ${err.message}`);
        }

        // `llms.txt` (https://llmstxt.org): a short index that agents read first. It lists every
        // page by title and links to its `.md` companion, so an agent can fetch only the pages it
        // needs instead of the whole `llms-full.txt` corpus.
        const llms = [
          '# HyperFormula',
          '',
          '> HyperFormula is a headless spreadsheet calculation engine for JavaScript and TypeScript.',
          '> It parses and evaluates Excel-compatible formulas, with no UI.',
          '',
          `Full documentation as a single Markdown file: ${hostname}${base}llms-full.txt`,
          '',
          ...index.home,
          '',
          '## AI and agent resources',
          '',
          '- [Docs MCP server](https://docs-assistant.handsontable.com/mcp): first-party MCP server (streamable HTTP) with search over the HyperFormula and Handsontable docs, API reference, release notes and GitHub issues',
          '- [AI Docs Assistant](https://handsontable.com/docs/javascript-data-grid/ai-docs-assistant/): answers questions about HyperFormula and Handsontable, with citations from the docs',
          `- [Set up your coding agent](${hostname}${base}guide/setup-coding-agent.md): skills, MCP and rules-file setup for Claude Code, Cursor, Copilot and other agents`,
          '- [Agent skills](https://github.com/handsontable/handsontable-skills): official Claude Code skills for HyperFormula and Handsontable',
          '',
          '## Guides',
          '',
          ...index.guide,
          '',
          '## API reference',
          '',
          ...index.api,
          '',
          '## Source and licensing',
          '',
          '- [GitHub repository](https://github.com/handsontable/hyperformula): source code, issues, releases',
          '- [npm package](https://www.npmjs.com/package/hyperformula): published package',
          `- [License key guide](${hostname}${base}guide/license-key.md): how to set a license key`,
          '- [Pricing](https://handsontable.com/pricing): commercial licenses',
          '- [Contact sales](https://handsontable.com/get-a-quote): quote for commercial use',
          '',
        ];
        try {
          await fs.promises.writeFile(path.join(outDir, 'llms.txt'), llms.join('\n'), 'utf8');
        } catch (err) {
          logger.warn(`failed to write llms.txt: ${err.message}`);
        }

        // The docs site is served under base `/docs/hyperformula/`, so its corpus
        // and index live at `/docs/hyperformula/llms-full.txt` and `/docs/hyperformula/llms.txt`.
        // The domain-root `/llms.txt` belongs to handsontable.com (it advertises more
        // than just the docs), so this integration deliberately does NOT write to the served root.
      },
    },
  };
}

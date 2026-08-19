const fs = require('fs');
const path = require('path');
const { stripVuePressSyntax } = require('./strip');

/**
 * Resolve the `{{ $page.* }}` interpolations that `extendPageData` injects
 * (config.js) against the page's own values, so the companion `.md` ships the
 * real value instead of the raw mustache. Only the known injected keys are
 * substituted; any other `{{ … }}` is left untouched.
 * @param {string} md raw page markdown
 * @param {object} page VuePress page object (carries the injected fields)
 * @returns {string}
 */
function resolvePageVars(md, page) {
  return md.replace(
    /\{\{\s*\$page\.(version|buildDate|buildDateURIEncoded|releaseDate|functionsCount)\s*\}\}/g,
    (m, key) => (page && page[key] != null ? String(page[key]) : m)
  );
}

/**
 * Rewrite root-relative Markdown links (`](/guide/…)`, `](/api/…)`) to include
 * the configured `base` (`/docs/`). VuePress rebases these for the HTML site,
 * but the raw `.md` companions do not — so without this an agent resolving them
 * from the site origin lands outside `/docs/` and 404s. Protocol-relative
 * (`//…`), absolute (`http…`), anchor (`#…`) and relative links are untouched.
 * @param {string} md stripped markdown
 * @param {string} base configured base, e.g. '/docs/'
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
    // Include `.html` pages AND clean-URL / section-index pages whose path ends
    // in `/` (home, directory landings) — otherwise they are silently absent
    // from the corpus. Skip the 404 page (never a useful companion).
    const pages = ctx.pages.filter(
      p => (/\.html$/.test(p.path) || p.path.endsWith('/')) && p.path !== '/404.html'
    );
    const corpus = [
      '# HyperFormula Documentation',
      '',
      '> Full documentation corpus for LLM consumption.',
      '> Each page below is also served as clean Markdown — append `.md` to a docs page URL.',
      '',
    ];

    for (const page of pages) {
      try {
        const resolved = resolvePageVars(page._strippedContent || '', page);
        const clean = rebaseRootLinks(stripVuePressSyntax(resolved), base);
        // `.html` → `<slug>.md`; directory URL (`/guide/`) → `<dir>/index.md`.
        const relPath = page.path.endsWith('/')
          ? `${page.path}index.md`
          : page.path.replace(/\.html$/, '.md');
        const outFile = path.join(ctx.outDir, relPath.replace(/^\//, ''));
        await fs.promises.mkdir(path.dirname(outFile), { recursive: true });
        await fs.promises.writeFile(outFile, clean, 'utf8');

        const url = hostname + base.replace(/\/$/, '') + page.path.replace(/\.html$/, '');
        // The per-page `.md` keeps relative links (resolve within the companion
        // tree); the aggregated corpus needs absolute links (single-file URL).
        corpus.push('---', '', `## ${page.title || page.path}`, '', `URL: ${url}`, '', absolutizeLinks(clean, url), '');
      } catch (err) {
        console.warn(`[md-companions] skipping ${page.path}: ${err.message}`);
      }
    }

    // Best-effort like the per-page writes: a corpus-write failure warns rather
    // than aborting the whole docs build.
    const corpusText = corpus.join('\n');
    try {
      await fs.promises.writeFile(path.join(ctx.outDir, 'llms-full.txt'), corpusText, 'utf8');
    } catch (err) {
      console.warn(`[md-companions] failed to write llms-full.txt: ${err.message}`);
    }

    // The docs site is served under base `/docs/`, so its corpus lives at
    // `/docs/llms-full.txt`. The domain-root `/llms.txt` is owned by the
    // website repo (it advertises more than just the docs), so this plugin
    // deliberately does NOT write to the served root — see the note in
    // netlify.toml.
  }
});

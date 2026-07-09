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
      '> Each page below is also served as clean Markdown — append `.md` to any docs URL.',
      '',
    ];

    for (const page of pages) {
      try {
        const clean = stripVuePressSyntax(page._strippedContent || '');
        // `.html` → `<slug>.md`; directory URL (`/guide/`) → `<dir>/index.md`.
        const relPath = page.path.endsWith('/')
          ? `${page.path}index.md`
          : page.path.replace(/\.html$/, '.md');
        const outFile = path.join(ctx.outDir, relPath.replace(/^\//, ''));
        await fs.promises.mkdir(path.dirname(outFile), { recursive: true });
        await fs.promises.writeFile(outFile, clean, 'utf8');

        const url = hostname + base.replace(/\/$/, '') + page.path.replace(/\.html$/, '');
        corpus.push('---', '', `## ${page.title || page.path}`, '', `URL: ${url}`, '', clean, '');
      } catch (err) {
        console.warn(`[md-companions] skipping ${page.path}: ${err.message}`);
      }
    }

    // Best-effort like the per-page writes: a corpus-write failure warns rather
    // than aborting the whole docs build.
    try {
      const llmsFull = path.join(ctx.outDir, 'llms-full.txt');
      await fs.promises.writeFile(llmsFull, corpus.join('\n'), 'utf8');
    } catch (err) {
      console.warn(`[md-companions] failed to write llms-full.txt: ${err.message}`);
    }
  }
});

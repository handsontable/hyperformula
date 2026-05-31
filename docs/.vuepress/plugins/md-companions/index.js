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
      `> Individual pages also available at ${hostname}${base}guide/<slug>.md`,
      '',
    ];

    for (const page of pages) {
      try {
        const clean = stripVuePressSyntax(page._strippedContent || '');
        const relPath = page.path.replace(/\.html$/, '.md');
        const outFile = path.join(ctx.outDir, relPath.replace(/^\//, ''));
        await fs.promises.mkdir(path.dirname(outFile), { recursive: true });
        await fs.promises.writeFile(outFile, clean, 'utf8');

        const url = hostname + base.replace(/\/$/, '') + page.path.replace(/\.html$/, '');
        corpus.push('---', '', `## ${page.title || page.path}`, '', `URL: ${url}`, '', clean, '');
      } catch (err) {
        console.warn(`[md-companions] skipping ${page.path}: ${err.message}`);
      }
    }

    const llmsFull = path.join(ctx.outDir, 'llms-full.txt');
    await fs.promises.writeFile(llmsFull, corpus.join('\n'), 'utf8');
  }
});

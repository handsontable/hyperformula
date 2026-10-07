/**
 * Post-build pass over the Markdown companions that `starlight-page-actions`
 * emits into `dist/` next to each rendered page: resolves the VuePress
 * `{{ $page.* }}` interpolations (functionsCount, languagesCount, …) that the
 * plugin copies through verbatim, so the companions state the same HF-282
 * auto-derived totals as the rendered HTML. Runs as the last step of
 * `npm run build` (see package.json).
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { substituteDocsData } from '../src/plugins/docs-data.mjs';

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');

/** @param {string} dir @returns {string[]} absolute paths of all .md files */
function walkMarkdown(dir) {
  const out = [];

  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);

    if (statSync(full).isDirectory()) out.push(...walkMarkdown(full));
    else if (entry.endsWith('.md')) out.push(full);
  }

  return out;
}

let changed = 0;

for (const file of walkMarkdown(dist)) {
  const raw = readFileSync(file, 'utf8');

  if (!raw.includes('{{ $page.')) continue;

  writeFileSync(file, substituteDocsData(raw));
  changed += 1;
}

// eslint-disable-next-line no-console
console.log(`[postprocess-md] resolved docs-data interpolations in ${changed} Markdown companion(s)`);

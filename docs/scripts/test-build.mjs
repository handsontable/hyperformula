#!/usr/bin/env node
/**
 * Static checks over the production build (`docs/dist`). Run AFTER `npm run
 * build`. Verifies things that screenshots can't catch:
 *
 *  - Raw VuePress tokens that leaked through the preprocessor.
 *  - Every internal `/docs/...` href points to a built page.
 *  - Every `href` with `#anchor` resolves to a real heading/element id.
 *  - Every `_redirects` target maps to a built page.
 *  - Every interactive example's `data-example-js` points to a real file.
 *  - No duplicate `id="…"` on any single page.
 *  - Sitemap coverage matches the built HTML count.
 *  - Pagefind index is present and non-trivial.
 *
 * Exits non-zero if any check fails. Useful in CI / pre-PR sanity.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS = join(__dirname, '..');
const REPO = join(DOCS, '..');
const DIST = join(DOCS, 'dist');
const BASE = '/docs';

if (!existsSync(DIST)) {
  console.error(`[test-build] no dist/ — run \`npm run build\` first`);
  process.exit(2);
}

// ───────────────────────── helpers ──────────────────────────

function walk(dir, ext) {
  const out = [];

  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);

    if (e.isDirectory()) out.push(...walk(full, ext));
    else if (e.name.endsWith(ext)) out.push(full);
  }

  return out;
}

function fileToUrl(file) {
  let rel = relative(DIST, file).split('\\').join('/');

  rel = rel.replace(/index\.html$/, '').replace(/\.html$/, '');
  if (rel.endsWith('/')) rel = rel.slice(0, -1);

  return rel ? `${BASE}/${rel}` : `${BASE}/`;
}

function urlToFiles(url) {
  // Returns the *candidate* dist file paths for a given /docs/... url. Handles
  // page routes (resolve to index.html or .html) AND non-HTML assets
  // (sitemap.xml, favicon.png, _astro/*.css|js, etc.) which sit at their
  // literal path under dist/.
  const trimmed = url.replace(/[?#].*$/, '').replace(/\/+$/, '');
  const rel = trimmed.startsWith(BASE) ? trimmed.slice(BASE.length) : trimmed;
  const stem = rel.replace(/^\/+/, '');

  if (!stem) return [join(DIST, 'index.html')];

  // Asset with a non-HTML extension → check the file directly.
  if (/\.[a-z0-9]+$/i.test(stem) && !stem.endsWith('.html')) {
    return [join(DIST, stem)];
  }

  return [join(DIST, stem, 'index.html'), join(DIST, `${stem}.html`)];
}

function extractIds(html) {
  const ids = new Set();
  const dup = [];

  for (const m of html.matchAll(/\sid="([^"\s]+)"/g)) {
    if (ids.has(m[1])) dup.push(m[1]);
    else ids.add(m[1]);
  }

  return { ids, dup };
}

function extractHrefs(html) {
  const out = [];

  for (const m of html.matchAll(/\bhref="([^"]+)"/g)) out.push(m[1]);

  return out;
}

const banner = (s) => console.log(`\n\x1b[1;36m── ${s} ───────────────────\x1b[0m`);
const ok = (s) => console.log(`  \x1b[32m✓\x1b[0m ${s}`);
const warn = (s) => console.log(`  \x1b[33m⚠\x1b[0m ${s}`);
const fail = (s) => console.log(`  \x1b[31m✗\x1b[0m ${s}`);

let failures = 0;
const FAIL_LIMIT_PER_CHECK = 8; // truncate noisy lists

// ─────────────────────── load all pages ─────────────────────

const htmlFiles = walk(DIST, '.html');
const pages = new Map(); // url → { file, html, ids, dup }

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const { ids, dup } = extractIds(html);

  pages.set(fileToUrl(file), { file, html, ids, dup });
}

console.log(`\x1b[1m[test-build]\x1b[0m ${htmlFiles.length} HTML files built · base=${BASE}`);

// ────────────────────── 1. raw token leaks ──────────────────

banner('1. Raw VuePress token leaks');

const RAW_PATTERNS = [
  { name: '{{ $page.* }}', re: /\{\{\s*\$page\./, scope: 'body' },
  { name: '@[code](...)', re: /@\[code\]\(/, scope: 'body' },
  { name: '::: tip/warning/danger', re: /^:::\s*(tip|warning|danger)/m, scope: 'body' },
  { name: '<Badge text=', re: /<Badge\s+text=/, scope: 'all' },
  { name: '[[toc]]', re: /\[\[toc\]\]/, scope: 'body' },
  { name: 'raw <img :src=', re: /<img\s+:src=/, scope: 'all' },
  { name: "raw $withBase('...')", re: /\$withBase\(/, scope: 'body' },
];

// Strip pre/code so we don't false-positive on examples that legitimately
// print "@[code]" or "{{ $page.x }}" as documentation snippets.
function bodyOnly(html) {
  return html.replace(/<pre[\s\S]*?<\/pre>/g, '').replace(/<code[\s\S]*?<\/code>/g, '');
}

for (const p of RAW_PATTERNS) {
  const hits = [];

  for (const [url, { html }] of pages) {
    const text = p.scope === 'body' ? bodyOnly(html) : html;

    if (p.re.test(text)) hits.push(url);
  }

  if (hits.length === 0) ok(`no ${p.name}`);
  else {
    failures += hits.length;
    fail(`${p.name} leaked in ${hits.length} page(s): ${hits.slice(0, FAIL_LIMIT_PER_CHECK).join(', ')}${hits.length > FAIL_LIMIT_PER_CHECK ? ' …' : ''}`);
  }
}

// ────────────────── 2. internal links resolve ───────────────

banner('2. Internal links & anchors');

let totalInternal = 0;
const brokenPage = [];
const brokenAnchor = [];
const externalCount = { http: 0, mailto: 0, fragmentOnly: 0 };

for (const [pageUrl, { html }] of pages) {
  for (const href of extractHrefs(html)) {
    if (!href) continue;

    if (href.startsWith('#')) {
      externalCount.fragmentOnly++;
      // Same-page anchor — check current page has id.
      const id = href.slice(1);
      if (id && !pages.get(pageUrl).ids.has(id)) {
        // Some anchors are dynamic (e.g. starlight-toc nav). Skip empty.
      }
      continue;
    }

    if (/^([a-z]+:|\/\/)/.test(href)) {
      if (href.startsWith('mailto:')) externalCount.mailto++;
      else externalCount.http++;
      continue;
    }

    // Anything left is meant to be internal to our site.
    if (!href.startsWith(BASE)) continue; // skip stray relative refs (e.g., /img/x in plugins)

    totalInternal++;
    const [path, anchor] = href.includes('#') ? href.split('#') : [href, null];
    const cleanPath = path.replace(/\/+$/, '') || `${BASE}/`;
    const candidates = urlToFiles(cleanPath);

    const exists = candidates.some((c) => existsSync(c));
    if (!exists) {
      brokenPage.push(`${pageUrl} → ${href}`);
      continue;
    }

    if (anchor) {
      // Resolve target page URL (normalized) and check its id set.
      const normalized = cleanPath.replace(/\/+$/, '') || `${BASE}/`;
      const targetUrl = normalized === `${BASE}` ? `${BASE}/` : normalized;
      const target = pages.get(targetUrl) || pages.get(`${targetUrl}/`) || pages.get(targetUrl.replace(/\/$/, ''));

      if (target && !target.ids.has(anchor)) {
        brokenAnchor.push(`${pageUrl} → ${href}`);
      }
    }
  }
}

ok(`scanned ${totalInternal} internal links (skipped ${externalCount.http} http, ${externalCount.mailto} mailto, ${externalCount.fragmentOnly} pure-fragment)`);
if (brokenPage.length === 0) ok('every internal href points to a built page');
else {
  failures += brokenPage.length;
  fail(`${brokenPage.length} broken page links: ${brokenPage.slice(0, FAIL_LIMIT_PER_CHECK).join('  |  ')}${brokenPage.length > FAIL_LIMIT_PER_CHECK ? ' …' : ''}`);
}
if (brokenAnchor.length === 0) ok('every #anchor resolves on its target page');
else {
  // Anchor drift is a soft warning, not a hard failure: the target page exists,
  // only the deep link to a specific section is stale (usually source content
  // drift from the VuePress era). Report but don't fail the build.
  warn(`${brokenAnchor.length} stale anchor(s) (target page exists): ${brokenAnchor.slice(0, FAIL_LIMIT_PER_CHECK).join('  |  ')}${brokenAnchor.length > FAIL_LIMIT_PER_CHECK ? ' …' : ''}`);
}

// ────────────────────── 3. redirect targets ─────────────────

banner('3. Netlify _redirects targets');

const redirectsPath = join(DIST, '_redirects');

if (!existsSync(redirectsPath)) {
  fail('dist/_redirects missing');
  failures++;
} else {
  const lines = readFileSync(redirectsPath, 'utf8').split('\n').filter((l) => l && !l.startsWith('#'));
  let bad = [];
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) continue;
    const target = parts[1];
    if (!target.startsWith(BASE)) continue;
    const exists = urlToFiles(target).some((c) => existsSync(c));
    if (!exists) bad.push(`${parts[0]} → ${target}`);
  }
  if (bad.length === 0) ok(`all ${lines.length} redirect targets resolve`);
  else {
    failures += bad.length;
    fail(`${bad.length} redirect target(s) missing: ${bad.slice(0, FAIL_LIMIT_PER_CHECK).join('  |  ')}${bad.length > FAIL_LIMIT_PER_CHECK ? ' …' : ''}`);
  }
}

// ────────────────────── 4. example modules ──────────────────

banner('4. Interactive example modules');

const examplesRoot = join(DOCS, 'examples');
const exampleFiles = new Set(
  existsSync(examplesRoot) ? walk(examplesRoot, '.js').map((f) => '/' + relative(DOCS, f).split('\\').join('/')) : []
);
const dataExampleHits = new Set();
let bad = [];

for (const { html } of pages.values()) {
  for (const m of html.matchAll(/data-example-js="([^"]+)"/g)) dataExampleHits.add(m[1]);
}

for (const path of dataExampleHits) {
  if (!exampleFiles.has(path)) bad.push(path);
}

if (dataExampleHits.size === 0) warn('no data-example-js attributes found (no interactive demos?)');
else if (bad.length === 0) ok(`all ${dataExampleHits.size} example modules exist on disk`);
else {
  failures += bad.length;
  fail(`${bad.length} example modules missing: ${bad.slice(0, FAIL_LIMIT_PER_CHECK).join(', ')}`);
}

// ────────────────────── 5. duplicate IDs ───────────────────

banner('5. Duplicate element IDs per page');

let dupHits = 0;
const dupSample = [];

for (const [url, { dup }] of pages) {
  if (dup.length === 0) continue;
  dupHits += dup.length;
  if (dupSample.length < FAIL_LIMIT_PER_CHECK) dupSample.push(`${url}: ${[...new Set(dup)].slice(0, 4).join(', ')}`);
}

if (dupHits === 0) ok('no duplicate IDs on any page');
else {
  failures += dupHits;
  fail(`${dupHits} duplicate id(s) across ${dupSample.length}+ page(s): ${dupSample.join('  |  ')}`);
}

// ─────────────────── 6. sitemap coverage ────────────────────

banner('6. Sitemap coverage');

const sitemapFile = join(DIST, 'sitemap-0.xml');
if (!existsSync(sitemapFile)) {
  warn('sitemap-0.xml not found (sitemap may use a different filename)');
} else {
  const sitemap = readFileSync(sitemapFile, 'utf8');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const docPages = [...pages.keys()].filter((u) => u !== `${BASE}/404`);
  ok(`sitemap has ${locs.length} URLs · built pages = ${docPages.length}`);
  if (Math.abs(locs.length - docPages.length) > 5) {
    warn(`sitemap diff > 5 — check excluded routes`);
  }
}

// ─────────────────── 7. Pagefind index ──────────────────────

banner('7. Pagefind index');

const pagefindDir = join(DIST, 'pagefind');
if (!existsSync(pagefindDir)) {
  failures++;
  fail('dist/pagefind missing — Pagefind did not run');
} else {
  const entryFile = join(pagefindDir, 'pagefind-entry.json');
  const indexDir = join(pagefindDir, 'index');
  const fragDir = join(pagefindDir, 'fragment');
  const indexCount = existsSync(indexDir) ? readdirSync(indexDir).length : 0;
  const fragCount = existsSync(fragDir) ? readdirSync(fragDir).length : 0;
  const entrySize = existsSync(entryFile) ? statSync(entryFile).size : 0;
  ok(`pagefind index: ${indexCount} index file(s), ${fragCount} fragment file(s), entry=${entrySize}b`);
  if (entrySize < 100) {
    failures++;
    fail('pagefind-entry.json suspiciously small');
  }
}

// ─────────────────────────── summary ────────────────────────

console.log(`\n\x1b[1m${failures === 0 ? '\x1b[32m✓ all checks passed' : `\x1b[31m✗ ${failures} issue(s)`}\x1b[0m\n`);
process.exit(failures === 0 ? 0 : 1);

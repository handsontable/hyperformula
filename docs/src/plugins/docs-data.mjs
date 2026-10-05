/**
 * Build-time HyperFormula metadata injected into docs content in place of the
 * VuePress `{{ $page.version }}`, `{{ $page.buildDate }}`, etc. template vars.
 *
 * Values come from two sources in priority order:
 *   1. The HyperFormula library's `package.json` (always available, source of
 *      truth for the version string).
 *   2. The built UMD bundle (`dist/hyperformula.full.js`) if present -- it
 *      contributes `buildDate`, `releaseDate`, and the registered-function
 *      count. The docs build runs after `bundle-all` so the bundle is present
 *      in CI/production; the bundle is optional for local dev.
 *
 * The library root is located by walking upward from this file and looking
 * for the `package.json` whose `name` field is `hyperformula`. This avoids
 * brittle `../../..` arithmetic that can drift in different build
 * environments (Astro's build cache layout differs slightly between local
 * dev and Netlify's build container).
 *
 * @module docs-data
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, readdirSync, existsSync } from 'fs';

const require = createRequire(import.meta.url);

/**
 * Walk up the directory tree from `startDir`, returning the first directory
 * whose `package.json` has `"name": <pkgName>`. Returns null if not found.
 *
 * @param {string} startDir
 * @param {string} pkgName
 * @returns {string | null}
 */
function findPackageRoot(startDir, pkgName) {
  let dir = startDir;

  while (true) {
    const pkgPath = join(dir, 'package.json');

    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

        if (pkg.name === pkgName) return dir;
      } catch {
        // ignore unreadable / malformed package.json and continue upward
      }
    }

    const parent = dirname(dir);

    if (parent === dir) return null;
    dir = parent;
  }
}

const libRoot = findPackageRoot(dirname(fileURLToPath(import.meta.url)), 'hyperformula');

/**
 * HF-282: count HF built-in languages from `src/i18n/languages` (source of truth): one module
 * per shipped language, next to the `index.ts` export barrel. Counted by listing the directory
 * rather than by matching `export {default as xxYY}` lines in the barrel, so the total cannot
 * depend on how those lines are punctuated. Listing the directory counts what is *present*, and
 * only the barrel decides what actually ships, so a module nobody re-exported would overstate
 * the total — cross-check by language code and fail loudly on the mismatch.
 *
 * The root README.md is rendered by GitHub and npm, not the docs build, so it cannot use the
 * `{{ $page.languagesCount }}` interpolation and states the count literally. Assert it against
 * the derived count so it cannot rot unnoticed (it already did once, when the Indonesian pack
 * (#1674) left the README saying 17). The claim under test is the one features bullet linking
 * to the i18n guide; fenced blocks are skipped so an example cannot shadow the real claim.
 *
 * These checks run at config load with no dist/ dependency, so they resolve identically in
 * `docs:dev` and `docs:build`, and they throw rather than fall back: a wrong published count
 * is worse than a failed build.
 *
 * @returns {number}
 */
function resolveLanguagesCount() {
  if (!libRoot) {
    throw new Error('HF-282: could not locate the hyperformula package root to derive languagesCount.');
  }

  const languagesDir = join(libRoot, 'src/i18n/languages');
  const languageCodes = readdirSync(languagesDir)
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.d.ts') && file !== 'index.ts')
    .map((file) => file.replace(/\.ts$/, ''));
  const languagesCount = languageCodes.length;

  if (!languagesCount) {
    throw new Error(`HF-282: derived languagesCount is 0 — no language modules found in ${languagesDir}; check the path in docs/src/plugins/docs-data.mjs.`);
  }

  const languagesBarrel = readFileSync(join(languagesDir, 'index.ts'), 'utf8');
  const unexportedLanguages = languageCodes.filter((code) => !new RegExp(`\\bdefault as ${code}\\b`).test(languagesBarrel));

  if (unexportedLanguages.length) {
    throw new Error(`HF-282: language modules present in src/i18n/languages/ but not re-exported from index.ts, so they do not ship and must not be counted: ${unexportedLanguages.join(', ')} — add them to the barrel, or remove the files.`);
  }

  const readmeLanguagesClaims = [];
  let inReadmeFence = false;

  for (const line of readFileSync(join(libRoot, 'README.md'), 'utf8').split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inReadmeFence = !inReadmeFence;
      continue;
    }
    if (inReadmeFence || !line.startsWith('- ') || !line.includes('guide/i18n-features')) {
      continue;
    }
    const match = line.match(/(\d+) built-in languages/);

    if (match) {
      readmeLanguagesClaims.push(match[1]);
    }
  }
  if (readmeLanguagesClaims.length !== 1) {
    throw new Error(`HF-282: expected exactly one README.md features bullet linking to the i18n guide and stating "<n> built-in languages", found ${readmeLanguagesClaims.length} — if the wording changed on purpose, update this check in docs/src/plugins/docs-data.mjs.`);
  }
  if (Number(readmeLanguagesClaims[0]) !== languagesCount) {
    throw new Error(`HF-282: README.md says ${readmeLanguagesClaims[0]} built-in languages but src/i18n/languages/ ships ${languagesCount} — update README.md.`);
  }

  return languagesCount;
}

/** @returns {{ version: string, buildDate: string, releaseDate: string, functionsCount: number }} */
function resolveDocsData() {
  const fallbackDate = new Date().toUTCString();

  if (!libRoot) {
    return { version: 'latest', buildDate: fallbackDate, releaseDate: fallbackDate, functionsCount: 400 };
  }

  let version = 'latest';

  try {
    version = JSON.parse(readFileSync(join(libRoot, 'package.json'), 'utf8')).version || 'latest';
  } catch {
    // ignore -- defaults to 'latest'
  }

  try {
    // The UMD root export is the HyperFormula class with static metadata.
    const HyperFormula = require(join(libRoot, 'dist/hyperformula.full.js'));

    return {
      version,
      buildDate: HyperFormula.buildDate || fallbackDate,
      releaseDate: HyperFormula.releaseDate || fallbackDate,
      // HF-282: derived from `getAvailableFunctions` on a default-config engine — the same API,
      // and the same engine options, as `script/generate-builtin-functions-doc.ts`, so the total
      // and the rows of the page it heads cannot describe different function sets. The GPLv3 key
      // only keeps the build quiet; see the LICENSE_KEY note in that script.
      functionsCount: HyperFormula
        .buildEmpty({ language: 'enGB', licenseKey: 'gpl-v3' })
        .getAvailableFunctions().length,
    };
  } catch {
    // Bundle not built yet (local dev). buildDate/releaseDate get the current
    // date as a placeholder; version is still accurate from package.json.
    return { version, buildDate: fallbackDate, releaseDate: fallbackDate, functionsCount: 400 };
  }
}

export const DOCS_DATA = { ...resolveDocsData(), languagesCount: resolveLanguagesCount() };

/**
 * Replaces the VuePress `{{ $page.<key> }}` interpolations with the values above.
 * Used by the `remark-docs-data` plugin (rendered pages) and by
 * `scripts/generate-content.mjs` (the Markdown build outputs), so both surfaces
 * show the same numbers.
 *
 * @param {string} text
 * @returns {string}
 */
export function substituteDocsData(text) {
  return text.replace(/\{\{ \$page\.(version|buildDate|releaseDate|functionsCount|languagesCount) \}\}/g,
    (whole, key) => (key in DOCS_DATA ? String(DOCS_DATA[key]) : whole));
}

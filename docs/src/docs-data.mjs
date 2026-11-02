/**
 * The values the pages interpolate as `{{ $page.<name> }}`, read once from the built engine and its sources.
 *
 * HF-282: the function and language totals are derived here so no page states a number that can go stale.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ENGINE_ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../hyperformula');
const HyperFormula = createRequire(import.meta.url)(join(ENGINE_ROOT, 'dist/hyperformula.full.js'));

/**
 * Counts the shipped languages: one module per language in `src/i18n/languages`, next to the `index.ts` barrel.
 * Listing the directory, rather than matching `export {default as xxYY}` lines, keeps the total independent of how
 * those lines are punctuated. Only the barrel decides what ships, so a module it does not re-export fails the build
 * instead of being counted.
 *
 * @returns {number} The number of built-in languages.
 */
function countLanguages() {
  const languagesDir = join(ENGINE_ROOT, 'src/i18n/languages');
  const codes = readdirSync(languagesDir)
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.d.ts') && file !== 'index.ts')
    .map((file) => basename(file, '.ts'));

  if (!codes.length) {
    throw new Error(`HF-282: no language modules found in ${languagesDir}; check the path in docs/src/docs-data.mjs.`);
  }

  const barrel = readFileSync(join(languagesDir, 'index.ts'), 'utf8');
  const unexported = codes.filter((code) => !new RegExp(`\\bdefault as ${code}\\b`).test(barrel));

  if (unexported.length) {
    throw new Error(`HF-282: language modules present in hyperformula/src/i18n/languages/ but not re-exported from index.ts, so they do not ship and must not be counted: ${unexported.join(', ')} — add them to the barrel, or remove the files.`);
  }

  return codes.length;
}

/**
 * The engine's README is rendered by GitHub and npm, so it states the language total literally. Asserts that
 * number, on the one features bullet linking to the i18n guide, so it cannot rot unnoticed. Fenced blocks are
 * skipped, so a number in an example is never mistaken for the claim. The function total needs no such check:
 * "over 400" stays true as functions are added.
 *
 * @param {number} languagesCount The derived language total.
 */
function assertReadmeLanguages(languagesCount) {
  const claims = [];
  let inFence = false;

  for (const line of readFileSync(join(ENGINE_ROOT, 'README.md'), 'utf8').split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }

    if (inFence || !line.startsWith('- ') || !line.includes('guide/i18n-features')) {
      continue;
    }

    const match = line.match(/(\d+) built-in languages/);

    if (match) {
      claims.push(match[1]);
    }
  }

  if (claims.length !== 1) {
    throw new Error(`HF-282: expected exactly one hyperformula/README.md features bullet linking to the i18n guide and stating "<n> built-in languages", found ${claims.length} — if the wording changed on purpose, update this check in docs/src/docs-data.mjs.`);
  }

  if (Number(claims[0]) !== languagesCount) {
    throw new Error(`HF-282: hyperformula/README.md says ${claims[0]} built-in languages but hyperformula/src/i18n/languages/ ships ${languagesCount} — update hyperformula/README.md.`);
  }
}

const languagesCount = countLanguages();

assertReadmeLanguages(languagesCount);

/**
 * The function total, from `getAvailableFunctions` on a default-config engine: the same call and options as
 * `docs/script/generate-builtin-functions-doc.ts`, so the total and the table it heads describe the same set.
 * The GPLv3 key only keeps the build quiet.
 */
const functionsCount = HyperFormula.buildEmpty({ language: 'enGB', licenseKey: 'gpl-v3' }).getAvailableFunctions().length;

/** @type {Record<string, string>} */
export const DOCS_DATA = {
  version: HyperFormula.version,
  buildDate: HyperFormula.buildDate,
  buildDateURIEncoded: encodeURIComponent(HyperFormula.buildDate),
  releaseDate: HyperFormula.releaseDate,
  functionsCount: String(functionsCount),
  languagesCount: String(languagesCount),
};

/**
 * Replaces every `{{ $page.<name> }}` naming a known value; anything else is left as written.
 *
 * @param {string} text Text to substitute in.
 * @returns {string} The text with the values filled in.
 */
export function substituteDocsData(text) {
  return text.replace(/\{\{\s*\$page\.(\w+)\s*\}\}/g, (match, key) => DOCS_DATA[key] ?? match);
}

/**
 * The API reference prints the engine's build-time constants as the source declares them. Shows their values.
 *
 * @param {string} text Text to substitute in.
 * @returns {string} The text with the constants filled in.
 */
export function substituteBuildConstants(text) {
  return text
    .replace(/process\.env\.HT_BUILD_DATE as string/g, `'${DOCS_DATA.buildDate}'`)
    .replace(/process\.env\.HT_VERSION as string/g, `'${DOCS_DATA.version}'`)
    .replace(/process\.env\.HT_RELEASE_DATE as string/g, `'${DOCS_DATA.releaseDate}'`);
}

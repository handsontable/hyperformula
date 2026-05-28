/**
 * Build-time HyperFormula metadata injected into docs content in place of the
 * VuePress `{{ $page.version }}`, `{{ $page.buildDate }}`, etc. template vars.
 *
 * Values are read from the built UMD bundle (`dist/hyperformula.full.js`) when
 * available — it exposes `version`, `buildDate`, `releaseDate` and the
 * registered-function list. The docs build always runs after `bundle-all`, so
 * the bundle is present in CI/production. For local dev without a build, we
 * fall back to the repo `package.json` version and the current date.
 *
 * @module docs-data
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

const require = createRequire(import.meta.url);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

/** @returns {{ version: string, buildDate: string, releaseDate: string, functionsCount: number }} */
function resolveDocsData() {
  try {
    // The UMD root export is the HyperFormula class with static metadata.
    const HyperFormula = require(resolve(repoRoot, 'dist/hyperformula.full.js'));

    return {
      version: HyperFormula.version,
      buildDate: HyperFormula.buildDate,
      releaseDate: HyperFormula.releaseDate,
      functionsCount: HyperFormula.getRegisteredFunctionNames('enGB').length,
    };
  } catch {
    // Fallback for local dev when the library bundle has not been built yet.
    let version = 'latest';

    try {
      version = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8')).version;
    } catch {
      /* ignore */
    }

    return {
      version,
      buildDate: new Date().toUTCString(),
      releaseDate: new Date().toUTCString(),
      functionsCount: 400,
    };
  }
}

export const DOCS_DATA = resolveDocsData();

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
import { readFileSync, existsSync } from 'fs';

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
      functionsCount: HyperFormula.getRegisteredFunctionNames?.('enGB')?.length ?? 400,
    };
  } catch {
    // Bundle not built yet (local dev). buildDate/releaseDate get the current
    // date as a placeholder; version is still accurate from package.json.
    return { version, buildDate: fallbackDate, releaseDate: fallbackDate, functionsCount: 400 };
  }
}

export const DOCS_DATA = resolveDocsData();

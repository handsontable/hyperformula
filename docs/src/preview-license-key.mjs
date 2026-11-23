/**
 * The internal test license key in preview builds of the docs.
 *
 * The live examples run the engine from the CDN and show the license key placeholder, so they run without a key.
 * On handsontable.com the engine skips the license check; on a preview URL it does not, and every example would
 * return `#LIC!`. A preview build therefore writes the internal test key into the script each example runs, never
 * into the code a page shows or the StackBlitz project, and a production build never gets it.
 *
 * Handsontable does the same in its own docs (`docs/src/plugins/preview-license-key.mjs`), on bundled example
 * modules. Here `renderExample()` (`markdown-plugins.mjs`) pastes each example into its page as an inline script, so
 * the key is written into the pages once they are built. Not while the Markdown is rendered: Astro caches rendered
 * Markdown between builds, so a preview build could reuse a page rendered without the key, and a production build
 * one rendered with it.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEST_LICENSE_KEY } from './test-license-key.mjs';

/**
 * The text every copy of the internal test key carries. The build check looks for it.
 */
export const TEST_KEY_MARKER = 'HYPERFORMULA INTERNAL TEST KEY';

/**
 * The branch Workers Builds deploys to production. A build of it never gets the key.
 */
const PRODUCTION_BRANCH = 'master';

/**
 * One placeholder line, with its trailing comment: `// licenseKey: 'your-license-key', // get a key at ...`, with
 * either quote.
 */
const PLACEHOLDER_LINE = /^([ \t]*)\/\/ ?licenseKey: ?(['"])your-license-key\2,?.*$/gm;

/**
 * Returns the key to inject, or `null`. The key is opt-in, as in Handsontable's docs: only a build or script run
 * with `DOCS_TEST_LICENSE_KEY=true` gets it, and a Workers Builds build of the production branch never does, even
 * with the opt-in set. Without the opt-in, a build is strict: the key anywhere in its output fails it.
 *
 * Workers Builds runs the same build command for every branch, so the opt-in is set by the preview deploy command
 * (`npm run preview:cf`, `script/inject-preview-license-key.mjs`), which writes the key into the built pages before
 * it uploads them. A local build can set it too; `npm run dev` can't, because the dev server never runs the injection (see `docs/README.md`).
 *
 * @param {NodeJS.ProcessEnv} env The environment.
 * @returns {string | null}
 */
export function resolvePreviewLicenseKey(env) {
  if (env.DOCS_TEST_LICENSE_KEY !== 'true' || env.WORKERS_CI_BRANCH === PRODUCTION_BRANCH) {
    return null;
  }

  return TEST_LICENSE_KEY;
}

/**
 * Replaces each license key placeholder line with a live option that holds the key. The line count stays.
 *
 * The key is written with `JSON.stringify()`: it holds double quotes.
 *
 * @param {string} code The example's script.
 * @param {string} key The license key.
 * @returns {{ code: string, replaced: number }} The script, and how many placeholders it replaced.
 */
export function injectLicenseKey(code, key) {
  let replaced = 0;
  const injected = code.replace(PLACEHOLDER_LINE, (match, indent) => {
    replaced += 1;

    return `${indent}licenseKey: ${JSON.stringify(key)},`;
  });

  return { code: injected, replaced };
}

/**
 * The script of a live example, with its opening and closing tags. `renderExample()` marks it with `data-hf-example`.
 * Only these scripts are matched: a page also holds `<script>` as text, for example in the code a copy button copies.
 */
const EXAMPLE_SCRIPT = /(<script data-hf-example(?:="")?>)([\s\S]*?)(<\/script>)/g;

/**
 * Writes the key into the live example scripts of every page under `distDir`. The code a page shows and the
 * StackBlitz project are outside them, so they keep the placeholder. Running it again on pages it already injected
 * changes nothing.
 *
 * @param {string} distDir The build output directory.
 * @param {string} key The license key.
 * @returns {number} How many placeholders it replaced.
 */
export function injectIntoPages(distDir, key) {
  let total = 0;

  listFiles(distDir).filter(path => extname(path) === '.html').forEach((path) => {
    let replacedInPage = 0;
    const html = readFileSync(path, 'utf8').replace(EXAMPLE_SCRIPT, (match, open, code, close) => {
      const { code: injected, replaced } = injectLicenseKey(code, key);

      // A script that already holds the key was injected by an earlier run, so running the injection again is harmless.
      if (replaced === 0 && /HyperFormula\.build/.test(code) && !code.includes(TEST_KEY_MARKER)) {
        throw new Error(`${relative(distDir, path)}: a live example builds an engine but has no license key `
          + 'placeholder, so the preview cannot give it the internal test key.');
      }

      replacedInPage += replaced;

      return `${open}${injected}${close}`;
    });

    if (replacedInPage > 0) {
      writeFileSync(path, html);
      total += replacedInPage;
    }
  });

  return total;
}

/**
 * The text files a build writes. Images and fonts are skipped.
 */
const TEXT_EXTENSIONS = new Set(['.html', '.md', '.txt', '.json', '.xml', '.js', '.mjs', '.css']);

/**
 * Lists the files under a directory.
 *
 * @param {string} dir An absolute directory path.
 * @returns {string[]} Absolute file paths.
 */
function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return listFiles(path);
    }

    return TEXT_EXTENSIONS.has(extname(entry.name)) ? [path] : [];
  });
}

/**
 * Fails when the key reached build output it must not reach, or missed the output it must reach.
 *
 * - A build that injected nothing must not hold the key anywhere: this is the check that keeps it out of production.
 * - A build that injected the key may hold it only inside the live example scripts of an HTML page. A page's
 *   visible code, its Markdown twin, and every other file must keep the placeholder.
 * - A build that injected the key must hold it somewhere. Otherwise the examples would show `#LIC!`.
 *
 * @param {string} distDir The build output directory.
 * @param {{ injected: boolean }} options Whether this build injected the key into the examples.
 */
export function checkKeyInOutput(distDir, { injected }) {
  const holding = listFiles(distDir).filter(path => readFileSync(path, 'utf8').includes(TEST_KEY_MARKER));
  const outsideScripts = holding.filter(path => !injected || extname(path) !== '.html'
    || readFileSync(path, 'utf8').replace(EXAMPLE_SCRIPT, '').includes(TEST_KEY_MARKER));

  if (outsideScripts.length > 0) {
    throw new Error('The internal test license key reached build output it must not reach: '
      + `${outsideScripts.map(path => relative(distDir, path)).join(', ')}. `
      + 'Only the example scripts of a preview build may hold it.');
  }

  if (injected && holding.length === 0) {
    throw new Error('This preview build injects the internal test license key, but no page holds it. '
      + 'The live examples would return #LIC!. Check renderExample() in src/markdown-plugins.mjs.');
  }
}

/**
 * Astro integration that, once the build is written, writes the key into the live examples of a preview build, then
 * checks where the key landed in any build. Register it last.
 *
 * @param {NodeJS.ProcessEnv} env The environment, read by {@link resolvePreviewLicenseKey}.
 * @returns {import('astro').AstroIntegration}
 */
export function previewLicenseKey(env) {
  const key = resolvePreviewLicenseKey(env);

  return {
    name: 'preview-license-key',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const distDir = fileURLToPath(dir);

        if (key !== null) {
          logger.info(`Wrote the internal test license key into ${injectIntoPages(distDir, key)} live examples.`);
        }

        checkKeyInOutput(distDir, { injected: key !== null });
      },
    },
  };
}

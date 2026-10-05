/**
 * Assembles the Cloudflare Workers static-asset directory (`cf-dist/`, see
 * `wrangler.jsonc`) from the Astro build output.
 *
 * Every document is served under the `/docs/` prefix (`astro.config.mjs`
 * `base`), but Astro writes the build to `docs/dist/` without that prefix in
 * the file paths. The Workers asset router resolves requests against literal
 * paths, so the build is copied to `cf-dist/docs/`, mirroring the URL space —
 * the same layout the VuePress build used.
 *
 * The `_headers` and `_redirects` configuration files must live at the root of
 * the asset directory, while the build emits them inside `dist/` (they come
 * from `docs/public/`); they are moved up here.
 */
const fs = require('fs');
const { join, resolve } = require('path');

const SOURCE_DIR = resolve(__dirname, '../docs/dist');
const TARGET_ROOT = resolve(__dirname, '../cf-dist');
const TARGET_DOCS = join(TARGET_ROOT, 'docs');
const CONFIG_FILES = ['_headers', '_redirects'];

if (!fs.existsSync(SOURCE_DIR)) {
  throw Error(`Missing documentation build output at ${SOURCE_DIR}. Run the documentation build first.`);
}

fs.rmSync(TARGET_ROOT, { recursive: true, force: true });
fs.mkdirSync(TARGET_ROOT, { recursive: true });
fs.cpSync(SOURCE_DIR, TARGET_DOCS, { recursive: true });

CONFIG_FILES.forEach((fileName) => {
  const nested = join(TARGET_DOCS, fileName);

  if (!fs.existsSync(nested)) {
    throw Error(`Missing ${fileName} in the build output. The docs build writes it from docs/public/.`);
  }

  fs.renameSync(nested, join(TARGET_ROOT, fileName));
  console.log(`Moved ${fileName} to ${TARGET_ROOT}`);
});

console.log(`Assembled ${TARGET_ROOT} from ${SOURCE_DIR}`);

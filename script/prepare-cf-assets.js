/**
 * Copies the Cloudflare Workers static-asset configuration files (`_headers`,
 * `_redirects`) into the root of the built documentation directory.
 *
 * These files must live at the root of the asset directory declared in
 * `wrangler.jsonc` (`docs/.vuepress/dist`), while VuePress writes its output to
 * `docs/.vuepress/dist/docs/hyperformula`. They therefore cannot be kept in
 * `docs/.vuepress/public` and are copied here instead.
 *
 * It also stops a deploy whose base path disagrees with what the Worker serves.
 * `worker/index.js` reads the base from `docs/.vuepress/build.config.js`, and
 * `_headers` and `_redirects` name it, so the build must use that base (not a
 * `DOCS_BASE` override) and put the documents under it.
 */
const fs = require('fs');
const { join, resolve } = require('path');
const buildConfig = require('../docs/.vuepress/build.config.js');

const CONFIG_FILES = ['_headers', '_redirects'];
const SOURCE_DIR = resolve(__dirname, '../docs/.vuepress/cf');
const TARGET_DIR = resolve(__dirname, '../docs/.vuepress/dist');
const BASE = buildConfig.base;

if (!fs.existsSync(TARGET_DIR)) {
  throw Error(`Missing documentation build output at ${TARGET_DIR}. Run the documentation build first.`);
}

const withSlashes = (base) => `/${base.replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/');

if (process.env.DOCS_BASE && withSlashes(process.env.DOCS_BASE) !== BASE) {
  throw Error(`DOCS_BASE (${process.env.DOCS_BASE}) differs from the base in docs/.vuepress/build.config.js (${BASE}), which worker/index.js serves. Change it there instead.`);
}

if (!fs.existsSync(join(TARGET_DIR, BASE, 'index.html'))) {
  throw Error(`No index.html under ${BASE} in ${TARGET_DIR}: the build output and the base in docs/.vuepress/build.config.js disagree.`);
}

CONFIG_FILES.forEach((fileName) => {
  const source = join(SOURCE_DIR, fileName);
  const target = join(TARGET_DIR, fileName);

  if (!fs.readFileSync(source, 'utf8').includes(BASE)) {
    throw Error(`${source} does not name the docs base ${BASE} (docs/.vuepress/build.config.js). Update it with the base.`);
  }

  fs.copyFileSync(source, target);
  console.log(`Copied ${fileName} to ${TARGET_DIR}`);
});

/**
 * Copies the Cloudflare Workers static-asset configuration files (`_headers`,
 * `_redirects`) into the root of the built documentation directory.
 *
 * These files must live at the root of the asset directory declared in
 * `wrangler.jsonc` (`docs/.vuepress/dist`), while VuePress writes its output to
 * `docs/.vuepress/dist/docs`. They therefore cannot be kept in
 * `docs/.vuepress/public` and are copied here instead.
 */
const fs = require('fs');
const { join, resolve } = require('path');

const CONFIG_FILES = ['_headers', '_redirects'];
const SOURCE_DIR = resolve(__dirname, '../docs/.vuepress/cf');
const TARGET_DIR = resolve(__dirname, '../docs/.vuepress/dist');

if (!fs.existsSync(TARGET_DIR)) {
  throw Error(`Missing documentation build output at ${TARGET_DIR}. Run the documentation build first.`);
}

CONFIG_FILES.forEach((fileName) => {
  const source = join(SOURCE_DIR, fileName);
  const target = join(TARGET_DIR, fileName);

  fs.copyFileSync(source, target);
  console.log(`Copied ${fileName} to ${TARGET_DIR}`);
});

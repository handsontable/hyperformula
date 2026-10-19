/**
 * Docs build configuration.
 * Override any of these via environment variables:
 *   DOCS_BASE      — public base path (must start and end with `/`)
 *   DOCS_DEST      — output directory (relative to the docs/ package root)
 *   DOCS_HOSTNAME  — absolute origin used for the sitemap
 */
module.exports = {
  // Served at https://handsontable.com/docs/hyperformula/: handsontable.com
  // proxies that path to this Worker unchanged, so every URL the build writes
  // (links, assets, sitemap, `.md` companions, llms-full.txt) carries the
  // full prefix.
  base: '/docs/hyperformula/',
  dest: '.vuepress/dist/docs/hyperformula',
  hostname: 'https://handsontable.com',
};

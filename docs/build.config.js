/**
 * Docs build configuration.
 * Override any of these via environment variables:
 *   DOCS_BASE      — public base path (must start and end with `/`)
 *   DOCS_DEST      — output directory (relative to the docs/ package root)
 *   DOCS_HOSTNAME  — absolute origin used for the sitemap
 *
 * `npm run build` ends with script/prepare-cf-assets.js, which fails on a
 * DOCS_BASE or DOCS_HOSTNAME that differs from these values, because the
 * Worker serves them as written here.
 */
module.exports = {
  // Served at https://handsontable.com/docs/hyperformula/: handsontable.com
  // proxies that path to this Worker unchanged, so every URL the build writes
  // (links, assets, sitemap, `.md` companions, llms-full.txt) carries the
  // full prefix.
  base: '/docs/hyperformula/',
  dest: 'dist/docs/hyperformula',
  hostname: 'https://handsontable.com',
};

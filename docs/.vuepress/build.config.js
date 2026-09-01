/**
 * Docs build configuration.
 * Override any of these via environment variables:
 *   DOCS_BASE      — public base path (must start and end with `/`)
 *   DOCS_DEST      — output directory (relative to the docs/ package root)
 *   DOCS_HOSTNAME  — absolute origin used for the sitemap
 */
module.exports = {
  base: '/docs/',
  dest: '.vuepress/dist/docs',
  hostname: 'https://hyperformula.handsontable.com',
};

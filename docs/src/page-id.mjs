/**
 * The id of the page built from a Markdown source, from its path relative to `docs/`: the path without `.md`, and a
 * `README` or `index` file names its directory (`api/README.md` is `api`). The home page is `index`.
 *
 * Kept free of slugification on purpose: a page's URL is its file name as written, dots included
 * (`guide/migration-from-2.x-to-3.0.html`), as it was before the move to Starlight.
 *
 * @param {string} path The source path relative to `docs/`, with forward slashes.
 * @returns {string} The page id.
 */
export function pageId(path) {
  return path.replace(/\.md$/, '').replace(/(^|\/)(README|index)$/, '') || 'index';
}

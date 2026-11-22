/**
 * The header tab a page belongs to. The header (`components/Header.astro`) marks that tab active and the sidebar
 * (`components/Sidebar.astro`) shows only its groups, so both read it from here.
 *
 * - `api`: the API reference overview (`api.html`) and every page under `api/`.
 * - `updates`: the release notes and the migration guides.
 * - `guides`: every other page.
 *
 * @param {string} pathname The page's URL path, e.g. `/docs/hyperformula/guide/basic-usage.html`.
 * @param {string} base The site base path, with a trailing slash.
 * @returns {'api' | 'updates' | 'guides'} The section.
 */
export function pageSection(pathname, base) {
  const path = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;

  if (/^api(\.html$|\/)/.test(path)) return 'api';
  if (/^guide\/(release-notes|migration-from-)/.test(path)) return 'updates';
  return 'guides';
}

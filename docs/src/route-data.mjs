/**
 * The API pages' section links (`page.html#section`, see `src/api-sidebar.mjs`):
 *
 * - Starlight appends `.html` to every sidebar link that doesn't end in it, after the `#section` too, so it's removed there.
 * - Previous/next links skip them: Starlight takes those from the sidebar, so they would point into the page being read.
 */
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { OVERVIEW_ATTR } from './api-sidebar.mjs';

/** The sidebar's page links in order; an API page's `Overview` link is named after its group. */
function pageLinks(entries, groupLabel) {
  return entries.flatMap((entry) => {
    if (entry.type === 'group') return pageLinks(entry.entries, entry.label);
    if (entry.href.includes('#')) {
      // Idempotent: Starlight reuses the sidebar entries across pages.
      entry.href = entry.href.replace(/(#[^#]*)\.html$/, '$1');
      return [];
    }
    return [OVERVIEW_ATTR in entry.attrs && groupLabel ? { ...entry, label: groupLabel } : entry];
  });
}

export const onRequest = defineRouteMiddleware(({ locals }) => {
  const { pagination, sidebar } = locals.starlightRoute;
  const links = pageLinks(sidebar);
  const current = links.findIndex((link) => link.isCurrent);
  if (current === -1) return;

  // Only links Starlight took from the sidebar; one set in frontmatter (`prev`/`next`) is kept as it is.
  const fromSidebar = (link) => link && !link.href.includes('#') && !(OVERVIEW_ATTR in (link.attrs ?? {}));
  if (pagination.prev && !fromSidebar(pagination.prev)) pagination.prev = links[current - 1];
  if (pagination.next && !fromSidebar(pagination.next)) pagination.next = links[current + 1];
});

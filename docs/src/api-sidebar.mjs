/**
 * Sidebar groups for the API reference pages: the page itself as `Overview`, then a link to each of its `##`
 * sections, as the VuePress sidebar showed them (`sidebarDepth: 1`). Read from the generated Markdown, so a new
 * TypeDoc section shows up on its own.
 */
import { existsSync, readFileSync } from 'node:fs';
import GithubSlugger from 'github-slugger';

/**
 * Marks the link that opens the page itself, labeled `Overview`: prev/next (`src/route-data.mjs`) and the mobile
 * breadcrumbs (`src/components/Header.astro`) use the page name instead.
 */
export const OVERVIEW_ATTR = 'data-page-overview';

/**
 * @param {string} label The page name, used as the group label.
 * @param {string} slug The page id, e.g. `api/classes/hyperformula`.
 * @returns {object} A Starlight sidebar group.
 */
export function apiPageGroup(label, slug) {
  const file = new URL(`../${slug}.md`, import.meta.url);
  // `docs:dev` and `docs:build` generate `api/` first; without it the group still links the page.
  const markdown = existsSync(file) ? readFileSync(file, 'utf8') : '';

  // Every heading goes through one slugger, in page order, as when the page builds: a repeated heading gets a
  // numbered id (`## Batch` is `#batch`, the `### batch` method after it `#batch-1`).
  const slugger = new GithubSlugger();
  const sections = [];
  let inFence = false;
  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const heading = !inFence && /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!heading) continue;
    const id = slugger.slug(heading[2]);
    // Starlight adds the base and, with `build.format: 'file'`, a second `.html` at the very end, after the `#id`;
    // `src/route-data.mjs` removes it.
    if (heading[1].length === 2) sections.push({ label: heading[2], link: `/${slug}.html#${id}` });
  }

  return { label, collapsed: true, items: [{ label: 'Overview', slug, attrs: { [OVERVIEW_ATTR]: '' } }, ...sections] };
}

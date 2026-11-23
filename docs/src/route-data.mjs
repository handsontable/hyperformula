/**
 * Per-page meta description:
 *
 * - A page's frontmatter `description` is used as is (Starlight puts it in the head).
 * - A page without one gets its first paragraph, instead of the site-wide description, so search
 *   engines and AI agents can tell the pages apart. On an API page, only the introduction above the
 *   first `##` heading counts: below it are signatures and member descriptions, not the page's topic.
 *
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

/**
 * The `{{ $page.* }}` values (`src/docs-data.mjs`), passed in by `astro.config.mjs`: this module is bundled, so it
 * can't import `docs-data.mjs`, which finds the engine relative to itself.
 */
const DOCS_DATA = import.meta.env.HF_DOCS_DATA ?? {};

/**
 * Fills in the `{{ $page.* }}` values, like `substituteDocsData` in `src/docs-data.mjs`; an unknown one is left as is.
 * @param {string} text
 * @returns {string}
 */
function substituteDocsData(text) {
  return text.replace(/\{\{\s*\$page\.(\w+)\s*\}\}/g, (match, key) => DOCS_DATA[key] ?? match);
}

/** The longest description kept; search engines cut longer ones. */
const MAX_DESCRIPTION = 160;

/**
 * The first prose paragraph of a page's Markdown body, as plain text, or `''` if there is none.
 * Skips headings, HTML, images, admonitions (`:::` blocks, with their content), code fences, tables, lists
 * and lines with an unresolved `{{ … }}` placeholder (the caller fills in the known ones first).
 * @param {string} body the page's Markdown, without frontmatter
 * @returns {string}
 */
export function firstParagraph(body = '') {
  let inFence = false;
  let inComment = false;
  let inAdmonition = false;
  const lines = [];
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (/^(```|~~~)/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    if (inComment) { if (line.includes('-->')) inComment = false; continue; }
    if (line.startsWith('<!--')) { if (!line.includes('-->')) inComment = true; continue; }
    // `:::tip` opens an admonition and a bare `:::` closes it.
    if (line.startsWith(':::')) { inAdmonition = line !== ':::'; continue; }
    if (inAdmonition) continue;
    const isProse = line && !/^(#|<|\||[-*+] |\d+\. |>|@\[|!\[)/.test(line) && !line.includes('{{');
    if (isProse) { lines.push(line); continue; }
    if (lines.length) break;
  }
  // Code spans are literal: set aside before the Markdown is stripped, put back (without backticks) at the end.
  // As in CommonMark, a span closes on a backtick run as long as its opening one, so ``a`b`` is the text a`b.
  const code = [];
  const text = lines.join(' ').replace(
    /(?<![\\`])(`+)(?!`)(.*?[^`])\1(?!`)/g,
    (_, fence, content) => `\uE000${code.push(content.replace(/^ (.*) $/, '$1')) - 1}\uE000`,
  );
  return text
    // Links and images: keep the text. The URL may hold balanced parentheses, e.g. `Function_(mathematics)`.
    .replace(/!?\[([^\]]*)\]\((?:[^()]|\([^()]*\))*\)/g, '$1')
    // Emphasis, strong first, so `***both***` and nested emphasis lose every marker. Escaped markers (`\*`, `\_`)
    // are skipped, and `_` inside a name such as `row_num` stays.
    .replace(/(?<!\\)\*\*(\S(?:.*?[^\s\\])??)\*\*/g, '$1')
    .replace(/(?<![\w\\])__(\S(?:.*?[^\s\\])??)__(?!\w)/g, '$1')
    .replace(/(?<!\\)\*(\S(?:.*?[^\s\\])??)\*/g, '$1')
    .replace(/(?<![\w\\])_(\S(?:.*?[^\s\\])??)_(?!\w)/g, '$1')
    .replace(/(?<!\\)`+/g, '') // a backtick no span closes
    .replace(/\\([\\`*_{}[\]()#+\-.!|])/g, '$1') // Markdown escapes, e.g. TypeDoc's `\+`
    .replace(/\uE000(\d+)\uE000/g, (_, index) => code[index])
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Cuts a description at a word boundary.
 * @param {string} text
 * @returns {string}
 */
function shorten(text) {
  if (text.length <= MAX_DESCRIPTION) return text;
  return `${text.slice(0, MAX_DESCRIPTION - 1).replace(/\s+\S*$/, '')}…`;
}

/**
 * Replaces the site-wide description in the head with the page's first paragraph.
 * @param {object} route `locals.starlightRoute`
 */
function setDescription(route) {
  if (route.entry.data.description) return;
  // `{{ $page.* }}` values filled in, so a placeholder doesn't cut the paragraph short.
  const body = substituteDocsData(route.entry.body ?? '');
  const intro = route.id.startsWith('api/') ? body.split(/^## /m)[0] : body;
  const description = shorten(firstParagraph(intro));
  if (!description) return;
  for (const tag of route.head) {
    const key = tag.attrs?.name ?? tag.attrs?.property;
    if (tag.tag === 'meta' && (key === 'description' || key === 'og:description' || key === 'twitter:description')) {
      tag.attrs.content = description;
    }
  }
}

export const onRequest = defineRouteMiddleware(({ locals }) => {
  setDescription(locals.starlightRoute);

  const { pagination, sidebar } = locals.starlightRoute;
  const links = pageLinks(sidebar);
  const current = links.findIndex((link) => link.isCurrent);
  if (current === -1) return;

  // Only links Starlight took from the sidebar; one set in frontmatter (`prev`/`next`) is kept as it is.
  const fromSidebar = (link) => link && !link.href.includes('#') && !(OVERVIEW_ATTR in (link.attrs ?? {}));
  if (pagination.prev && !fromSidebar(pagination.prev)) pagination.prev = links[current - 1];
  if (pagination.next && !fromSidebar(pagination.next)) pagination.next = links[current + 1];
});

/**
 * Standalone Node test for the strip-citation-markers plugin.
 *
 * Run with: `node docs/.vuepress/plugins/strip-citation-markers/test.js`
 *
 * Loads the fixture, parses it with markdown-it (the same parser VuePress
 * ships) using the plugin installed, then asserts:
 *   - No `[V<n>]` markers leak into the rendered HTML body.
 *   - The `§Sources` footer and its content are removed.
 *   - Inline code and fenced code blocks keep their `[V<n>]` text intact.
 *   - Real markdown links `[V<n>](url)` are preserved as links.
 */

const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');
const footnotePlugin = require('markdown-it-footnote');
const stripCitationMarkers = require('./index');
const { transformTokens } = stripCitationMarkers;

const fixturePath = path.join(__dirname, 'test-fixture.md');
const source = fs.readFileSync(fixturePath, 'utf8');

const md = new MarkdownIt({ html: true });
md.use(stripCitationMarkers);

const rendered = md.render(source);

const failures = [];

const assert = (cond, message) => {
  if (!cond) failures.push(message);
};

// 1. No bare markers in rendered HTML body text.
//    We use a regex that excludes anything wrapped in <code>...</code>
//    so inline/fenced code content does not count against us.
const renderedWithoutCode = rendered
  .replace(/<code[\s\S]*?<\/code>/g, '')
  .replace(/<pre[\s\S]*?<\/pre>/g, '');
assert(
  !/\[V\d+\]/.test(renderedWithoutCode),
  'Expected no [V<n>] markers in rendered HTML body, but found some'
);

// 2. §Sources footer must be gone.
assert(
  !/Sources/i.test(renderedWithoutCode) || !/source-1/.test(rendered),
  'Expected §Sources footer to be removed'
);
assert(
  !/Trailing footer content/.test(rendered),
  'Expected §Sources footer body to be removed'
);

// 3. Inline code with `[V99]` must survive.
assert(
  /<code>\[V99\]<\/code>/.test(rendered),
  'Expected inline code `[V99]` to survive untouched'
);

// 4. Fenced code block with `[V7]` must survive.
assert(
  /fenced code \[V7\] stays as-is/.test(rendered),
  'Expected fenced code block content to keep [V7]'
);

// 5. Real markdown link `[V12](url)` must remain a link.
assert(
  /<a[^>]*href="https:\/\/example\.com\/v12"[^>]*>V12<\/a>/.test(rendered),
  'Expected [V12](url) to remain a real markdown link'
);

// 6. Subsection heading should keep its text minus the marker.
assert(
  /<h2[^>]*>.*A subsection.*<\/h2>/.test(rendered) &&
    !/A subsection \[V8\]/.test(rendered),
  'Expected subsection heading text to be cleaned of marker'
);

// 6a. Mutation kill (M1) — zero-digit `[V]` must NOT be stripped; the
//     regex must require `\d+`, not `\d*`. If the quantifier is weakened,
//     literal `[V]` (no digits) would also be removed.
const mdM1 = new MarkdownIt({ html: true });
mdM1.use(stripCitationMarkers);
const renderedM1 = mdM1.render('Bare brackets like [V] are not markers.');
assert(
  /\[V\]/.test(renderedM1),
  'Expected literal [V] (no digits) to be preserved'
);

// 6b. Mutation kill (M2) — the negative-lookahead `(?!\()` anchors the
//     "real markdown link survives" guarantee. Re-assert post-parse that
//     the link text is "V12" (digits intact), not collapsed to "V".
assert(
  /<a [^>]*href="https:\/\/example\.com\/v12"[^>]*>V12<\/a>/.test(rendered) &&
    !/<a [^>]*href="https:\/\/example\.com\/v12"[^>]*>V<\/a>/.test(rendered),
  'Expected link text to remain "V12", not be collapsed to "V"'
);

// 6c. Mutation kill (M3) — `SOURCES_HEADING_PATTERN` uses the `i` flag.
//     A lowercase `## sources` footer must also be stripped.
const mdM3 = new MarkdownIt({ html: true });
mdM3.use(stripCitationMarkers);
const renderedM3 = mdM3.render(
  '# Page\n\nBody.\n\n## sources\n\n- lower-case sources body\n'
);
assert(
  !/lower-case sources body/.test(renderedM3),
  'Expected case-insensitive Sources heading match (lowercase variant stripped)'
);

// 6d. Mutation kill (M5) — `findFooterEnd` terminates at an `h1` boundary,
//     NOT an `h2`. A top-level `# Second page` after the Sources footer must
//     end the splice so its body survives.
const mdM5 = new MarkdownIt({ html: true });
mdM5.use(stripCitationMarkers);
const renderedM5 = mdM5.render([
  '# First page',
  '',
  'First body.',
  '',
  '## § Sources',
  '',
  '- footer to drop',
  '',
  '# Second page',
  '',
  'Second body must survive.',
].join('\n'));
assert(
  /Second body must survive/.test(renderedM5) &&
    !/footer to drop/.test(renderedM5),
  'Expected footer stripping to stop at the next h1 boundary'
);

// 6e. Mutation kill (M11) — `stripInlineMarkers` collapses 2+ spaces left
//     behind by marker removal. The fixture line "multiple markers [V3] [V4]
//     should collapse..." must not contain a run of 2+ spaces in the output.
assert(
  !/multiple markers {2,}should collapse/.test(rendered),
  'Expected double whitespace left by marker removal to be collapsed to a single space'
);

// 6f. Bugbot edge case — a heading whose raw inline content carries an
//     authored `[V<n>]` marker (e.g. `§ Sources [V1]`) must still be
//     detected as the Sources footer. Footer detection runs BEFORE inline
//     marker stripping, so the heading-text check must normalize markers
//     out before testing the strict-anchored regex.
const mdBugbot = new MarkdownIt({ html: true });
mdBugbot.use(stripCitationMarkers);
const renderedBugbot = mdBugbot.render([
  '# Page',
  '',
  'Body text.',
  '',
  '## § Sources [V1]',
  '',
  '- [V1] https://example.com/source-1 — footer body to drop',
  '',
].join('\n'));
assert(
  !/footer body to drop/.test(renderedBugbot),
  'Expected `§ Sources [V1]` heading to be detected as Sources footer (Bugbot edge case)'
);
assert(
  !/\[V1\]/.test(renderedBugbot.replace(/<code[\s\S]*?<\/code>/g, '')),
  'Expected `[V<n>]` marker not to survive on a page with `§ Sources [V1]` heading'
);

// 6g. Mutation kill — a bare `§ Sources` heading (no markers) must still
//     trigger the strip after the normalization shim is added; guards
//     against accidentally swallowing the pattern test or replacing it.
const mdBareSources = new MarkdownIt({ html: true });
mdBareSources.use(stripCitationMarkers);
const renderedBareSources = mdBareSources.render([
  '# Page',
  '',
  'Body.',
  '',
  '## § Sources',
  '',
  '- bare-sources footer body',
  '',
].join('\n'));
assert(
  !/bare-sources footer body/.test(renderedBareSources),
  'Expected bare `§ Sources` heading (no markers) to still trigger footer strip'
);

// 7. Synthetic token-stream: a §Sources heading followed by footer text
//    followed by `footnote_*` tokens must keep the footnote tokens after the
//    footer is spliced out. Mirrors what markdown-it-footnote appends at the
//    END of the token stream.
const makeToken = (type, tag = '', extra = {}) =>
  Object.assign({ type, tag, content: '', children: null }, extra);

const syntheticTokens = [
  makeToken('heading_open', 'h1', { markup: '#' }),
  makeToken('inline', '', { content: 'Page title', children: [] }),
  makeToken('heading_close', 'h1'),
  makeToken('paragraph_open', 'p'),
  makeToken('inline', '', { content: 'Body with a footnote ref.', children: [] }),
  makeToken('paragraph_close', 'p'),
  makeToken('heading_open', 'h2', { markup: '##' }),
  makeToken('inline', '', { content: '§ Sources', children: [] }),
  makeToken('heading_close', 'h2'),
  makeToken('paragraph_open', 'p'),
  makeToken('inline', '', { content: 'Trailing footer body.', children: [] }),
  makeToken('paragraph_close', 'p'),
  makeToken('footnote_block_open'),
  makeToken('footnote_open', '', { meta: { id: 0 } }),
  makeToken('inline', '', { content: 'Footnote text.', children: [] }),
  makeToken('footnote_anchor'),
  makeToken('footnote_close'),
  makeToken('footnote_block_close'),
];

transformTokens(syntheticTokens);

const survivingTypes = syntheticTokens.map((t) => t.type);
assert(
  survivingTypes.includes('footnote_block_open') &&
    survivingTypes.includes('footnote_open') &&
    survivingTypes.includes('footnote_anchor') &&
    survivingTypes.includes('footnote_close') &&
    survivingTypes.includes('footnote_block_close'),
  'Expected footnote_* tokens to survive past the §Sources splice (got: ' +
    survivingTypes.join(',') + ')'
);
assert(
  !syntheticTokens.some(
    (t) => t.type === 'inline' && /Trailing footer body/.test(t.content || '')
  ),
  'Expected §Sources footer body to be removed from synthetic token stream'
);

// 8. Full-pipeline check with markdown-it-footnote: a page that has a
//    footnote AND a §Sources footer must still render the footnote anchor.
const mdWithFootnotes = new MarkdownIt({ html: true });
mdWithFootnotes.use(footnotePlugin);
mdWithFootnotes.use(stripCitationMarkers);

const footnoteSource = [
  '# Footnote-aware page',
  '',
  'Body text with a footnote ref.[^note] [V5]',
  '',
  '[^note]: Footnote body content.',
  '',
  '## § Sources',
  '',
  '- [V5] https://example.com/source-5',
  '',
].join('\n');

const footnoteRendered = mdWithFootnotes.render(footnoteSource);

assert(
  /class="footnote-ref"|class="footnotes"|<section[^>]*footnotes/i.test(footnoteRendered),
  'Expected footnote anchor/section to survive in full-pipeline render'
);
assert(
  /Footnote body content/.test(footnoteRendered),
  'Expected footnote body content to survive in full-pipeline render'
);
assert(
  !/Trailing footer/.test(footnoteRendered) && !/\[V5\]/.test(footnoteRendered.replace(/<code[\s\S]*?<\/code>/g, '')),
  'Expected §Sources footer and inline [V<n>] markers to still be stripped'
);

if (failures.length > 0) {
  console.error('FAIL strip-citation-markers');
  failures.forEach((f) => console.error('  - ' + f));
  console.error('\n--- rendered output ---\n' + rendered);
  console.error('\n--- footnote rendered output ---\n' + footnoteRendered);
  process.exit(1);
}

console.log('PASS strip-citation-markers (' + 20 + ' assertions)');

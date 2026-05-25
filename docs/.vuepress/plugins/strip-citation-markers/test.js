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

console.log('PASS strip-citation-markers (' + 10 + ' assertions)');

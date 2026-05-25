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
const stripCitationMarkers = require('./index');

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

if (failures.length > 0) {
  console.error('FAIL strip-citation-markers');
  failures.forEach((f) => console.error('  - ' + f));
  console.error('\n--- rendered output ---\n' + rendered);
  process.exit(1);
}

console.log('PASS strip-citation-markers (' + 6 + ' assertions)');

/**
 * Plugin-order regression test for `strip-citation-markers`.
 *
 * Background: the strip plugin's footer splice intentionally stops before
 * any `footnote_*` token because `markdown-it-footnote` appends those at
 * the END of the token stream — they belong to the page body, not to the
 * `§ Sources` footer.
 *
 * The wiring contract in `docs/.vuepress/config.js` is:
 *
 *     md.use(footnotePlugin)            // registers footnote_tail
 *     md.use(includeCodeSnippet)
 *     md.use(stripCitationMarkers)      // splices §Sources footer
 *
 * The ACTUAL ordering that makes footnotes survive is determined by where
 * each plugin hooks into `core.ruler`:
 *   - `markdown-it-footnote`: `core.ruler.after('inline', 'footnote_tail')`
 *   - `strip-citation-markers`: `core.ruler.before('replacements', ...)`
 *
 * Because `inline` comes before `replacements` in markdown-it's default
 * core rule chain, `footnote_tail` always runs before our strip rule — as
 * long as BOTH plugins are registered. If a future refactor:
 *   (a) removes `markdown-it-footnote` (no footnote tokens ever exist), or
 *   (b) registers it in a way that moves `footnote_tail` AFTER our hook,
 * then footnotes on any page with a `§ Sources` footer will be silently
 * swallowed by the splice.
 *
 * This test demonstrates both halves of the contract:
 *
 *   1. NEGATIVE CONTROL: build a markdown-it instance that DOES NOT carry
 *      `markdown-it-footnote`. Feed it a page with `[^note]` syntax + a
 *      `§ Sources` footer. The `[^note]` literal text appears BEFORE the
 *      `§ Sources` heading so it survives the splice — but no footnote
 *      anchor/section is produced (because no footnote plugin is loaded).
 *      This anchors the "footnote_tail must be registered upstream" half
 *      of the contract.
 *
 *   2. POSITIVE CONTROL: same source, plugins registered in the SAME order
 *      as `config.js`. Footnote anchor + body + section all survive AND
 *      the `§ Sources` footer body is stripped AND inline `[V<n>]` markers
 *      are stripped. This is the contract `config.js` relies on.
 *
 * If either of these assertions ever flips, the strip plugin and the
 * VuePress config are out of sync and footnotes will break in customer
 * docs.
 *
 * Run with: `node docs/.vuepress/plugins/strip-citation-markers/test-plugin-order.js`
 */

const MarkdownIt = require('markdown-it');
const footnotePlugin = require('markdown-it-footnote');
const stripCitationMarkers = require('./index');

const failures = [];

const assert = (cond, message) => {
  if (!cond) failures.push(message);
};

const source = [
  '# Footnote-aware page',
  '',
  'Body text with a footnote ref.[^note] [V5]',
  '',
  '[^note]: Footnote body content.',
  '',
  '## § Sources',
  '',
  '- [V5] https://example.com/source-5',
  '- Trailing footer entry that must be stripped.',
  '',
].join('\n');

const hasFootnoteAnchor = (html) =>
  /class="footnote-ref"|class="footnotes"|<section[^>]*footnotes/i.test(html);
const hasFootnoteBody = (html) => /Footnote body content/.test(html);

// --- 1. NEGATIVE CONTROL: no markdown-it-footnote installed.
//     The `[^note]` reference is just literal text; no `footnote_*` tokens
//     are ever generated; the strip plugin behaves correctly on body text
//     (markers stripped, §Sources footer dropped) but there is no footnote
//     anchor/section in the output. This locks in the assumption that
//     footnote tokens come from a SEPARATE plugin — if someone replaces
//     `markdown-it-footnote` with a different mechanism, this test fails
//     and forces a review of `findFooterEnd`'s footnote check.
const mdNoFootnote = new MarkdownIt({ html: true });
mdNoFootnote.use(stripCitationMarkers);
const noFootnoteHtml = mdNoFootnote.render(source);

assert(
  !hasFootnoteAnchor(noFootnoteHtml),
  'Negative control: without markdown-it-footnote, no footnote anchor/section should appear. If this fires, the strip plugin or markdown-it core gained an unexpected footnote rule and the wiring assumption changed.'
);
assert(
  !/Trailing footer entry/.test(noFootnoteHtml),
  'Negative control: §Sources footer body must still be stripped even without footnote plugin'
);
assert(
  !/\[V5\]/.test(noFootnoteHtml.replace(/<code[\s\S]*?<\/code>/g, '')),
  'Negative control: inline [V<n>] markers must still be stripped even without footnote plugin'
);

// --- 2. POSITIVE CONTROL: plugins registered in the same order as
//     `config.js`: footnote FIRST, strip LAST. This is the contract.
const mdConfig = new MarkdownIt({ html: true });
mdConfig.use(footnotePlugin);
mdConfig.use(stripCitationMarkers);
const configOrderHtml = mdConfig.render(source);

assert(
  hasFootnoteAnchor(configOrderHtml),
  'Positive control: config-order (footnote BEFORE strip) must render the footnote anchor/section'
);
assert(
  hasFootnoteBody(configOrderHtml),
  'Positive control: config-order must render the footnote body content'
);
assert(
  !/Trailing footer entry/.test(configOrderHtml),
  'Positive control: config-order must still strip the §Sources footer body'
);
assert(
  !/\[V5\]/.test(configOrderHtml.replace(/<code[\s\S]*?<\/code>/g, '')),
  'Positive control: config-order must still strip inline [V<n>] markers'
);

// --- 3. RULE-CHAIN INVARIANT: assert that `footnote_tail` runs BEFORE the
//     strip plugin's rule in the resulting `core.ruler` chain. This is the
//     PRIMITIVE mechanism that makes the wiring work. If a future
//     markdown-it-footnote version moves `footnote_tail` to a different
//     ruler position, this assertion fires and points engineers at the
//     root cause directly.
const ruleNames = mdConfig.core.ruler.__rules__.map((r) => r.name);
const footnoteIdx = ruleNames.indexOf('footnote_tail');
const stripIdx = ruleNames.indexOf('strip-citation-markers');
assert(
  footnoteIdx !== -1,
  'Rule-chain invariant: expected `footnote_tail` rule to be registered by markdown-it-footnote'
);
assert(
  stripIdx !== -1,
  'Rule-chain invariant: expected `strip-citation-markers` rule to be registered'
);
assert(
  footnoteIdx < stripIdx,
  'Rule-chain invariant: expected `footnote_tail` to run BEFORE `strip-citation-markers` so footnote tokens exist when the splice runs (got footnote_tail=' +
    footnoteIdx + ', strip=' + stripIdx + ')'
);

if (failures.length > 0) {
  console.error('FAIL strip-citation-markers/test-plugin-order');
  failures.forEach((f) => console.error('  - ' + f));
  console.error('\n--- no-footnote rendered output ---\n' + noFootnoteHtml);
  console.error('\n--- config-order rendered output ---\n' + configOrderHtml);
  process.exit(1);
}

console.log(
  'PASS strip-citation-markers/test-plugin-order (10 assertions: 3 negative + 4 positive + 3 rule-chain)'
);

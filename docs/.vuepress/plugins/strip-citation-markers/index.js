/**
 * markdown-it plugin: strip internal audit-harness annotations from rendered docs.
 *
 * Our internal authoring workflow uses the audit-harness convention:
 *   - Inline citation markers like `[V1]`, `[V12]` placed next to factual claims.
 *   - A trailing `§ Sources` (or `§Sources`) footer listing the sources.
 *
 * These markers exist so the audit-harness can re-verify every claim against
 * its source before content is shipped. They are NEVER meant to be seen by
 * end users. When any spec or note ends up published as docs, we strip them
 * at build time so the rendered site stays clean.
 *
 * Stripping rules:
 *   - Inline marker:    `[V<digits>]` NOT followed by `(` (so real
 *                       markdown links `[V12](url)` are left untouched).
 *   - Footer section:   a heading whose text is exactly `Sources` or
 *                       `§ Sources` / `§Sources`, together with everything
 *                       below it up to end-of-file or the next top-level
 *                       (`#`) heading.
 *   - Fenced/inline code is left alone, so pages that document the
 *     audit-harness itself can still render the markers verbatim.
 *
 * Implementation: walks the markdown-it token stream after parsing.
 */

const INLINE_CITATION_PATTERN = /\[V\d+\](?!\()/g;
const SOURCES_HEADING_PATTERN = /^\s*(?:§\s*)?Sources\s*$/i;

/**
 * Removes inline `[V<n>]` markers from a string of text.
 *
 * @param {string} text - Raw text content from a markdown token.
 * @returns {string} Text with citation markers removed and surrounding
 *                   whitespace normalized.
 */
const stripInlineMarkers = (text) =>
  text
    .replace(INLINE_CITATION_PATTERN, '')
    // collapse stray double spaces left behind by removal
    .replace(/[ \t]{2,}/g, ' ')
    // tidy " ." / " ," / " ;" / " :" / " )"
    .replace(/ ([.,;:!?\)])/g, '$1');

/**
 * Recursively strips inline markers from children of an inline token.
 *
 * @param {Array} children - markdown-it inline children tokens.
 */
const stripChildren = (children) => {
  if (!Array.isArray(children)) return;
  children.forEach((child) => {
    if (child.type === 'text' && typeof child.content === 'string') {
      child.content = stripInlineMarkers(child.content);
    }
    if (child.children) {
      stripChildren(child.children);
    }
  });
};

/**
 * Detects whether a heading_open token (already located) introduces the
 * `Sources` / `§Sources` footer. The heading's raw inline content is first
 * normalized via `stripInlineMarkers` so that an authored heading like
 * `§ Sources [V1]` (markers next to the heading text) still matches the
 * strict end-anchored pattern; without normalization the trailing `[V1]`
 * would defeat the `\s*$` anchor and the footer would never be detected.
 *
 * @param {Array} tokens - Full token array.
 * @param {number} headingOpenIdx - Index of the heading_open token.
 * @returns {boolean} True when the heading text matches the Sources footer.
 */
const isSourcesHeading = (tokens, headingOpenIdx) => {
  const inline = tokens[headingOpenIdx + 1];
  if (!inline || inline.type !== 'inline') return false;
  return SOURCES_HEADING_PATTERN.test(stripInlineMarkers(inline.content || ''));
};

/**
 * Returns the index after which the Sources footer ends. The footer extends
 * from the Sources heading up to (but not including) the FIRST of:
 *   - the next top-level (`h1`) heading_open token, or
 *   - any `footnote_*` token (markdown-it-footnote appends `footnote_block`
 *     and friends at the END of the stream; they belong to the page body,
 *     not to the footer), or
 *   - end-of-stream.
 *
 * @param {Array} tokens - Full token array.
 * @param {number} startIdx - Index of the Sources heading_open token.
 * @returns {number} Exclusive end index of the footer.
 */
const findFooterEnd = (tokens, startIdx) => {
  for (let i = startIdx + 1; i < tokens.length; i += 1) {
    const t = tokens[i];
    if (t.type === 'heading_open' && t.tag === 'h1') {
      return i;
    }
    if (typeof t.type === 'string' && t.type.startsWith('footnote_')) {
      return i;
    }
  }
  return tokens.length;
};

/**
 * Mutates the token array in place to remove the Sources footer (heading +
 * everything below) and apply inline marker stripping to every text token.
 *
 * Footnote invariant: markdown-it-footnote (registered in `config.js`)
 * appends `footnote_block` / `footnote_anchor` / `footnote_open` /
 * `footnote_close` / `footnote_ref` tokens at the END of the token stream.
 * The footer splice stops before any such token so footnotes on pages that
 * also carry a `§ Sources` footer are not silently swallowed.
 *
 * @param {Array} tokens - markdown-it token array.
 * @returns {Array} The same token array (for chaining).
 */
const transformTokens = (tokens) => {
  // 1. Find a `Sources` heading and drop everything from it onward
  //    (up to the next h1, if any).
  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i];
    if (t.type === 'heading_open' && isSourcesHeading(tokens, i)) {
      const end = findFooterEnd(tokens, i);
      tokens.splice(i, end - i);
      i -= 1;
    }
  }

  // 2. Strip `[V<n>]` markers from every remaining inline text token.
  //    Code tokens (`code_inline`, `code_block`, `fence`) are skipped so
  //    docs that illustrate the audit-harness syntax keep working.
  tokens.forEach((token) => {
    if (token.type === 'inline' && token.children) {
      stripChildren(token.children);
    }
  });

  return tokens;
};

/**
 * markdown-it plugin entry point. Hooks into the core ruler so transforms
 * run after parsing but before rendering.
 *
 * @param {object} md - markdown-it instance supplied by VuePress.
 */
const stripCitationMarkers = (md) => {
  // Insert before `replacements` so that VuePress's heading-anchor logic
  // (which runs later and slugifies heading text) also sees the cleaned
  // text. Falls back to push() if the anchor rule cannot be located.
  const insert = (state) => {
    transformTokens(state.tokens);
  };
  try {
    md.core.ruler.before('replacements', 'strip-citation-markers', insert);
  } catch (e) {
    md.core.ruler.push('strip-citation-markers', insert);
  }
};

module.exports = stripCitationMarkers;
module.exports.transformTokens = transformTokens;
module.exports.stripInlineMarkers = stripInlineMarkers;

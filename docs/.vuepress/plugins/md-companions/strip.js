/**
 * Strips VuePress-specific markdown syntax, producing clean markdown
 * suitable for LLM consumption. Fence-aware: never edits inside code blocks.
 * @param {string} src raw markdown (frontmatter already removed)
 * @returns {string} cleaned markdown
 */
function stripVuePressSyntax(src) {
  const lines = src.split('\n');
  const out = [];
  let inFence = false;
  let fenceMarker = '';
  let inScript = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const fenceMatch = trimmed.match(/^(```+|~~~+)/);
    if (fenceMatch && !inScript) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fenceMatch[1];   // full marker e.g. "```" or "````"
      } else {
        const closeMatch = trimmed.match(/^(```+|~~~+)/);
        if (closeMatch && closeMatch[1][0] === fenceMarker[0] && closeMatch[1].length >= fenceMarker.length) {
          inFence = false;
        }
      }
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }

    if (/^<(script|style)[\s>]/i.test(trimmed)) {
      // A self-contained one-liner (`<script>…</script>`) must NOT open a
      // multi-line skip — otherwise every following line up to the next
      // closing tag would be swallowed. Drop just this line in that case.
      if (!/<\/(script|style)>/i.test(trimmed)) inScript = true;
      continue;
    }
    if (inScript) {
      if (/<\/(script|style)>/i.test(trimmed)) inScript = false;
      continue;
    }

    if (/^<[A-Z][A-Za-z0-9]*(\s[^>]*)?\/?>$/.test(trimmed)) continue;

    // Whole-line closing tag of a paired block component (e.g. `</Collapse>`) — drop the
    // tag but keep the inner content that sits between it and its opening tag.
    if (/^<\/[A-Z][A-Za-z0-9]*>$/.test(trimmed)) continue;

    if (/^\[\[toc\]\]$/i.test(trimmed)) continue;

    const open = trimmed.match(/^:::\s*(\w+)\s*(.*)$/i);
    if (open) {
      const type = open[1].toLowerCase();
      const title = open[2].trim();
      const body = [];
      i++;
      const bodyStart = i;
      while (i < lines.length && lines[i].trim() !== ':::') { body.push(lines[i]); i++; }
      // If we hit EOF without finding closing :::, emit verbatim (not a real container).
      if (i >= lines.length) {
        out.push(lines[bodyStart - 1]); // re-emit the opening line
        body.forEach(b => out.push(b));
        continue;
      }
      // Demo/example containers (live code runners) are not prose — omit entirely.
      if (type === 'example') { continue; }
      if (title) { out.push(`> **${title}**`); out.push('>'); }
      body.forEach(b => out.push(b.trim() === '' ? '>' : `> ${b}`));
      while (out.length && out[out.length - 1] === '>') out.pop();
      continue;
    }

    // Neutralise Vue-only markup that ships as broken, non-portable syntax in
    // the `.md` companions (all outside code fences):
    //   - Vue-bound `<a :href="…">text</a>` → keep the link text, drop the tag,
    //   - Vue-bound `<img :src="…">` → drop (no useful text for an LLM),
    //   - inline self-closing PascalCase components (e.g. `<Badge text="…"/>`).
    // The `[A-Z]` guard on the last rule leaves plain HTML like `<br/>` untouched.
    // NOTE: `{{ … }}` interpolations are intentionally LEFT AS-IS. They can't be
    // expanded from source markdown, and wiping them drops meaningful inline
    // values (e.g. a function count). Full expansion needs rendered-HTML
    // extraction — tracked as a follow-up.
    const cleaned = line
      .replace(/\[\[toc\]\]/gi, '')
      .replace(/<a\s[^>]*:href[^>]*>(.*?)<\/a>/gi, '$1')
      .replace(/<img\s[^>]*:src[^>]*\/?>/gi, '')
      .replace(/\s*<[A-Z][A-Za-z0-9]*(?:\s[^>]*?)?\/>/g, '');
    out.push(cleaned);
  }

  // Collapse runs of blank lines to a single blank — but NEVER inside code
  // fences, where consecutive blank lines are significant code content.
  const collapsed = [];
  let outFence = false;
  let outMarker = '';
  let blanks = 0;
  for (const l of out) {
    const t = l.trim();
    const fm = t.match(/^(```+|~~~+)/);
    if (fm && (!outFence || (fm[1][0] === outMarker[0] && fm[1].length >= outMarker.length))) {
      if (!outFence) { outFence = true; outMarker = fm[1]; } else { outFence = false; }
      collapsed.push(l);
      blanks = 0;
      continue;
    }
    if (outFence) { collapsed.push(l); continue; }
    if (t === '') { if (++blanks >= 2) continue; } else { blanks = 0; }
    collapsed.push(l);
  }
  return collapsed.join('\n').trim();
}

module.exports = { stripVuePressSyntax };

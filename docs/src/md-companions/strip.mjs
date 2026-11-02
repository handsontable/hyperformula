/**
 * Removes the API reference's member badges (`<span class="hf-badge">Static</span>`,
 * written by `docs/typedoc-theme/`) from a single prose line. `{{ … }}` interpolations
 * are left verbatim (resolved upstream against the page data before stripping).
 * @param {string} line
 * @returns {string}
 */
function cleanInlineMarkup(line) {
  return line.replace(/\s*<span class="hf-badge">[^<]*<\/span>/g, '');
}

/**
 * Strips the markdown syntax only the site renders, producing clean markdown
 * suitable for LLM consumption. Fence-aware: never edits inside code blocks.
 * @param {string} src raw markdown (frontmatter already removed)
 * @returns {string} cleaned markdown
 */
export function stripSiteSyntax(src) {
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

    // A whole-line custom element (e.g. `<hf-coding-agent-wizard></hf-coding-agent-wizard>`) is
    // interactive UI with no text of its own.
    if (/^<(hf-[a-z-]+)(\s[^>]*)?><\/\1>$/.test(trimmed)) continue;

    // An aside (`:::tip`, `:::caution[Title]`) or an example (`:::example{#id}`).
    const open = trimmed.match(/^:::(\w+)(?:\[(.*)\])?(?:\{[^}]*\})?$/);
    if (open) {
      const type = open[1].toLowerCase();
      const title = (open[2] || '').trim();
      const body = [];
      i++;
      const bodyStart = i;
      // Fence-aware close: a bare `:::` inside a fenced code block in the body is
      // NOT the container closer.
      let bodyFence = false;
      let bodyMarker = '';
      while (i < lines.length) {
        const bt = lines[i].trim();
        const bfm = bt.match(/^(```+|~~~+)/);
        if (bfm) {
          if (!bodyFence) { bodyFence = true; bodyMarker = bfm[1]; }
          else if (bfm[1][0] === bodyMarker[0] && bfm[1].length >= bodyMarker.length) { bodyFence = false; }
        } else if (!bodyFence && bt === ':::') {
          break;
        }
        body.push(lines[i]);
        i++;
      }
      // If we hit EOF without finding closing :::, emit verbatim (not a real container).
      if (i >= lines.length) {
        out.push(lines[bodyStart - 1]); // re-emit the opening line
        body.forEach(b => out.push(b));
        continue;
      }
      // Demo/example containers (live code runners) are not prose — omit entirely.
      if (type === 'example') { continue; }
      if (title) { out.push(`> **${title}**`); out.push('>'); }
      // Container bodies run through the same inline cleanup as normal prose —
      // EXCEPT inside fenced code blocks, where markup-shaped samples are literal
      // content and must survive verbatim.
      // The body scan above already located these fences; re-derive that state
      // here so emit skips cleanInlineMarkup for code lines.
      let emitFence = false;
      let emitMarker = '';
      body.forEach(b => {
        const bfm = b.trim().match(/^(```+|~~~+)/);
        if (bfm && (!emitFence || (bfm[1][0] === emitMarker[0] && bfm[1].length >= emitMarker.length))) {
          if (!emitFence) { emitFence = true; emitMarker = bfm[1]; } else { emitFence = false; }
          out.push(`> ${b}`);
          return;
        }
        if (emitFence) { out.push(`> ${b}`); return; }
        out.push(b.trim() === '' ? '>' : `> ${cleanInlineMarkup(b)}`);
      });
      while (out.length && out[out.length - 1] === '>') out.pop();
      continue;
    }

    // Normal prose line: run the shared inline cleanup (see cleanInlineMarkup).
    out.push(cleanInlineMarkup(line));
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
    if (t === '') {
      if (++blanks >= 2) continue;   // collapse runs of blank lines
      collapsed.push('');            // normalise whitespace-only lines to a clean blank
      continue;
    }
    blanks = 0;
    collapsed.push(l);
  }

  // Drop trailing empty sections: a heading left with no body (e.g. a `## Demo`
  // whose `:::example` live-demo was stripped) would otherwise dangle at EOF.
  // Guard: only when the doc has real prose, so a page that is legitimately just
  // a title (e.g. `# AbsoluteCellRange`) is never wiped.
  const hasProse = collapsed.some(l => {
    const s = l.trim();
    return s !== '' && !/^#{1,6}\s/.test(s);
  });
  if (hasProse) {
    while (collapsed.length) {
      const last = collapsed[collapsed.length - 1].trim();
      if (last === '' || /^#{1,6}\s/.test(last)) collapsed.pop();
      else break;
    }
  }
  return collapsed.join('\n').trim();
}

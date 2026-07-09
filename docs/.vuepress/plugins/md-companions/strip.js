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

    if (/^<(script|style)[\s>]/i.test(trimmed)) { inScript = true; continue; }
    if (inScript) {
      if (/<\/(script|style)>/i.test(trimmed)) inScript = false;
      continue;
    }

    if (/^<[A-Z][A-Za-z0-9]*(\s[^>]*)?\/?>$/.test(trimmed)) continue;

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

    // Strip inline self-closing Vue components (e.g. `# Heading <Badge text="Class"/>`);
    // whole-line component tags are already dropped above. The `[A-Z]` guard leaves
    // plain HTML like `<br/>` untouched, and code fences are handled earlier.
    out.push(line.replace(/\s*<[A-Z][A-Za-z0-9]*(?:\s[^>]*?)?\/>/g, ''));
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

module.exports = { stripVuePressSyntax };

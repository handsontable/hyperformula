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
        fenceMarker = fenceMatch[1][0];
      } else if (trimmed.startsWith(fenceMarker)) {
        inFence = false;
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

    const open = trimmed.match(/^:::\s*(tip|warning|danger|details)\s*(.*)$/i);
    if (open) {
      const title = open[2].trim();
      const body = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ':::') { body.push(lines[i]); i++; }
      if (title) { out.push(`> **${title}**`); out.push('>'); }
      body.forEach(b => out.push(b.trim() === '' ? '>' : `> ${b}`));
      while (out.length && out[out.length - 1] === '>') out.pop();
      continue;
    }

    out.push(line);
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

module.exports = { stripVuePressSyntax };

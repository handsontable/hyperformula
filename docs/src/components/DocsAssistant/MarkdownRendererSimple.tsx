import { escapeHtml, escapeHtmlAttr } from './escapeHtml';

interface Props {
  content: string;
}

/**
 * Lightweight markdown for WebKit versions before Safari 16.4. Avoids loading
 * react-markdown / shiki chunks that contain RegExp syntax those engines cannot parse.
 */
function renderSimpleMarkdown(content: string): string {
  const parts = content.split('```');
  let html = '';

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      const block = parts[i];
      const newline = block.indexOf('\n');
      let code = block;
      if (newline !== -1) {
        const firstLine = block.slice(0, newline).trim();
        if (/^[\w-]+$/.test(firstLine)) {
          code = block.slice(newline + 1);
        }
      }
      html += `<pre class="da-code-fallback"><code>${escapeHtml(code.replace(/\n$/, ''))}</code></pre>`;
    } else {
      // Find the URLs in the raw text and escape each piece once: escaping first would turn a URL's `&` into
      // `&amp;` and then escape that again, breaking query strings.
      const withLinks = parts[i]
        .split(/(https?:\/\/[^\s<"]+)/)
        .map((piece, j) => (
          j % 2 === 1
            ? `<a href="${escapeHtmlAttr(piece)}" target="_blank" rel="noopener noreferrer">${escapeHtml(piece)}</a>`
            : escapeHtml(piece)
        ))
        .join('');
      html += withLinks.replace(/\n/g, '<br>');
    }
  }

  return html;
}

export function MarkdownRendererSimple({ content }: Props) {
  return (
    <div
      className="da-markdown da-markdown-simple"
      dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(content) }}
    />
  );
}

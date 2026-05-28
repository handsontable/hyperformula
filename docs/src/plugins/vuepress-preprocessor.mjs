/**
 * Pure transform that converts a VuePress-flavoured markdown source string into
 * Starlight-native markdown. Run by `scripts/generate-content.mjs` ahead of the
 * Astro build (analogous to the TypeDoc API generation step), so Starlight then
 * renders asides, tables of contents and links through its native pipeline.
 *
 * HyperFormula specifics (differs from Handsontable):
 * - Guides have NO frontmatter; the page title lives in a body `# H1`. We lift
 *   it into a `title:` frontmatter field and strip the body H1 (otherwise
 *   Starlight renders a duplicate H1).
 * - Examples are file includes, not inline code: `::: example` wraps
 *   `@[code](@/docs/examples/.../exampleN.{html,css,js,ts})`. We strip the
 *   example markers and resolve each include into a fenced code block.
 * - Build-time vars `{{ $page.version|buildDate|releaseDate|functionsCount }}`
 *   are replaced with values from the built library (see docs-data.mjs).
 * - Internal `.md` / `.html` / relative links are rewritten to clean,
 *   base-aware URLs (outside fenced code).
 *
 * Aside bodies are intentionally left as markdown: native Starlight asides
 * render their content through the markdown pipeline, so no inline-markdown
 * pre-rendering is needed.
 *
 * @module vuepress-preprocessor
 */
import { fileURLToPath } from 'url';
import { dirname, resolve, posix } from 'path';
import { readFileSync } from 'fs';
import { DOCS_DATA } from './docs-data.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');
const BASE = (process.env.DOCS_BASE || '/docs').replace(/\/+$/, '') || '';

const EXT_LANG = {
  js: 'js', mjs: 'js', cjs: 'js', ts: 'ts', tsx: 'tsx', jsx: 'jsx',
  html: 'html', css: 'css', scss: 'scss', json: 'json', sh: 'bash', bash: 'bash',
};

/**
 * @param {string} content — raw VuePress markdown
 * @param {string} slug — content-relative slug, e.g. "guide/basic-usage"
 * @returns {string} Starlight-native markdown
 */
export function preprocessMarkdown(content, slug) {
  let result = content;

  result = ensureFrontmatterTitle(result, slug);
  // Remove VuePress [[toc]] (Starlight renders a ToC automatically). Drop the
  // whole line so a "**Contents:**" style prefix doesn't dangle.
  result = result.replace(/^.*\[\[\s*toc\s*\]\].*$/gm, '');

  // VuePress containers → Starlight asides (warning → caution).
  result = result.replace(/^::: tip(?:[ \t]+(.+))?$/gm, (_, l) => (l ? `:::tip[${l}]` : ':::tip'));
  result = result.replace(/^::: warning(?:[ \t]+(.+))?$/gm, (_, l) => (l ? `:::caution[${l}]` : ':::caution'));
  result = result.replace(/^::: danger(?:[ \t]+(.+))?$/gm, (_, l) => (l ? `:::danger[${l}]` : ':::danger'));
  result = result.replace(/^::: note(?:[ \t]+(.+))?$/gm, (_, l) => (l ? `:::note[${l}]` : ':::note'));

  result = convertDetailsContainers(result);
  result = transformExamples(result);
  result = stripExampleContainers(result);
  result = resolveCodeIncludes(result);

  // Env-var placeholders inside (now-inlined) example code.
  result = result
    .replace(/process\.env\.HT_BUILD_DATE as string/g, `'${DOCS_DATA.buildDate}'`)
    .replace(/process\.env\.HT_VERSION as string/g, `'${DOCS_DATA.version}'`)
    .replace(/process\.env\.HT_RELEASE_DATE as string/g, `'${DOCS_DATA.releaseDate}'`);

  // VuePress page template vars.
  result = result
    .replace(/\{\{\s*\$page\.buildDateURIEncoded\s*\}\}/g, encodeURIComponent(DOCS_DATA.buildDate))
    .replace(/\{\{\s*\$page\.version\s*\}\}/g, DOCS_DATA.version)
    .replace(/\{\{\s*\$page\.buildDate\s*\}\}/g, DOCS_DATA.buildDate)
    .replace(/\{\{\s*\$page\.releaseDate\s*\}\}/g, DOCS_DATA.releaseDate)
    .replace(/\{\{\s*\$page\.functionsCount\s*\}\}/g, String(DOCS_DATA.functionsCount));

  // VuePress <Badge> globals (heavy in generated API). In headings, drop them
  // entirely so the heading slug stays the bare member name (matching the old
  // VuePress anchors, e.g. #buildfromarray); elsewhere render as a pill.
  result = result
    .split('\n')
    .map((line) =>
      /^#{1,6}\s/.test(line)
        ? line.replace(/\s*<Badge\s+text="[^"]*"[^>]*\/>/g, '')
        : line.replace(/<Badge\s+text="([^"]*)"[^>]*\/>/g, '<span class="hf-badge">$1</span>')
    )
    .join('\n');

  // VuePress `$withBase('/x')` asset helper → base-aware path, and Vue `:src`
  // bindings on raw <img> tags → plain `src` attributes.
  result = result.replace(
    /\$withBase\(\s*['"]([^'"]+)['"]\s*\)/g,
    (_m, p) => `${BASE}${p.startsWith('/') ? p : `/${p}`}`
  );
  result = result.replace(/<img\s+:src=/g, '<img src=');

  result = rewriteLinks(result, slug);

  return result;
}

/** Make a path slug-safe and predictable (dots → hyphens), matching the generator. */
export function slugifyPath(p) {
  return p
    .split('/')
    .map((seg) => seg.replace(/\./g, '-'))
    .join('/');
}

const BADGE_TOKENS =
  '(static|readonly|optional|const|abstract|namespace|let|class|interface|enumeration)';
const BADGE_PREFIX_RE = new RegExp(`^#${BADGE_TOKENS}-`, 'i');
const BADGE_SUFFIX_RE = new RegExp(`-${BADGE_TOKENS}$`, 'i');

/**
 * Normalize an anchor to match what rehype-slug (Starlight) generates.
 *  - Strip TypeDoc badge tokens (Static/Readonly/Optional/…) at either end.
 *  - Drop VuePress's `_<digit>` numeric-heading prefix (`#_3-x` → `#3-x`),
 *    since rehype-slug doesn't add the leading underscore.
 */
function cleanBadgeAnchor(anchor) {
  if (!anchor) return anchor;
  return anchor
    .replace(BADGE_PREFIX_RE, '#')
    .replace(BADGE_SUFFIX_RE, '')
    .replace(/^#_(\d)/, '#$1');
}

/** Lift the first body `# H1` into a `title:` frontmatter field and strip it. */
function ensureFrontmatterTitle(content, slug) {
  let frontmatter = null;
  let body = content;
  const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

  if (fm) {
    frontmatter = fm[1];
    body = content.slice(fm[0].length);
  }

  const hasTitle = frontmatter !== null && /^title\s*:/m.test(frontmatter);

  const h1 = body.match(/^[ \t]*#[ \t]+(.+?)[ \t]*$/m);
  let extracted = null;

  if (h1) {
    extracted = cleanTitleText(h1[1]);
    body = body.slice(0, h1.index) + body.slice(h1.index + h1[0].length);
    body = body.replace(/^\r?\n/, '');
  }

  if (hasTitle) {
    return `---\n${frontmatter}\n---\n${body}`;
  }

  const title = extracted || fallbackTitle(slug);
  const titleLine = `title: ${yamlQuote(title)}`;

  return frontmatter !== null
    ? `---\n${titleLine}\n${frontmatter}\n---\n${body}`
    : `---\n${titleLine}\n---\n\n${body}`;
}

function cleanTitleText(s) {
  return s
    .replace(/<[^>]+>/g, '') // strip HTML (e.g. TypeDoc <Badge text="Class"/>)
    .replace(/`/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/[*_]/g, '')
    .trim();
}

function yamlQuote(s) {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function fallbackTitle(slug) {
  const last = slug.split('/').pop() || slug;

  return last.replace(/[-_]/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Convert a VuePress `::: example #id` block (which wraps `@[code]` includes for
 * the demo's html/css/js/ts) into: a live-preview container the client runner
 * hydrates (`data-example-js` points at the runnable module), the demo CSS, and
 * a collapsible "Source code" block. The runner lives in `scripts/example-runner.ts`.
 */
function transformExamples(content) {
  return content.replace(
    /^::: example\s+#(\S+)[^\n]*\n([\s\S]*?)\n:::[ \t]*$/gm,
    (_full, id, inner) => {
      const files = {};

      for (const m of inner.matchAll(/@\/docs\/examples\/[^\s)]+\.(html|css|js|ts)/g)) {
        files[m[1]] = m[0];
      }

      const readAlias = (alias) => {
        if (!alias) return '';

        try {
          return readFileSync(resolve(REPO_ROOT, alias.replace(/^@\//, '')), 'utf8').replace(/\s+$/, '');
        } catch {
          // eslint-disable-next-line no-console
          console.warn(`[generate-content] example file missing: ${alias}`);
          return '';
        }
      };

      const html = readAlias(files.html);
      const css = readAlias(files.css);
      // The runner imports the .js by web path (Vite project root = docs/).
      const jsWebPath = files.js ? files.js.replace(/^@\/docs/, '') : '';
      // Displayed source: drop the skip-in-compilation boilerplate (the import/log).
      const jsSrc = readAlias(files.js).replace(
        /\/\*\s*start:skip-in-compilation\s*\*\/[\s\S]*?\/\*\s*end:skip-in-compilation\s*\*\/\s*/g,
        ''
      ).trim();

      // A blank line ends a raw-HTML block in markdown, so the preview wrapper +
      // style + demo HTML must be one contiguous block — collapse blank lines.
      const collapse = (s) => s.replace(/\n([ \t]*\n)+/g, '\n');
      const styleBlock = css ? `<style>\n${collapse(css)}\n</style>\n` : '';
      const previewOpen = `<div class="hf-example__preview"${jsWebPath ? ` data-example-js="${jsWebPath}"` : ''}>`;

      let out =
        '<div class="hf-example not-content">\n' +
        styleBlock +
        `${previewOpen}\n${collapse(html)}\n</div>\n</div>`;

      if (jsSrc) {
        // Inside <details>, blank lines switch between raw HTML and the markdown
        // code fence (so Expressive Code renders it).
        out += `\n\n<details class="hf-example__source">\n<summary>Source code</summary>\n\n\`\`\`js\n${jsSrc}\n\`\`\`\n\n</details>`;
      }

      return out;
    }
  );
}

/** Strip `::: example` / `::: example-without-tabs` markers, keep inner content. */
function stripExampleContainers(content) {
  const lines = content.split('\n');
  const result = [];
  let depth = 0;

  for (const line of lines) {
    if (/^:::\s*(example|example-without-tabs)(\s|$)/.test(line)) {
      depth++;
      continue;
    }

    if (depth > 0 && /^:::\s*$/.test(line)) {
      depth--;
      continue;
    }

    result.push(line);
  }

  return result.join('\n');
}

/** Resolve `@[code](path)` / `@[code](highlight=…)(path)` includes to fenced code. */
function resolveCodeIncludes(content) {
  return content.replace(/@\[code\]\(([^)]*)\)(?:\(([^)]*)\))?/g, (_full, g1, g2) => {
    const hasOpts = g2 !== undefined;
    const opts = hasOpts ? g1 : '';
    const rawPath = (hasOpts ? g2 : g1).trim();

    let filePath;

    if (rawPath.startsWith('@/')) filePath = resolve(REPO_ROOT, rawPath.slice(2));
    else if (rawPath.startsWith('/')) filePath = resolve(REPO_ROOT, rawPath.slice(1));
    else filePath = resolve(REPO_ROOT, rawPath);

    const ext = (rawPath.split('.').pop() || '').toLowerCase();
    const lang = EXT_LANG[ext] || ext || '';
    const hl = opts.match(/highlight=([0-9,\-]+)/);
    const meta = hl ? ` {${hl[1]}}` : '';

    let code;

    try {
      code = readFileSync(filePath, 'utf8').replace(/\s+$/, '');
    } catch {
      // eslint-disable-next-line no-console
      console.warn(`[generate-content] missing @[code] include: ${rawPath}`);
      return '';
    }

    return `\`\`\`${lang}${meta}\n${code}\n\`\`\``;
  });
}

/** `::: details Title` → `<details><summary>Title</summary>…</details>`. */
function convertDetailsContainers(content) {
  const lines = content.split('\n');
  const result = [];
  let depth = 0;

  for (const line of lines) {
    const open = line.match(/^:{3,}\s+details\s+(.+)$/);

    if (open) {
      depth++;
      result.push('<details>', `<summary>${open[1].trim()}</summary>`, '');
      continue;
    }

    if (depth > 0 && /^:{3,}\s*$/.test(line)) {
      depth--;
      result.push('', '</details>');
      continue;
    }

    result.push(line);
  }

  return result.join('\n');
}

/** Rewrite internal `.md`/`.html`/relative links to clean, base-aware URLs. */
function rewriteLinks(content, slug) {
  const lines = content.split('\n');
  let inFence = false;
  let inFrontmatter = lines[0] === '---';

  return lines
    .map((line, i) => {
      if (inFrontmatter) {
        if (i > 0 && /^---\s*$/.test(line)) inFrontmatter = false;
        return line;
      }

      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return line;
      }

      if (inFence) return line;

      return rewriteInlineLinks(line, slug);
    })
    .join('\n');
}

function rewriteInlineLinks(line, slug) {
  const codeSpans = [];
  let masked = line.replace(/`[^`]*`/g, (m) => {
    codeSpans.push(m);
    return `  ${codeSpans.length - 1}  `;
  });

  masked = masked.replace(
    /(!?)\[([^\]]*)\]\(([^)\s]+)(\s+"[^"]*")?\)/g,
    (full, bang, text, href, title) => {
      const rewritten = rewriteHref(href, slug, bang === '!');

      return rewritten === null ? full : `${bang}[${text}](${rewritten}${title || ''})`;
    }
  );

  return masked.replace(/  (\d+)  /g, (_m, i) => codeSpans[Number(i)]);
}

function rewriteHref(href, slug, isImage) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//') || href.startsWith('#')) {
    return null;
  }

  // Images: only fix root-absolute asset paths to be base-aware.
  if (isImage) {
    return href.startsWith('/') ? `${BASE}${href}` : null;
  }

  const hashIdx = href.indexOf('#');
  let pathPart = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
  const anchor = hashIdx >= 0 ? href.slice(hashIdx) : '';

  if (pathPart === '') return null;

  const isDocLink =
    /\.(md|html)$/i.test(pathPart) ||
    pathPart.startsWith('./') ||
    pathPart.startsWith('../') ||
    pathPart.startsWith('/') ||
    /^(guide|api)(\/|$)/.test(pathPart); // bare relative doc links, e.g. api/ or guide/x

  if (!isDocLink) return null;

  pathPart = pathPart.replace(/\.(md|html)$/i, '');

  let absSlug;

  if (pathPart.startsWith('/')) {
    absSlug = pathPart.replace(/^\/+/, '');
  } else {
    const dir = slug.includes('/') ? slug.slice(0, slug.lastIndexOf('/')) : '';
    absSlug = posix.normalize(posix.join(dir, pathPart));
  }

  if (absSlug.startsWith('..')) return null;

  absSlug = absSlug.replace(/\/?(index|README)$/i, '');
  absSlug = slugifyPath(absSlug);

  const out = `${BASE}/${absSlug}`.replace(/\/+$/, '') || `${BASE}/`;

  // Strip TypeDoc badge tokens from anchors. Our heading transform removes the
  // `<Badge text="Static"/>` etc. from API headings, so the rendered heading id
  // is just the member name. TypeDoc still generates cross-link anchors with
  // the badge text baked in (either as a `static-X` prefix or `X-static`
  // suffix). Normalize both forms to match our clean heading ids.
  return `${out}${cleanBadgeAnchor(anchor)}`;
}

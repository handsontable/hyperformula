#!/usr/bin/env node
/**
 * extract-doc-snippets.js — extract documented code snippets so tests can
 * import the same source-of-truth the docs publish.
 *
 * Walks `docs/**\/*.md`. For every snippet block of the form
 *
 *     <!-- snippet:NAME -->
 *     ```<lang>
 *     // code …
 *     ```
 *     <!-- /snippet:NAME -->
 *
 * writes the code to `test-utils/snippets/<NAME>.generated.ts` with a header
 * banner naming the source file. Tests then `import { … }` from the
 * generated file instead of re-defining the snippet inline. The generated
 * files are NOT committed: they are regenerated from the docs before every
 * test run via the `pretest:*` hooks in package.json, which keeps the docs as
 * the single source of truth and avoids duplicating the snippet code in the
 * repository.
 *
 * **Generated content vs docs source.** The generated `.ts` is functionally
 * equivalent to the docs snippet but NOT byte-identical: `stripBlockComments`
 * removes lines whose entire content is a `//` comment (e.g. editorial
 * section dividers) before writing. Trailing `// comment` after live code is
 * preserved. The docs page keeps the educational comments for human readers;
 * the generated artifact keeps only the runnable surface for the import
 * consumer.
 *
 * The script intentionally has zero npm deps so it runs in the same Node we
 * use for `compile` without adding to package.json.
 *
 * Constraints:
 *   - Snippet bodies must NOT contain nested triple-backtick fences. The
 *     closing fence matcher accepts any `^```\s*$` line, so a nested fenced
 *     block inside a snippet would terminate the outer match early.
 *   - Symlinks under `docs/` are not followed (loop / sandbox-escape guard).
 *   - Recursion depth is capped at MAX_DEPTH to prevent runaway walks.
 *   - File enumeration order is stabilised via sort() so generated content
 *     is byte-identical across platforms (CI-determinism).
 *
 * Exit codes:
 *   0 — snippets extracted successfully (or no markers present)
 *   1 — any structural error: malformed marker, mismatched markers,
 *       duplicate name, fence opened-but-not-closed, marker mismatch,
 *       or missing docs dir
 */
'use strict'

const fs = require('fs')
const path = require('path')

const REPO_ROOT = path.resolve(__dirname, '..')
const DOCS_DIR = path.join(REPO_ROOT, 'docs')
const OUT_DIR = path.join(REPO_ROOT, 'test-utils', 'snippets')
const MAX_DEPTH = 8

/**
 * Recursively list every `.md` file under `dir`. Skips symlinks and bails
 * past MAX_DEPTH so a stray loop under `docs/` can't hang the build.
 * Entries are sorted at every level for deterministic ordering across
 * platforms / filesystems.
 */
function listMarkdown(dir, depth = 0) {
  if (depth > MAX_DEPTH) {
    console.error(`extract-doc-snippets: depth limit (${MAX_DEPTH}) exceeded under ${dir} — refusing to recurse further`)
    return []
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => !e.isSymbolicLink())  // never follow symlinks
    .sort((a, b) => a.name.localeCompare(b.name))
  const out = []
  for (const entry of entries) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listMarkdown(p, depth + 1))
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(p)
  }
  return out
}

/** Throw with a precise diagnostic when a line looks like a snippet marker
 *  but doesn't match the strict grammar (open or close). Catches typos such
 *  as `<!--snippet:foo-->` (no spaces) which the strict regex skips silently. */
const malformedSniffRe = /<!--\s*\/?\s*snippet\b/i

/** Parse a markdown file and yield { name, lang, code, sourceFile, line }. */
function * extractSnippets(filePath) {
  const text = fs.readFileSync(filePath, 'utf8')
  const lines = text.split('\n')
  const openRe = /^<!--\s+snippet:([a-zA-Z][a-zA-Z0-9_-]*)\s+-->\s*$/
  const closeRe = /^<!--\s+\/snippet:([a-zA-Z][a-zA-Z0-9_-]*)\s+-->\s*$/
  const fenceRe = /^```([a-zA-Z0-9]*)\s*$/

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const openMatch = openRe.exec(line)
    if (!openMatch) {
      // Distinguish "not a marker at all" from "looks like a malformed marker".
      if (malformedSniffRe.test(line) && !closeRe.exec(line)) {
        throw new Error(
          `${filePath}:${i + 1} — line looks like a snippet marker but doesn't match the grammar. ` +
          `Required form: \`<!-- snippet:NAME -->\` (note the spaces around the marker body). ` +
          `Got: \`${line.trim()}\``,
        )
      }
      i++
      continue
    }

    const name = openMatch[1]
    const startLine = i + 1
    let j = i + 1
    // Skip blank lines between marker and fence.
    while (j < lines.length && lines[j].trim() === '') j++
    const fenceOpen = fenceRe.exec(lines[j])
    if (!fenceOpen) {
      throw new Error(`${filePath}:${startLine} — snippet:${name} marker not followed by a fenced code block`)
    }
    const lang = fenceOpen[1] || 'ts'
    const codeStart = j + 1
    let k = codeStart
    while (k < lines.length && !/^```\s*$/.test(lines[k])) k++
    if (k >= lines.length) {
      throw new Error(`${filePath}:${startLine} — snippet:${name} fence opened but never closed`)
    }
    // Find closing snippet marker after the fence close.
    let m = k + 1
    while (m < lines.length && lines[m].trim() === '') m++
    const closeMatch = m < lines.length ? closeRe.exec(lines[m]) : null
    if (!closeMatch) {
      throw new Error(`${filePath}:${startLine} — snippet:${name} missing closing <!-- /snippet:${name} --> after fence`)
    }
    if (closeMatch[1] !== name) {
      throw new Error(`${filePath}:${m + 1} — close marker /snippet:${closeMatch[1]} does not match open snippet:${name}`)
    }

    yield {
      name,
      lang,
      code: lines.slice(codeStart, k).join('\n'),
      sourceFile: path.relative(REPO_ROOT, filePath),
      line: startLine,
    }
    i = m + 1
  }
}

/**
 * Strip pure-comment lines from the snippet body.
 *
 * Editorial `//` comments in the docs snippet (e.g. `// EUR (generic)`,
 * `// $#,##0.00 — USD shorthand`) are useful in the published page where
 * a reader is studying the code, but they add noise in the generated test
 * artifact where a downstream `import` consumer only cares about the
 * functional code. We strip lines that contain ONLY whitespace + `//
 * comment` (block-level). Trailing `// comment` after live code is left
 * alone — that case needs a JS-aware tokenizer to avoid clobbering URL
 * literals like `'https://…'`, and the noise reduction from block-level
 * stripping alone is already significant. Collapses runs of resulting
 * blank lines to a single blank for readability.
 */
function stripBlockComments(code) {
  const lines = code.split('\n')
  const blockCommentRe = /^\s*\/\/.*$/
  const kept = lines.filter((ln) => !blockCommentRe.test(ln))
  // Collapse 2+ consecutive blank lines into 1 — keeps section breaks but
  // avoids the "every comment was here" gaps the strip would otherwise leave.
  const out = []
  let prevBlank = false
  for (const ln of kept) {
    const isBlank = ln.trim() === ''
    if (isBlank && prevBlank) continue
    out.push(ln)
    prevBlank = isBlank
  }
  return out.join('\n')
}

/** Render the generated file with a stable header banner. */
function render({ name, lang, code, sourceFile, line }) {
  const banner = [
    '// Auto-generated by script/extract-doc-snippets.js — DO NOT EDIT.',
    `// Source: ${sourceFile}:${line} (snippet:${name})`,
    '// Edit the source markdown — this file is regenerated before every test',
    '// run (the `pretest:*` hooks) and is not committed to the repository.',
    '',
    // Docs snippets are written in JS without TypeScript annotations (they
    // need to copy-paste runnable for the reader). The .ts extension lets
    // consumers `import { … }` without a tsconfig.allowJs change, but the
    // body is intentionally untyped — `@ts-nocheck` keeps tsc quiet without
    // forcing every snippet author to learn TypeScript.
    '// @ts-nocheck',
    '',
  ].join('\n')
  const body = stripBlockComments(code)
  return banner + body + (body.endsWith('\n') ? '' : '\n')
}

/** Remove `*.generated.ts` files in OUT_DIR that aren't in `keep`. */
function pruneOrphans(keep) {
  if (!fs.existsSync(OUT_DIR)) return []
  const removed = []
  for (const name of fs.readdirSync(OUT_DIR).sort()) {
    if (!name.endsWith('.generated.ts')) continue
    if (keep.has(name)) continue
    fs.unlinkSync(path.join(OUT_DIR, name))
    removed.push(path.relative(REPO_ROOT, path.join(OUT_DIR, name)))
  }
  return removed
}

function main() {
  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`extract-doc-snippets: docs dir not found at ${DOCS_DIR}`)
    process.exit(1)
  }
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const seen = new Map()
  const written = []
  const keepBasenames = new Set()
  for (const file of listMarkdown(DOCS_DIR)) {
    for (const snippet of extractSnippets(file)) {
      if (seen.has(snippet.name)) {
        const prev = seen.get(snippet.name)
        console.error(`extract-doc-snippets: duplicate snippet name "${snippet.name}"`)
        console.error(`  first:  ${prev.sourceFile}:${prev.line}`)
        console.error(`  second: ${snippet.sourceFile}:${snippet.line}`)
        process.exit(1)
      }
      seen.set(snippet.name, snippet)
      const basename = `${snippet.name}.generated.ts`
      const outPath = path.join(OUT_DIR, basename)
      fs.writeFileSync(outPath, render(snippet))
      written.push(path.relative(REPO_ROOT, outPath))
      keepBasenames.add(basename)
    }
  }

  const removed = pruneOrphans(keepBasenames)

  if (written.length === 0 && removed.length === 0) {
    console.log('extract-doc-snippets: no <!-- snippet:NAME --> blocks found')
    return
  }
  if (written.length > 0) {
    console.log(`extract-doc-snippets: wrote ${written.length} file(s)`)
    for (const w of written) console.log(`  ${w}`)
  }
  if (removed.length > 0) {
    console.log(`extract-doc-snippets: pruned ${removed.length} orphan(s)`)
    for (const r of removed) console.log(`  - ${r}`)
  }
}

main()

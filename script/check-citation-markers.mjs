#!/usr/bin/env node
/**
 * Fails when a citation marker from a draft document appears in the engine's
 * build output or in the documentation.
 *
 * The markers are `[V<n>]`, `[<prefix>_<n>]` with the prefix `vrf`, `dec`,
 * `con`, `que`, `wrg` or `crf`, and the footer heading `§AuditSources`. A source
 * comment survives into `commonjs/`, `es/`, the development bundle in `dist/`
 * and the `sourcesContent` of the source maps in `dist/`, so every file of the
 * output is scanned, not only the minified bundles.
 *
 * Run it after `npm run docs:build`, which builds both the engine and the docs.
 * A path that is missing or holds no files fails the check instead of being
 * skipped, so a moved output directory cannot turn it into a scan of nothing.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** The engine's build output and the documentation, relative to the repository root. */
const SCANNED = [
  'hyperformula/commonjs',
  'hyperformula/dist',
  'hyperformula/es',
  'hyperformula/languages',
  'hyperformula/typings',
  'docs/api',
  'docs/guide',
]

const MARKER = /\[(?:V\d+|(?:vrf|dec|con|que|wrg|crf)_\d+)\]|§\s*AuditSources/g

/** Checked before every scan, so a broken pattern fails instead of finding nothing. */
const MUST_MATCH = ['[V3]', '[vrf_1]', '[dec_2]', '[con_3]', '[que_4]', '[wrg_5]', '[crf_6]', '§AuditSources', '§ AuditSources']
const MUST_NOT_MATCH = ['[V]', '[v1]', '[vrf_]', '[vrf_1a]', '[abc_1]', 'AuditSources', 'cells[V1']

/**
 * Prints an error and exits with code 2, which means the scan could not run.
 *
 * @param {string} message What went wrong.
 */
function abort(message) {
  console.error(`ERROR: ${message}`)
  process.exit(2)
}

/**
 * Lists every file under a directory.
 *
 * @param {string} dir Absolute path of the directory.
 * @returns {string[]} Absolute paths of the files.
 */
function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return listFiles(full)
    }
    return entry.isFile() ? [full] : []
  })
}

for (const sample of MUST_MATCH) {
  if (!sample.match(MARKER)) {
    abort(`the marker pattern does not match ${sample}`)
  }
}
for (const sample of MUST_NOT_MATCH) {
  if (sample.match(MARKER)) {
    abort(`the marker pattern matches ${sample}, which is not a marker`)
  }
}

const hits = []
let fileCount = 0
for (const relative of SCANNED) {
  const dir = path.join(REPO_ROOT, relative)
  let isDirectory = false
  try {
    isDirectory = statSync(dir).isDirectory()
  } catch {
    abort(`${relative} does not exist. Build the engine and the docs first: npm run docs:build`)
  }
  if (!isDirectory) {
    abort(`${relative} is not a directory`)
  }
  const files = listFiles(dir)
  if (files.length === 0) {
    abort(`${relative} contains no files`)
  }
  console.log(`${relative}: ${files.length} files`)
  fileCount += files.length
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    for (const match of text.matchAll(MARKER)) {
      const line = text.slice(0, match.index).split('\n').length
      hits.push(`${path.relative(REPO_ROOT, file)}:${line}: ${match[0]}`)
    }
  }
}

if (hits.length > 0) {
  console.error(hits.join('\n'))
  console.error(`\nERROR: ${hits.length} citation markers found. Remove them from the source comments or strings they come from.`)
  process.exit(1)
}
console.log(`No citation markers in ${fileCount} files.`)

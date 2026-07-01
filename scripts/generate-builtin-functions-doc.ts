/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * HF-249 bullet 3 — generates the built-in functions table in `docs/guide/built-in-functions.md` from
 * HyperFormula's public API (single source of truth). Dev-only; never shipped (`tsconfig.json` `include` is
 * `["src"]`). Run: `npm run tsnode scripts/generate-builtin-functions-doc.ts` (writes the file) or
 * `... --check` (CI: regenerate in memory, fail on drift / membership mismatch, write nothing).
 */

import * as fs from 'fs'
import * as path from 'path'
import {HyperFormula} from '../src'
import {renderBuiltinFunctionsTable, spliceFunctionsTable} from '../src/interpreter/functionMetadata/renderBuiltinFunctionsTable'

const REPO_ROOT = path.resolve(__dirname, '..')
const DOC_PATH = path.join(REPO_ROOT, 'docs/guide/built-in-functions.md')
const LANGUAGE = 'enGB'

/** Reads the doc file and returns a new version with the generated table region spliced in. */
function buildUpdatedFile(): string {
  const entries = HyperFormula.getAvailableFunctions(LANGUAGE)
  const detailsFor = (canonicalName: string) => HyperFormula.getFunctionDetails(canonicalName, LANGUAGE)
  const generated = renderBuiltinFunctionsTable(entries, detailsFor)
  const current = fs.readFileSync(DOC_PATH, 'utf8')
  return spliceFunctionsTable(current, generated)
}

/** Writes the regenerated file (default) or exits non-zero if the file is out of date (`--check`). */
function main(): void {
  const check = process.argv.includes('--check')
  const updated = buildUpdatedFile()
  const current = fs.readFileSync(DOC_PATH, 'utf8')
  if (check) {
    // Function IDs live in the per-function anchors (`<a id="SUM"></a>`), §3.1.4.
    const idsIn = (text: string) => new Set(
      [...text.matchAll(/<a id="([^"]+)"><\/a>/g)].map(match => match[1])
    )
    const generatedIds = idsIn(updated)
    const currentIds = idsIn(current)
    const dropped = [...currentIds].filter(id => !generatedIds.has(id))
    const added = [...generatedIds].filter(id => !currentIds.has(id))
    if (dropped.length > 0 || added.length > 0) {
      process.stderr.write(`Function set changed. dropped=[${dropped}] added=[${added}]\n`)
      process.exit(1)
    }
    if (updated !== current) {
      process.stderr.write('built-in-functions.md is out of date. Run `npm run docs:generate-functions`.\n')
      process.exit(1)
    }
    process.stdout.write('built-in-functions.md is up to date.\n')
    return
  }
  fs.writeFileSync(DOC_PATH, updated, 'utf8')
  process.stdout.write('built-in-functions.md regenerated.\n')
}

main()

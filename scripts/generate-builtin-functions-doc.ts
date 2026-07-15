/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * HF-249 bullet 3 — generates the built-in functions table in `docs/guide/built-in-functions.md` from
 * HyperFormula's public API (single source of truth). Dev-only; never shipped (`tsconfig.json` `include` is
 * `["src"]`). Run via `npm run docs:generate-functions`; it also runs as the first step of `docs:build` and
 * `docs:dev`, so the committed table is regenerated on every build and cannot drift from the catalogue.
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

/** Regenerates the table region of the doc file from the current catalogue. */
function main(): void {
  fs.writeFileSync(DOC_PATH, buildUpdatedFile(), 'utf8')
  process.stdout.write('built-in-functions.md regenerated.\n')
}

main()

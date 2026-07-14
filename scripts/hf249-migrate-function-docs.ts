/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * HF-249 — function metadata migration tool (dev-only; never shipped, because `tsconfig.json` `include`
 * is restricted to `["src"]`).
 *
 * Regenerates the per-category `FunctionDoc` catalogue files under
 * `src/interpreter/functionMetadata/categories/` (and their `index.ts` barrel) from
 * `docs/guide/built-in-functions.md`:
 *
 *   - the canonical id set is taken from `implementedFunctions` (aliases and protected ids are excluded);
 *   - `category` and `shortDescription` come from the doc table's "Function ID" section and "Description" column;
 *   - parameter names come from the "Syntax" column, but their COUNT and optionality are governed by the
 *     implementation arity — the syntax column is only a (sometimes dirty) source of human-readable names.
 *
 * Run with: `npm run tsnode scripts/hf249-migrate-function-docs.ts`
 */

import * as fs from 'fs'
import * as path from 'path'
import {HyperFormula} from '../src'
import {FUNCTION_CATEGORIES, FunctionCategory} from '../src/interpreter/functionMetadata/FunctionDescription'

const REPO_ROOT = path.resolve(__dirname, '..')
const DOC_PATH = path.join(REPO_ROOT, 'docs/guide/built-in-functions.md')
const CATEGORIES_DIR = path.join(REPO_ROOT, 'src/interpreter/functionMetadata/categories')
const INDEX_PATH = path.join(REPO_ROOT, 'src/interpreter/functionMetadata/index.ts')

/** Parameter names the documentation under-specifies relative to the implementation arity (already snake_case). */
const PARAMETER_NAME_OVERRIDES: Record<string, string[]> = {
  'T.TEST': ['array1', 'array2', 'tails', 'type'],
}

/**
 * Word-segmentation fixes for parameter tokens the documentation writes as a single run-on word (e.g. `Sumrange`),
 * so they read consistently with their multi-word siblings (`Sum_Range` -> `sum_range`). Keyed by the mechanically
 * snake-cased token; the value is the corrected snake_case name.
 */
const SNAKE_CASE_SEGMENTATION: Record<string, string> = {
  sumrange: 'sum_range',
  searchcriterion: 'search_criterion',
  logicalvalue: 'logical_value',
  datestring: 'date_string',
  timestring: 'time_string',
  startdate: 'start_date',
  minimumlength: 'minimum_length',
  lowerbound: 'lower_bound',
  upperbound: 'upper_bound',
  numberx: 'number_x',
  numbery: 'number_y',
}

/**
 * Converts a raw parameter name to snake_case: lowercase words joined by underscores, with camelCase/PascalCase and
 * acronym boundaries split, existing separators unified, and trailing digits kept attached to their word
 * (`Number1`, `Number_1` -> `number1`). A small segmentation table then fixes run-on tokens the docs left unsplit.
 *
 * @param {string} name - the raw parameter name from the syntax column
 */
export function toSnakeCase(name: string): string {
  const mechanical = name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/[\s.\-]+/g, '_')
    .toLowerCase()
    .replace(/_+(\d)/g, '$1')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  return SNAKE_CASE_SEGMENTATION[mechanical] ?? mechanical
}

interface DocRow {
  category: FunctionCategory,
  description: string,
  syntax: string,
}

/** Maps each documented function id to its category, description and raw syntax (first occurrence wins). */
function parseDoc(): Map<string, DocRow> {
  const markdown = fs.readFileSync(DOC_PATH, 'utf8')
  const rows = new Map<string, DocRow>()
  let category: FunctionCategory | null = null
  for (const line of markdown.split('\n')) {
    const header = /^### (.+?)\s*$/.exec(line)
    if (header) {
      category = (FUNCTION_CATEGORIES as readonly string[]).includes(header[1]) ? header[1] as FunctionCategory : null
      continue
    }
    if (category && line.startsWith('|') && !/^\|\s*:?-+/.test(line)) {
      const cells = line.split('|').map(cell => cell.trim())
      const id = cells[1]
      if (!id || id === 'Function ID' || rows.has(id)) {
        continue
      }
      rows.set(id, {category, description: cells[2] ?? '', syntax: cells[3] ?? ''})
    }
  }
  return rows
}

/** Extracts trimmed parameter names from a syntax string, dropping optional brackets, quotes and ellipsis markers. */
function parseSyntaxNames(syntax: string): string[] {
  const open = syntax.indexOf('(')
  const close = syntax.lastIndexOf(')')
  if (open < 0 || close < 0) {
    return []
  }
  const inner = syntax.slice(open + 1, close).replace(/[[\]]/g, '')
  return inner
    .split(',')
    .map(part => part.trim().replace(/^"|"$/g, '').replace(/^\.+/, '').trim())
    .filter(part => part.length > 0)
}

/** Disambiguates repeated names (e.g. `[Number, Number]` -> `[Number1, Number2]`) so every name is unique. */
function uniquify(names: string[]): string[] {
  const totals: Record<string, number> = {}
  for (const name of names) {
    totals[name] = (totals[name] ?? 0) + 1
  }
  const seen: Record<string, number> = {}
  return names.map(name => {
    if (totals[name] > 1) {
      seen[name] = (seen[name] ?? 0) + 1
      return `${name}${seen[name]}`
    }
    return name
  })
}

/**
 * Produces exactly `arity` unique, non-empty snake_case parameter names. The syntax column lists
 * `Name1, Name2, ...NameN` for repeating groups, so the first `arity` names already collapse those groups onto the
 * implementation arity; each is normalized to snake_case and any shortfall is padded with `arg1`, `arg2`, ...
 */
function deriveParameterNames(id: string, syntax: string, arity: number): string[] {
  const override = PARAMETER_NAME_OVERRIDES[id]
  if (override !== undefined) {
    if (override.length !== arity) {
      throw new Error(`Override for ${id} has ${override.length} names but the implementation arity is ${arity}`)
    }
    return override
  }
  const names = parseSyntaxNames(syntax).slice(0, arity).map(toSnakeCase)
  while (names.length < arity) {
    names.push(`arg${names.length + 1}`)
  }
  return uniquify(names)
}

/** The category's file name, e.g. `'Math and trigonometry'` -> `'math-and-trigonometry'`. */
function kebabCase(category: string): string {
  return category.toLowerCase().replace(/\s+/g, '-')
}

/** The category's exported constant name, e.g. `'Math and trigonometry'` -> `'MATH_AND_TRIGONOMETRY_DOCS'`. */
function constName(category: string): string {
  return `${category.toUpperCase().replace(/\s+/g, '_')}_DOCS`
}

/** Renders a single-quoted TypeScript string literal, escaping backslashes and single quotes. */
function asStringLiteral(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'')}'`
}

/** Renders an object key: a bare identifier where valid, otherwise a quoted string (e.g. `'HF.ADD'`). */
function asKey(id: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(id) ? id : asStringLiteral(id)
}

const LICENSE = `/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */`

interface Entry {
  id: string,
  description: string,
  names: string[],
}

/** Renders the source of one `categories/<kebab>.ts` file, with entries sorted by canonical id. */
function emitCategoryFile(category: FunctionCategory, entries: Entry[]): string {
  const body = [...entries].sort((a, b) => a.id.localeCompare(b.id)).map(entry => {
    const params = entry.names.map(name => `{name: ${asStringLiteral(name)}, description: ''}`).join(', ')
    return `  ${asKey(entry.id)}: {
    category: ${asStringLiteral(category)},
    shortDescription: ${asStringLiteral(entry.description)},
    parameters: [${params}],
  },`
  }).join('\n')
  return `${LICENSE}

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "${category}" category. Generated from \`docs/guide/built-in-functions.md\` by
 * \`scripts/hf249-migrate-function-docs.ts\`; parameter descriptions are authored in a later phase.
 */
export const ${constName(category)}: Record<string, FunctionDoc> = {
${body}
}
`
}

/** Renders the source of the `index.ts` barrel that composes every category file into `FUNCTION_DOCS`. */
function emitIndex(categories: FunctionCategory[]): string {
  const ordered = [...categories].sort((a, b) => kebabCase(a).localeCompare(kebabCase(b)))
  const imports = ordered.map(category => `import {${constName(category)}} from './categories/${kebabCase(category)}'`).join('\n')
  const spreads = ordered.map(category => `  ...${constName(category)},`).join('\n')
  return `${LICENSE}

import {FunctionDoc} from './FunctionDescription'
${imports}

export * from './FunctionDescription'

/**
 * Canonical-id-keyed catalogue of human-readable function metadata, composed from the per-category files.
 * Generated by \`scripts/hf249-migrate-function-docs.ts\`. Coverage of the whole canonical set is enforced by test.
 */
export const FUNCTION_DOCS: Record<string, FunctionDoc> = {
${spreads}
}
`
}

/** Reads the docs and implementation arity, derives every entry, and writes the category files and barrel. */
function main(): void {
  const arityById = new Map<string, number>()
  for (const plugin of HyperFormula.getAllFunctionPlugins()) {
    const impl = plugin.implementedFunctions
    for (const id of Object.keys(impl)) {
      arityById.set(id, (impl[id].parameters ?? []).length)
    }
  }

  const docRows = parseDoc()
  const byCategory = new Map<FunctionCategory, Entry[]>()
  const missing: string[] = []

  for (const id of arityById.keys()) {
    const row = docRows.get(id)
    if (row === undefined) {
      missing.push(id)
      continue
    }
    const names = deriveParameterNames(id, row.syntax, arityById.get(id) as number)
    const list = byCategory.get(row.category) ?? []
    list.push({id, description: row.description, names})
    byCategory.set(row.category, list)
  }

  if (missing.length > 0) {
    throw new Error(`No documentation row for canonical ids: ${missing.join(', ')}`)
  }

  const categories = [...byCategory.keys()]
  for (const category of categories) {
    const file = path.join(CATEGORIES_DIR, `${kebabCase(category)}.ts`)
    fs.writeFileSync(file, emitCategoryFile(category, byCategory.get(category) as Entry[]))
    console.log(`wrote ${path.relative(REPO_ROOT, file)} (${(byCategory.get(category) as Entry[]).length})`)
  }
  fs.writeFileSync(INDEX_PATH, emitIndex(categories))

  const total = categories.reduce((sum, category) => sum + (byCategory.get(category) as Entry[]).length, 0)
  console.log(`wrote ${path.relative(REPO_ROOT, INDEX_PATH)}; ${total} functions across ${categories.length} categories`)
}

// Only regenerate when executed directly; guarded so helpers (e.g. `toSnakeCase`) can be imported without side effects.
if (require.main === module) {
  main()
}

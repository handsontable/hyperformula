/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionRegistry} from '../interpreter/FunctionRegistry'
import {FeatureId} from './LicenseEntitlement'

/**
 * The always-granted token. Every entitlement built from a license key includes it.
 *
 * It grants the calculation operators and the whole gated public API surface — see
 * {@link CORE_FEATURES} for why the features live here rather than on a package.
 */
export const CORE_TOKEN = 'core'

/** Math engine package — the free tier's function set. */
export const FUNCTIONS_1_TOKEN = 'functions_1'
/** Calculated fields package. Cumulative: includes {@link FUNCTIONS_1_TOKEN}'s functions. */
export const FUNCTIONS_2_TOKEN = 'functions_2'
/** Spreadsheet package. Cumulative: includes {@link FUNCTIONS_2_TOKEN}'s functions. */
export const FUNCTIONS_3_TOKEN = 'functions_3'
/** Excel simulator package — the entire implemented catalog. */
export const FUNCTIONS_4_TOKEN = 'functions_4'
/** Spreadsheet add-on. Reserved: recognized, grants nothing yet — see {@link CAPABILITY_TABLE}. */
export const SPREADSHEET_ADDON_TOKEN = 'spreadsheet'
/** Import/export add-on. Reserved until HF-107 ships the feature it would gate. */
export const IMPORT_EXPORT_ADDON_TOKEN = 'import_export'

/**
 * Describes what a capability token grants: a set of function ids, a set of {@link FeatureId}
 * values, and optionally other tokens it implies. `implies` is expanded recursively by
 * `CapabilityRegistry.resolve`, not by anything in this file.
 */
export interface CapabilityGrant {
  functions: string[],
  features: FeatureId[],
  implies?: string[],
}

/**
 * The calculation operators and their `HF.*` callable forms. Always available in every package —
 * the packaging design counts them as engine baseline and advertises them separately from the
 * function totals, so they are granted by {@link CORE_TOKEN} rather than by any package.
 */
const OPERATOR_FUNCTIONS = [
  'HF.ADD', 'HF.CONCAT', 'HF.DIVIDE', 'HF.EQ', 'HF.GT', 'HF.GTE', 'HF.LT', 'HF.LTE', 'HF.MINUS',
  'HF.MULTIPLY', 'HF.NE', 'HF.POW', 'HF.UMINUS', 'HF.UNARY_PERCENT', 'HF.UPLUS',
]

/**
 * The features {@link CORE_TOKEN} grants — which is all of them.
 *
 * No package restricts the public API surface in this draft, deliberately. The packaging
 * evidence covers FUNCTIONS only; nothing has decided whether, say, undo/redo or the clipboard
 * belongs to a paid tier. Restricting one here would both invent a product decision and make
 * PR 2's `ensureCapability` start throwing from the CRUD API for real keys, so the conservative
 * choice is to grant them all until that decision exists.
 */
const CORE_FEATURES = [
  FeatureId.NamedExpressions, FeatureId.Clipboard, FeatureId.Crud, FeatureId.UndoRedo, FeatureId.Batching,
]

/**
 * Package membership, as the LOWEST package that includes each function.
 *
 * Transcribed from the packaging design's own per-function evidence file. The lists reproduce
 * that file's package counts exactly (17 / 51 / 127 / 355 cumulative, plus 15 operators), which
 * is how the transcript was checked; `capability-table.spec.ts` pins those counts so a later
 * edit cannot drift from them silently.
 *
 * Two functions of the evidence file are deliberately absent: `OFFSET` and `VERSION` are
 * protected built-ins and sit OUTSIDE the token system — the interpreter never gate-checks a
 * protected function, so listing them would be dead weight that implies a restriction that does
 * not exist.
 *
 * **This membership is a DRAFT and is expected to change before release.** The packaging design
 * it follows is still under review, with the free tier's exact contents and the placement of
 * several function families among the points not yet settled.
 */
const MATH_ENGINE_FUNCTIONS = [
  'ABS', 'CEILING', 'EXP', 'FLOOR', 'IF', 'LN', 'LOG', 'LOG10', 'MOD', 'POWER', 'PRODUCT', 'ROUND',
  'ROUNDDOWN', 'ROUNDUP', 'SQRT', 'SUM',
]

/** Added by the calculated-fields package, on top of {@link MATH_ENGINE_FUNCTIONS}. */
const CALCULATED_FIELDS_FUNCTIONS = [
  'AND', 'AVERAGE', 'CONCATENATE', 'COUNT', 'DATE', 'DATEDIF', 'DAY', 'DAYS', 'FALSE', 'FIND', 'HOUR',
  'LEFT', 'LEN', 'LOWER', 'MAX', 'MID', 'MIN', 'MINUTE', 'MONTH', 'NOT', 'NOW', 'OR', 'RIGHT', 'SEARCH',
  'SECOND', 'TEXT', 'TEXTJOIN', 'TODAY', 'TRIM', 'TRUE', 'UPPER', 'VALUE', 'XOR', 'YEAR',
]

/** Added by the spreadsheet package, on top of {@link CALCULATED_FIELDS_FUNCTIONS}. */
const SPREADSHEET_FUNCTIONS = [
  'ADDRESS', 'AVERAGEIF', 'CHOOSE', 'COLUMN', 'COLUMNS', 'COUNTIF', 'COUNTIFS', 'DATEVALUE', 'DAYS360',
  'EDATE', 'EOMONTH', 'FILTER', 'FORMULATEXT', 'FV', 'HLOOKUP', 'HYPERLINK', 'IFERROR', 'IFNA', 'INDEX',
  'INTERVAL', 'IPMT', 'IRR', 'ISBINARY', 'ISBLANK', 'ISERR', 'ISERROR', 'ISEVEN', 'ISFORMULA', 'ISLOGICAL',
  'ISNA', 'ISNONTEXT', 'ISNUMBER', 'ISODD', 'ISOWEEKNUM', 'ISREF', 'ISTEXT', 'MATCH', 'MAXIFS', 'MINIFS',
  'NA', 'NETWORKDAYS', 'NETWORKDAYS.INTL', 'NPER', 'NPV', 'PERCENTILE.EXC', 'PERCENTILE.INC', 'PMT',
  'PPMT', 'PV', 'RAND', 'RANDBETWEEN', 'RATE', 'ROW', 'ROWS', 'SORT', 'STDEV.P', 'STDEV.S', 'STDEVA',
  'STDEVPA', 'SUMIF', 'SUMIFS', 'TIME', 'TIMEVALUE', 'UNIQUE', 'VAR.P', 'VAR.S', 'VARA', 'VARPA',
  'VLOOKUP', 'WEEKDAY', 'WEEKNUM', 'WORKDAY', 'WORKDAY.INTL', 'XLOOKUP', 'YEARFRAC',
]

const coreGrant: CapabilityGrant = {functions: [...OPERATOR_FUNCTIONS], features: [...CORE_FEATURES]}
const functions1Grant: CapabilityGrant = {functions: [...MATH_ENGINE_FUNCTIONS], features: []}
const functions2Grant: CapabilityGrant = {
  functions: [...MATH_ENGINE_FUNCTIONS, ...CALCULATED_FIELDS_FUNCTIONS], features: [],
}
const functions3Grant: CapabilityGrant = {
  functions: [...MATH_ENGINE_FUNCTIONS, ...CALCULATED_FIELDS_FUNCTIONS, ...SPREADSHEET_FUNCTIONS], features: [],
}
const functions4Grant: CapabilityGrant = {functions: [], features: []}

/**
 * The production capability table.
 *
 * The grants are stored FULLY EXPANDED rather than chained through `implies`: the packaging
 * design states the enforcement layer must not assume a hierarchy between tokens, and that the
 * commercial nesting is expressed by a bigger licence simply listing more functions. The
 * cumulative spreads above keep the source DRY without putting that hierarchy into the runtime.
 *
 * `functions_4` (the entire catalog) is filled by {@link refreshDynamicGrants} instead of being
 * listed, so it keeps covering functions added after this file was written.
 *
 * The two add-on tokens are RESERVED: recognized, so an issued key carrying one is not reported
 * as unrecognized, but granting nothing. `spreadsheet` has no agreed content yet — the packaging
 * proposal names a *package* "Spreadsheet" and the pricing task names a "Spreadsheet Bundle"
 * add-on, and it is not settled whether those are the same set; guessing would silently sell an
 * empty add-on or duplicate a whole tier. `import_export` has nothing to grant until HF-107.
 */
export const CAPABILITY_TABLE: ReadonlyMap<string, CapabilityGrant> = new Map([
  [CORE_TOKEN, coreGrant],
  [FUNCTIONS_1_TOKEN, functions1Grant],
  [FUNCTIONS_2_TOKEN, functions2Grant],
  [FUNCTIONS_3_TOKEN, functions3Grant],
  [FUNCTIONS_4_TOKEN, functions4Grant],
  [SPREADSHEET_ADDON_TOKEN, {functions: [], features: []}],
  [IMPORT_EXPORT_ADDON_TOKEN, {functions: [], features: []}],
])

/**
 * Refreshes the grants that depend on what is currently registered — today only
 * `functions_4`, the entire implemented catalog.
 *
 * Called from `CapabilityRegistry`'s constructor every time it is constructed without an explicit
 * table, not just the first time: the static registry can change after the first engine is built
 * (`HyperFormula.registerFunctionPlugin`/`unregisterFunctionPlugin` are public, documented APIs),
 * and a one-time snapshot would silently go stale for every engine built afterwards. Cheap (a
 * single array copy from an existing map's keys) and only ever runs once per `Config`/engine
 * construction, never on the per-formula hot path.
 *
 * Reading the registry at module-load time instead would capture an empty one: `src/index.ts`
 * registers the built-in plugins as a side effect of being imported, AFTER `Config` and
 * `Interpreter` — and so this module — have been fully evaluated.
 */
export function refreshDynamicGrants(): void {
  functions4Grant.functions = FunctionRegistry.getRegisteredFunctionIds()
}

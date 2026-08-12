/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FeatureId} from './LicenseEntitlement'

/**
 * The always-granted token. Every entitlement built from a license key includes it.
 *
 * It grants the calculation operators — and nothing else. In particular it grants NO features:
 * per Kuba's decision (task comment, 12.08) feature gating is real, and the gated API areas come
 * from the `feat:*` tokens below. The always-on functionality the packaging design assigns to
 * core (reads, serialization, teardown) is not behind `ensureCapability` at all.
 */
export const CORE_TOKEN = 'core'

/** Grants {@link FeatureId.Crud} — the mutating CRUD surface of the public API. */
export const CRUD_FEATURE_TOKEN = 'feat:crud'
/** Grants {@link FeatureId.UndoRedo}. */
export const UNDO_REDO_FEATURE_TOKEN = 'feat:undo_redo'
/** Grants {@link FeatureId.Clipboard}. */
export const CLIPBOARD_FEATURE_TOKEN = 'feat:clipboard'
/** Grants {@link FeatureId.NamedExpressions}. */
export const NAMED_EXPRESSIONS_FEATURE_TOKEN = 'feat:named_expressions'
/** Grants {@link FeatureId.Batching}. */
export const BATCHING_FEATURE_TOKEN = 'feat:batching'

/**
 * Every feature token, in one list, for the shipped-shape adapter: the shipped key vocabulary
 * predates feature tokens entirely, so a commercial tier is translated into its functions token
 * PLUS all of these — see `licenseTermsOf` for the reasoning.
 */
export const ALL_FEATURE_TOKENS = [
  CRUD_FEATURE_TOKEN, UNDO_REDO_FEATURE_TOKEN, CLIPBOARD_FEATURE_TOKEN,
  NAMED_EXPRESSIONS_FEATURE_TOKEN, BATCHING_FEATURE_TOKEN,
]

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

// An earlier revision granted all five features from CORE_TOKEN, which made feature gating inert
// by construction: no typed key could ever lose an API area. Kuba's call (task comment, 12.08):
// "Feature gating should work, but the legacy keys should grant all feat:* capabilities" — legacy
// keys already resolve to the unrestricted entitlement, so the carve-out costs nothing, and the
// five features moved onto their own `feat:*` tokens below.

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

/**
 * Added by the excel-simulator package, on top of {@link SPREADSHEET_FUNCTIONS} — the rest of the
 * implemented catalog.
 *
 * Enumerated rather than taken from the function registry at run time, even though "all
 * functions" would be the shorter way to say it. Reading the registry would sweep in functions
 * registered through `HyperFormula.registerFunctionPlugin`, putting a user's OWN custom function
 * into a paid package and returning `#LIC!` for it on a smaller licence — the opposite of HF-307
 * decision D1, which drops custom-function gating entirely. A function this table does not list
 * is not gated at all, which is exactly the treatment a custom function should get.
 */
const EXCEL_SIMULATOR_FUNCTIONS = [
  'ACOS', 'ACOSH', 'ACOT', 'ACOTH', 'ARABIC', 'ARRAYFORMULA', 'ARRAY_CONSTRAIN', 'ASIN', 'ASINH', 'ATAN',
  'ATAN2', 'ATANH', 'AVEDEV', 'AVERAGEA', 'BASE', 'BESSELI', 'BESSELJ', 'BESSELK', 'BESSELY', 'BETA.DIST',
  'BETA.INV', 'BIN2DEC', 'BIN2HEX', 'BIN2OCT', 'BINOM.DIST', 'BINOM.INV', 'BITAND', 'BITLSHIFT', 'BITOR',
  'BITRSHIFT', 'BITXOR', 'CEILING.MATH', 'CEILING.PRECISE', 'CHAR', 'CHISQ.DIST', 'CHISQ.DIST.RT',
  'CHISQ.INV', 'CHISQ.INV.RT', 'CHISQ.TEST', 'CLEAN', 'CODE', 'COMBIN', 'COMBINA', 'COMPLEX',
  'CONFIDENCE.NORM', 'CONFIDENCE.T', 'CORREL', 'COS', 'COSH', 'COT', 'COTH', 'COUNTA', 'COUNTBLANK',
  'COUNTUNIQUE', 'COVARIANCE.P', 'COVARIANCE.S', 'CSC', 'CSCH', 'CUMIPMT', 'CUMPRINC', 'DAVERAGE', 'DB',
  'DCOUNT', 'DCOUNTA', 'DDB', 'DEC2BIN', 'DEC2HEX', 'DEC2OCT', 'DECIMAL', 'DEGREES', 'DELTA', 'DEVSQ',
  'DGET', 'DMAX', 'DMIN', 'DOLLARDE', 'DOLLARFR', 'DPRODUCT', 'DSTDEV', 'DSTDEVP', 'DSUM', 'DVAR', 'DVARP',
  'EFFECT', 'ERF', 'ERFC', 'EVEN', 'EXACT', 'EXPON.DIST', 'F.DIST', 'F.DIST.RT', 'F.INV', 'F.INV.RT',
  'F.TEST', 'FACT', 'FACTDOUBLE', 'FISHER', 'FISHERINV', 'FLOOR.MATH', 'FLOOR.PRECISE', 'FVSCHEDULE',
  'GAMMA', 'GAMMA.DIST', 'GAMMA.INV', 'GAMMALN', 'GAUSS', 'GCD', 'GEOMEAN', 'HARMEAN', 'HEX2BIN',
  'HEX2DEC', 'HEX2OCT', 'HSTACK', 'HYPGEOM.DIST', 'IFS', 'IMABS', 'IMAGINARY', 'IMARGUMENT', 'IMCONJUGATE',
  'IMCOS', 'IMCOSH', 'IMCOT', 'IMCSC', 'IMCSCH', 'IMDIV', 'IMEXP', 'IMLN', 'IMLOG10', 'IMLOG2', 'IMPOWER',
  'IMPRODUCT', 'IMREAL', 'IMSEC', 'IMSECH', 'IMSIN', 'IMSINH', 'IMSQRT', 'IMSUB', 'IMSUM', 'IMTAN', 'INT',
  'ISPMT', 'LARGE', 'LCM', 'LOGNORM.DIST', 'LOGNORM.INV', 'MAXA', 'MAXPOOL', 'MEDIAN', 'MEDIANPOOL',
  'MINA', 'MIRR', 'MMULT', 'MROUND', 'MULTINOMIAL', 'N', 'NEGBINOM.DIST', 'NOMINAL', 'NORM.DIST',
  'NORM.INV', 'NORM.S.DIST', 'NORM.S.INV', 'OCT2BIN', 'OCT2DEC', 'OCT2HEX', 'ODD', 'PDURATION', 'PHI',
  'PI', 'POISSON.DIST', 'PROPER', 'QUARTILE.EXC', 'QUARTILE.INC', 'QUOTIENT', 'RADIANS', 'REPLACE', 'REPT',
  'ROMAN', 'RRI', 'RSQ', 'SEC', 'SECH', 'SEQUENCE', 'SERIESSUM', 'SHEET', 'SHEETS', 'SIGN', 'SIN', 'SINH',
  'SKEW', 'SKEW.P', 'SLN', 'SLOPE', 'SMALL', 'SPLIT', 'SQRTPI', 'STANDARDIZE', 'STEYX', 'SUBSTITUTE',
  'SUBTOTAL', 'SUMPRODUCT', 'SUMSQ', 'SUMX2MY2', 'SUMX2PY2', 'SUMXMY2', 'SWITCH', 'SYD', 'T', 'T.DIST',
  'T.DIST.2T', 'T.DIST.RT', 'T.INV', 'T.INV.2T', 'T.TEST', 'TAN', 'TANH', 'TBILLEQ', 'TBILLPRICE',
  'TBILLYIELD', 'TDIST', 'TRANSPOSE', 'UNICHAR', 'UNICODE', 'VSTACK', 'WEIBULL.DIST', 'XIRR', 'XNPV',
  'Z.TEST',
]

const coreGrant: CapabilityGrant = {functions: [...OPERATOR_FUNCTIONS], features: []}
const functions1Grant: CapabilityGrant = {functions: [...MATH_ENGINE_FUNCTIONS], features: []}
const functions2Grant: CapabilityGrant = {
  functions: [...MATH_ENGINE_FUNCTIONS, ...CALCULATED_FIELDS_FUNCTIONS], features: [],
}
const functions3Grant: CapabilityGrant = {
  functions: [...MATH_ENGINE_FUNCTIONS, ...CALCULATED_FIELDS_FUNCTIONS, ...SPREADSHEET_FUNCTIONS], features: [],
}
const functions4Grant: CapabilityGrant = {
  functions: [
    ...MATH_ENGINE_FUNCTIONS, ...CALCULATED_FIELDS_FUNCTIONS, ...SPREADSHEET_FUNCTIONS,
    ...EXCEL_SIMULATOR_FUNCTIONS,
  ],
  features: [],
}

/**
 * The production capability table.
 *
 * The grants are stored FULLY EXPANDED rather than chained through `implies`: the packaging
 * design states the enforcement layer must not assume a hierarchy between tokens, and that the
 * commercial nesting is expressed by a bigger licence simply listing more functions. The
 * cumulative spreads above keep the source DRY without putting that hierarchy into the runtime.
 *
 * Every grant is STATIC. Nothing here is derived from the function registry at run time, so a
 * function registered by a user through `HyperFormula.registerFunctionPlugin` can never appear in
 * a package and can never be gated — see {@link EXCEL_SIMULATOR_FUNCTIONS}. The cost is that a
 * newly implemented built-in is ungated until it is added here, which the completeness invariant
 * in `unit/license/capability-registry.spec.ts` fails on.
 *
 * The five `feat:*` tokens carry the gated API areas, one feature each, spelled after the draft
 * vocabulary in the task. A rev-5 key states them explicitly; the shipped-shape adapter grants
 * all five alongside the tier (that vocabulary predates feature tokens); legacy keys resolve to
 * the unrestricted entitlement and never consult this table.
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
  [CRUD_FEATURE_TOKEN, {functions: [], features: [FeatureId.Crud]}],
  [UNDO_REDO_FEATURE_TOKEN, {functions: [], features: [FeatureId.UndoRedo]}],
  [CLIPBOARD_FEATURE_TOKEN, {functions: [], features: [FeatureId.Clipboard]}],
  [NAMED_EXPRESSIONS_FEATURE_TOKEN, {functions: [], features: [FeatureId.NamedExpressions]}],
  [BATCHING_FEATURE_TOKEN, {functions: [], features: [FeatureId.Batching]}],
  [SPREADSHEET_ADDON_TOKEN, {functions: [], features: []}],
  [IMPORT_EXPORT_ADDON_TOKEN, {functions: [], features: []}],
])


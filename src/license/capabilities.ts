/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FeatureId} from './LicenseEntitlement'

/**
 * The always-granted token. Every entitlement built from a license key includes it.
 *
 * It grants the calculation operators — and nothing else. In particular it grants NO features:
 * per the ratified HF-307 decision feature gating is real, and the gated API areas come
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
 * Every feature token, in one list, for the opt-in rule in `licenseTermsOf`: a key naming no
 * `feat:*` token at all is granted all of these, because no key vocabulary in circulation can
 * express "no features" — see that function for the reasoning.
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
/**
 * The packaging doc's whole-catalog token — the excel-simulator package as that doc's own
 * vocabulary spells it. Grants exactly what {@link FUNCTIONS_4_TOKEN} grants.
 */
export const FUN_ALL_TOKEN = 'fun:all'
/**
 * Spreadsheet Bundle add-on (2026-08-12 packages meeting). Grants {@link FeatureId.Crud},
 * {@link FeatureId.UndoRedo}, {@link FeatureId.Clipboard} and {@link FeatureId.Batching} — see
 * {@link CAPABILITY_TABLE}.
 */
export const SPREADSHEET_ADDON_TOKEN = 'spreadsheet'
/**
 * Import/export add-on (2026-08-12 packages meeting). Grants {@link FeatureId.ImportExport}, a
 * RESERVED grant: nothing in the public API is gated on it yet, because HF-107 hasn't shipped the
 * import/export feature it would gate.
 */
export const IMPORT_EXPORT_ADDON_TOKEN = 'import_export'

/**
 * The canonical spelling of a capability token for table lookups.
 *
 * Token names are case-insensitive — the packaging doc states it outright for its `fun:*`
 * vocabulary, and tolerating case on the other tokens costs nothing since none of them collide
 * under lowercasing. Surrounding whitespace is trimmed for a sharper reason than tidiness: every
 * rule that reads a token has to read the SAME token, and a padded one used to be read two
 * different ways at once — `' feat:crud'` failed the `feat:` prefix test that decides whether a key
 * speaks the feature vocabulary, so the key was granted all five feature areas instead of the one
 * it named, while `'feat:crud '` passed that test and then missed the table, granting none.
 *
 * Normalization happens at LOOKUP, never at storage: an entitlement carries the key's own
 * spellings (they are diagnostics), and {@link CAPABILITY_TABLE} is keyed by the normalized form.
 *
 * @param {string} token - a capability token as the key spells it
 */
export function normalizeCapabilityToken(token: string): string {
  return token.trim().toLowerCase()
}

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
 * The two protected built-ins. Both are named by the packaging doc (`fun:lookup.A`, `fun:info.A`)
 * but sit OUTSIDE the token system today — the interpreter never gate-checks a protected
 * function, so granting them would be dead weight that implies a restriction that does not exist.
 * The doc calls this a "technical limitation" on both; their tokens below are recognized but
 * grant nothing.
 */
const PROTECTED_BUILT_INS = ['OFFSET', 'VERSION']

// An earlier revision granted all five features from CORE_TOKEN, which made feature gating inert
// by construction: no restricted key could ever lose an API area. The ratified rule:
// "Feature gating should work, but the legacy keys should grant all feat:* capabilities" — legacy
// keys already resolve to the unrestricted entitlement, so the carve-out costs nothing, and the
// five features moved onto their own `feat:*` tokens below.

/**
 * The 21 function groups of the packaging doc, keyed by their group tokens in normalized
 * (lowercase) spelling — the doc writes them `fun:<family>.<A|B|C>` and declares all token names
 * case-insensitive.
 *
 * Transcribed 1:1 from section 6 of the internal packaging design document ("HF function groups
 * and packages"), INCLUDING the members that resolve to no grant here: the operators (granted by
 * {@link CORE_TOKEN} instead) and the protected built-ins
 * (outside the token system, see {@link PROTECTED_BUILT_INS}). Keeping the doc's own membership
 * verbatim is what makes this map the SINGLE SOURCE OF TRUTH both token dialects read from — the
 * package slices below are DERIVED from these groups, so moving a function between groups moves
 * it in both dialects at once, and `capability-table.spec.ts` pins each group's size against the
 * doc's published counts so a re-transcription is a reviewable diff.
 *
 * The doc freezes group names as API surface: once shipped inside license keys, a rename is a
 * breaking change.
 */
export const FUNCTION_GROUPS: ReadonlyMap<string, readonly string[]> = new Map([
  ['fun:math.a', ['ABS', 'LOG', 'MOD', 'POWER', 'PRODUCT', 'ROUND', 'ROUNDDOWN', 'ROUNDUP', 'SQRT', 'SUM']],
  ['fun:stat.a', ['AVERAGE', 'COUNT', 'MAX', 'MIN']],
  ['fun:logic.a', ['IF']],
  ['fun:operator.a', [...OPERATOR_FUNCTIONS]],
  ['fun:info.a', ['VERSION']],
  ['fun:lookup.a', ['OFFSET']],
  ['fun:time.b', [
    'DATE', 'DATEDIF', 'DATEVALUE', 'DAY', 'DAYS', 'EOMONTH', 'HOUR', 'ISOWEEKNUM', 'MINUTE', 'MONTH',
    'NETWORKDAYS', 'SECOND', 'TODAY', 'WEEKDAY', 'WEEKNUM', 'WORKDAY', 'YEAR',
  ]],
  ['fun:text.b', [
    'CONCATENATE', 'EXACT', 'LEFT', 'LEN', 'LOWER', 'MID', 'REPLACE', 'REPT', 'RIGHT', 'SEARCH',
    'SUBSTITUTE', 'TEXT', 'TRIM', 'UPPER', 'VALUE',
  ]],
  ['fun:logic.b', ['AND', 'FALSE', 'IFS', 'NOT', 'OR', 'SWITCH', 'TRUE', 'XOR']],
  ['fun:math.b', ['RAND', 'RANDBETWEEN', 'SUMIF', 'SUMIFS']],
  ['fun:stat.b', ['AVERAGEIF', 'COUNTIF', 'STDEV.S']],
  ['fun:lookup.c', [
    'ADDRESS', 'CHOOSE', 'COLUMN', 'COLUMNS', 'FILTER', 'HLOOKUP', 'HSTACK', 'HYPERLINK', 'INDEX', 'MATCH',
    'ROW', 'ROWS', 'SORT', 'TRANSPOSE', 'UNIQUE', 'VLOOKUP', 'VSTACK', 'XLOOKUP',
  ]],
  ['fun:math.c', [
    'ACOS', 'ASIN', 'ATAN', 'ATAN2', 'CEILING', 'COS', 'EVEN', 'EXP', 'FLOOR', 'INT', 'LN', 'MROUND', 'ODD',
    'PI', 'QUOTIENT', 'SEQUENCE', 'SIGN', 'SIN', 'SUBTOTAL', 'SUMPRODUCT', 'SUMSQ', 'SUMXMY2', 'TAN',
  ]],
  ['fun:stat.c', [
    'AVERAGEA', 'COUNTA', 'COUNTBLANK', 'COUNTIFS', 'LARGE', 'MAXIFS', 'MEDIAN', 'MINIFS', 'PERCENTILE.INC',
    'SMALL', 'STDEV.P', 'STDEVA', 'STDEVPA', 'VAR.P', 'VAR.S',
  ]],
  ['fun:time.c', ['DAYS360', 'EDATE', 'NOW', 'TIME', 'YEARFRAC']],
  ['fun:text.c', ['CHAR', 'CLEAN', 'CODE', 'FIND', 'PROPER', 'T', 'TEXTJOIN', 'UNICHAR']],
  ['fun:info.c', [
    'ISBLANK', 'ISERR', 'ISERROR', 'ISEVEN', 'ISLOGICAL', 'ISNA', 'ISNUMBER', 'ISODD', 'ISTEXT', 'N', 'NA',
  ]],
  ['fun:logic.c', ['IFERROR', 'IFNA']],
  ['fun:finance.c', ['FV', 'IPMT', 'IRR', 'NPV', 'PMT', 'PPMT', 'PV', 'RATE', 'SLN', 'XIRR', 'XNPV']],
  ['fun:engineer.c', ['DEC2HEX', 'HEX2DEC']],
  ['fun:array.c', ['ARRAYFORMULA', 'ARRAY_CONSTRAIN']],
])

/** The group tokens each package adds, exactly as the packaging doc's §4 table states them. */
const MATH_ENGINE_GROUPS = ['fun:math.a', 'fun:stat.a', 'fun:logic.a', 'fun:operator.a', 'fun:info.a', 'fun:lookup.a']
const CALCULATED_FIELDS_GROUPS = ['fun:time.b', 'fun:text.b', 'fun:logic.b', 'fun:math.b', 'fun:stat.b']
const SPREADSHEET_GROUPS = [
  'fun:lookup.c', 'fun:math.c', 'fun:stat.c', 'fun:time.c', 'fun:text.c', 'fun:info.c', 'fun:logic.c',
  'fun:finance.c', 'fun:engineer.c', 'fun:array.c',
]

/** The members of the given groups, concatenated. The groups are disjoint, so this is a union. */
function membersOfGroups(groupTokens: string[]): string[] {
  return groupTokens.reduce<string[]>(
    (members, groupToken) => members.concat(FUNCTION_GROUPS.get(groupToken) ?? []),
    [],
  )
}

/**
 * The members a group contributes to a package GRANT: the group verbatim, minus the operators
 * (granted by {@link CORE_TOKEN} in every package) and the protected built-ins (outside the token
 * system entirely).
 */
function gatableMembersOfGroups(groupTokens: string[]): string[] {
  return membersOfGroups(groupTokens).filter(
    (name) => OPERATOR_FUNCTIONS.indexOf(name) === -1 && PROTECTED_BUILT_INS.indexOf(name) === -1,
  )
}

/**
 * Package membership, DERIVED from {@link FUNCTION_GROUPS} as the cumulative group unions the
 * packaging doc's §4 table states: Math engine = the `.A` groups, Calculated fields = `.A` + `.B`,
 * Spreadsheet = `.A` + `.B` + `.C`. Reproducing that union gives 17 / 64 / 161 cumulative
 * functions before the two protected built-ins are removed; `capability-table.spec.ts` pins the
 * resulting full memberships by name so a re-derivation is a reviewable diff.
 */
const MATH_ENGINE_FUNCTIONS = gatableMembersOfGroups(MATH_ENGINE_GROUPS)

/** Added by the calculated-fields package, on top of {@link MATH_ENGINE_FUNCTIONS}. */
const CALCULATED_FIELDS_FUNCTIONS = gatableMembersOfGroups(CALCULATED_FIELDS_GROUPS)

/** Added by the spreadsheet package, on top of {@link CALCULATED_FIELDS_FUNCTIONS}. */
const SPREADSHEET_FUNCTIONS = gatableMembersOfGroups(SPREADSHEET_GROUPS)

/**
 * Added by the excel-simulator package, on top of {@link SPREADSHEET_FUNCTIONS} — the rest of the
 * implemented catalog.
 *
 * The packaging document does not itemize this remainder into groups the way it does for the first three
 * packages: the excel-simulator package is stated as `fun:all` — the whole catalog, granted as a
 * single token rather than assembled from named groups. This list is that remainder, enumerated
 * rather than taken from the function registry at run time, even though "all functions" would be
 * the shorter way to say it. Reading the registry would sweep in functions registered through
 * `HyperFormula.registerFunctionPlugin`, putting a user's OWN custom function into a paid package
 * and returning `#LIC!` for it on a smaller licence — the opposite of HF-307 decision D1, which
 * drops custom-function gating entirely. A function this table does not list is not gated at all,
 * which is exactly the treatment a custom function should get.
 */
const EXCEL_SIMULATOR_FUNCTIONS = [
  'ACOSH', 'ACOT', 'ACOTH', 'ARABIC', 'ASINH', 'ATANH', 'AVEDEV', 'BASE', 'BESSELI', 'BESSELJ', 'BESSELK',
  'BESSELY', 'BETA.DIST', 'BETA.INV', 'BIN2DEC', 'BIN2HEX', 'BIN2OCT', 'BINOM.DIST', 'BINOM.INV', 'BITAND',
  'BITLSHIFT', 'BITOR', 'BITRSHIFT', 'BITXOR', 'CEILING.MATH', 'CEILING.PRECISE', 'CHISQ.DIST',
  'CHISQ.DIST.RT', 'CHISQ.INV', 'CHISQ.INV.RT', 'CHISQ.TEST', 'COMBIN', 'COMBINA', 'COMPLEX',
  'CONFIDENCE.NORM', 'CONFIDENCE.T', 'CORREL', 'COSH', 'COT', 'COTH', 'COUNTUNIQUE', 'COVARIANCE.P',
  'COVARIANCE.S', 'CSC', 'CSCH', 'CUMIPMT', 'CUMPRINC', 'DAVERAGE', 'DB', 'DCOUNT', 'DCOUNTA', 'DDB',
  'DEC2BIN', 'DEC2OCT', 'DECIMAL', 'DEGREES', 'DELTA', 'DEVSQ', 'DGET', 'DMAX', 'DMIN', 'DOLLARDE',
  'DOLLARFR', 'DPRODUCT', 'DSTDEV', 'DSTDEVP', 'DSUM', 'DVAR', 'DVARP', 'EFFECT', 'ERF', 'ERFC',
  'EXPON.DIST', 'F.DIST', 'F.DIST.RT', 'F.INV', 'F.INV.RT', 'F.TEST', 'FACT', 'FACTDOUBLE', 'FISHER',
  'FISHERINV', 'FLOOR.MATH', 'FLOOR.PRECISE', 'FORMULATEXT', 'FVSCHEDULE', 'GAMMA', 'GAMMA.DIST',
  'GAMMA.INV', 'GAMMALN', 'GAUSS', 'GCD', 'GEOMEAN', 'HARMEAN', 'HEX2BIN', 'HEX2OCT', 'HYPGEOM.DIST',
  'IMABS', 'IMAGINARY', 'IMARGUMENT', 'IMCONJUGATE', 'IMCOS', 'IMCOSH', 'IMCOT', 'IMCSC', 'IMCSCH', 'IMDIV',
  'IMEXP', 'IMLN', 'IMLOG10', 'IMLOG2', 'IMPOWER', 'IMPRODUCT', 'IMREAL', 'IMSEC', 'IMSECH', 'IMSIN',
  'IMSINH', 'IMSQRT', 'IMSUB', 'IMSUM', 'IMTAN', 'INTERVAL', 'ISBINARY', 'ISFORMULA', 'ISNONTEXT', 'ISPMT',
  'ISREF', 'LCM', 'LOG10', 'LOGNORM.DIST', 'LOGNORM.INV', 'MAXA', 'MAXPOOL', 'MEDIANPOOL', 'MINA', 'MIRR',
  'MMULT', 'MULTINOMIAL', 'NEGBINOM.DIST', 'NETWORKDAYS.INTL', 'NOMINAL', 'NORM.DIST', 'NORM.INV',
  'NORM.S.DIST', 'NORM.S.INV', 'NPER', 'OCT2BIN', 'OCT2DEC', 'OCT2HEX', 'PDURATION', 'PERCENTILE.EXC',
  'PHI', 'POISSON.DIST', 'QUARTILE.EXC', 'QUARTILE.INC', 'RADIANS', 'ROMAN', 'RRI', 'RSQ', 'SEC', 'SECH',
  'SERIESSUM', 'SHEET', 'SHEETS', 'SINH', 'SKEW', 'SKEW.P', 'SLOPE', 'SPLIT', 'SQRTPI', 'STANDARDIZE',
  'STEYX', 'SUMX2MY2', 'SUMX2PY2', 'SYD', 'T.DIST', 'T.DIST.2T', 'T.DIST.RT', 'T.INV', 'T.INV.2T', 'T.TEST',
  'TANH', 'TBILLEQ', 'TBILLPRICE', 'TBILLYIELD', 'TDIST', 'TIMEVALUE', 'UNICODE', 'VARA', 'VARPA',
  'WEIBULL.DIST', 'WORKDAY.INTL', 'Z.TEST',
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
 * One table entry per group token: the group's gatable members, so a key may assemble a package
 * from groups instead of naming a `functions_N` slice. `fun:info.a` and `fun:lookup.a` resolve to
 * EMPTY grants on purpose — their members are the protected built-ins, which are always available
 * and must never become table-covered (a covered function is gated for every key not granting
 * it). The tokens stay recognized either way, so a key carrying them is never reported as
 * unrecognized: they are the doc's bookkeeping identifiers for functionality every key gets.
 */
const groupEntries: [string, CapabilityGrant][] = Array.from(FUNCTION_GROUPS.keys()).map((groupToken) => [
  groupToken,
  {functions: gatableMembersOfGroups([groupToken]), features: []},
])

/**
 * One table entry per canonical function name: the packaging doc's single-function tokens
 * (`fun:<CANONICAL_FUNCTION_NAME>`), "for surgical grants: custom deals, previews, per-function
 * exceptions". One exists for EVERY canonical name — including the operators (harmless: core
 * grants them anyway) and the protected built-ins (empty grants, as above). Alias names get no
 * token of their own: tokens reference canonical names, and an alias travels with its canonical
 * function because the gates canonicalize before consulting the table.
 */
const singleFunctionEntries: [string, CapabilityGrant][] = functions4Grant.functions
  .concat(OPERATOR_FUNCTIONS, PROTECTED_BUILT_INS)
  .map((name) => [
    `fun:${normalizeCapabilityToken(name)}`,
    {functions: PROTECTED_BUILT_INS.indexOf(name) === -1 ? [name] : [], features: []},
  ])

/**
 * The production capability table, keyed by NORMALIZED token spelling — look up through
 * {@link normalizeCapabilityToken}, never with a raw key string.
 *
 * The engine understands BOTH token dialects in circulation, resolved from the one group registry
 * above so they cannot drift apart:
 *
 * - the key spec's package slices (`functions_1..4`) plus the two add-on tokens — the vocabulary
 *   the upstream generator's own schema mints today;
 * - the packaging doc's group vocabulary (`fun:all`, `fun:<family>.<A|B|C>`,
 *   `fun:<CANONICAL_FUNCTION_NAME>`) — §6 of the 12.08 packaging doc.
 *
 * Accepting the superset is deliberate and spec-clean: an unrecognized token is defined as "a
 * grant this version does not implement" (strict-shape/lenient-vocabulary, T7), so implementing
 * more tokens than the generator currently mints breaks nothing — and it makes the engine robust
 * to the still-open business decision about which dialect keys will finally be worded in
 * (owner's call, 20.08). A key's function set is the UNION of everything recognized.
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
 * vocabulary in the task. A key may state them explicitly; a key naming none is granted all five
 * (the opt-in rule in `licenseTermsOf`); legacy keys resolve to the unrestricted entitlement and
 * never consult this table.
 *
 * The two add-on tokens, wired per the 2026-08-12 packages meeting: `spreadsheet` backs the
 * 'Spreadsheet Bundle' add-on and grants {@link FeatureId.Crud}, {@link FeatureId.UndoRedo},
 * {@link FeatureId.Clipboard} and {@link FeatureId.Batching} (batching included, per the packaging decision).
 * `import_export` backs the import-export add-on and grants {@link FeatureId.ImportExport} — a
 * RESERVED grant, since nothing in the public API is gated on it yet: HF-107 hasn't shipped the
 * feature it would gate. Both tokens stay recognized either way, so an issued key carrying one is
 * never reported as unrecognized.
 *
 * Entry ORDER is load-bearing at one spot: `CapabilityRegistry`'s reverse index maps each
 * function id to the FIRST token that lists it, so the package slices stay ahead of the group and
 * single-function tokens, keeping `capabilityOf`'s answers what they were before the second
 * dialect existed.
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
  // NamedExpressions is absent on purpose: the Spreadsheet Bundle was scoped at the 12.08 packages
  // meeting to the four areas below, and named expressions was not among them. It is recorded here
  // so the omission reads as the decision it is rather than as a transcription slip, and so that
  // moving it into the bundle stays a product call rather than a silent edit.
  [SPREADSHEET_ADDON_TOKEN, {
    functions: [],
    features: [FeatureId.Crud, FeatureId.UndoRedo, FeatureId.Clipboard, FeatureId.Batching],
  }],
  [IMPORT_EXPORT_ADDON_TOKEN, {functions: [], features: [FeatureId.ImportExport]}],
  [FUN_ALL_TOKEN, {functions: [...functions4Grant.functions], features: []}],
  ...groupEntries,
  ...singleFunctionEntries,
])

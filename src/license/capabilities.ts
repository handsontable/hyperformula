/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FeatureId} from './LicenseEntitlement'

// The engine reads CAPABILITIES, never packages. A license key carries a list of capability
// tokens and the engine grants the union of what those tokens name; which tokens make up which
// commercial package is decided where keys are minted, not here. In the words of the packaging
// design: "Nothing else about packaging exists at the technical layer."

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
 * Grants {@link FeatureId.ImportExport} — a RESERVED grant: nothing in the public API is gated on
 * it yet, because HF-107 hasn't shipped the import/export feature it would gate.
 *
 * It is nevertheless a RECOGNIZED feature token, so naming it switches the opt-in fallback off
 * like any other: a key whose only `feat:*` token is this one is granted import/export and NOTHING
 * else — no CRUD, no undo, no clipboard, no named expressions, no batching. That is the opt-in rule
 * working as ratified, and it is the operational contract it puts on the issuing side: once a key
 * names this token it must also name every other area the customer bought. Pinned in
 * `unit/license/feature-tokens.spec.ts`, because a token that gates nothing suppressing the whole
 * fallback is exactly the kind of thing a later edit would undo without noticing.
 */
export const IMPORT_EXPORT_FEATURE_TOKEN = 'feat:import_export'

/**
 * Every feature token, in one list, for the opt-in rule in `licenseTermsOf`: a key naming no
 * `feat:*` token at all is granted all of these, because no key vocabulary in circulation can
 * express "no features" — see that function for the reasoning.
 */
export const ALL_FEATURE_TOKENS = [
  CRUD_FEATURE_TOKEN, UNDO_REDO_FEATURE_TOKEN, CLIPBOARD_FEATURE_TOKEN,
  NAMED_EXPRESSIONS_FEATURE_TOKEN, BATCHING_FEATURE_TOKEN, IMPORT_EXPORT_FEATURE_TOKEN,
]

/** The whole implemented catalog of built-in functions, operator callable forms included. */
export const FUN_ALL_TOKEN = 'fun:all'

/**
 * The canonical spelling of a capability token for table lookups.
 *
 * Token names are case-insensitive — the packaging doc states it outright for its `fun:*`
 * vocabulary, and tolerating case on the other tokens costs nothing since none of them collide
 * under lowercasing. Surrounding whitespace is trimmed for a sharper reason than tidiness: every
 * rule that reads a token has to read the SAME token, and a padded one used to be read two
 * different ways at once — `' feat:crud'` failed the `feat:` prefix test that decides whether a key
 * speaks the feature vocabulary, so the key was granted every feature area instead of the one
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
 * Describes what a capability token grants: a set of function ids and a set of {@link FeatureId}
 * values. A grant never refers to another token — every one stands alone, so
 * `CapabilityRegistry.resolve` reads the table in a single flat pass.
 */
export interface CapabilityGrant {
  functions: string[],
  features: FeatureId[],
}

/**
 * The `HF.*` callable forms of the calculation operators — the members of `fun:operator.a`.
 *
 * They are gated like every other function: a key reaches them through `fun:operator.a`, a
 * single-function token, or `fun:all`. Only the callable forms are affected. The infix operators
 * themselves (`=A1+B1`) are not function calls, never reach gate B, and work under any key.
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

/**
 * The 21 function groups of the packaging doc, keyed by their group tokens in normalized
 * (lowercase) spelling — the doc writes them `fun:<family>.<A|B|C>` and declares all token names
 * case-insensitive.
 *
 * Transcribed 1:1 from section 6 of the internal packaging design document ("HF function groups
 * and packages"), INCLUDING the members that resolve to no grant here: the protected built-ins,
 * which sit outside the token system (see {@link PROTECTED_BUILT_INS}). Keeping the doc's own
 * membership verbatim is what lets `capability-table.spec.ts` pin each group's size against the
 * doc's published counts, so a re-transcription is a reviewable diff.
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

/**
 * The members of a group that a grant can carry: the group verbatim, minus the protected
 * built-ins, which are always available and must never become table-covered (a covered function
 * is gated for every key not granting it).
 *
 * @param {string} groupToken - a group token, in normalized spelling
 */
function gatableMembersOf(groupToken: string): string[] {
  return (FUNCTION_GROUPS.get(groupToken) ?? []).filter((name) => PROTECTED_BUILT_INS.indexOf(name) === -1)
}

/** Every function some group names, the operator callable forms included. The groups are disjoint. */
const GROUPED_FUNCTIONS = Array.from(FUNCTION_GROUPS.keys()).reduce<string[]>(
  (members, groupToken) => members.concat(gatableMembersOf(groupToken)),
  [],
)

/**
 * The implemented functions no group names — the packaging design's niche tail, reachable only
 * through {@link FUN_ALL_TOKEN} or their own single-function token.
 *
 * Enumerated rather than taken from the function registry at run time, even though "everything
 * not in a group" would be the shorter way to say it. Reading the registry would sweep in
 * functions registered through `HyperFormula.registerFunctionPlugin`, putting a user's OWN custom
 * function under a licence token and returning `#LIC!` for it — the opposite of HF-307 decision
 * D1, which drops custom-function gating entirely. A function this table does not list is not
 * gated at all, which is exactly the treatment a custom function should get.
 */
const UNGROUPED_FUNCTIONS = [
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

/** The whole gatable catalog: what {@link FUN_ALL_TOKEN} grants. */
const ALL_GATABLE_FUNCTIONS = GROUPED_FUNCTIONS.concat(UNGROUPED_FUNCTIONS)

/**
 * One table entry per group token, granting the group's gatable members. `fun:info.a` and
 * `fun:lookup.a` resolve to
 * EMPTY grants on purpose — their members are the protected built-ins, which are always available
 * and must never become table-covered (a covered function is gated for every key not granting
 * it). The tokens stay recognized either way, so a key carrying them is never reported as
 * unrecognized: they are the doc's bookkeeping identifiers for functionality every key gets.
 */
const groupEntries: [string, CapabilityGrant][] = Array.from(FUNCTION_GROUPS.keys()).map((groupToken) => [
  groupToken,
  {functions: gatableMembersOf(groupToken), features: []},
])

/**
 * One table entry per canonical function name: the packaging doc's single-function tokens
 * (`fun:<CANONICAL_FUNCTION_NAME>`), "for surgical grants: custom deals, previews, per-function
 * exceptions". One exists for EVERY canonical name — including the operator callable forms and
 * the protected built-ins (empty grants, as above). Alias names get no
 * token of their own: tokens reference canonical names, and an alias travels with its canonical
 * function because the gates canonicalize before consulting the table.
 */
const singleFunctionEntries: [string, CapabilityGrant][] = ALL_GATABLE_FUNCTIONS
  .concat(PROTECTED_BUILT_INS)
  .map((name) => [
    `fun:${normalizeCapabilityToken(name)}`,
    {functions: PROTECTED_BUILT_INS.indexOf(name) === -1 ? [name] : [], features: []},
  ])

/**
 * The production capability table, keyed by NORMALIZED token spelling — look up through
 * {@link normalizeCapabilityToken}, never with a raw key string.
 *
 * The vocabulary, and nothing else:
 *
 * - function tokens, per §6 of the packaging design: `fun:all`, the group tokens
 *   `fun:<family>.<a|b|c>`, and one `fun:<CANONICAL_FUNCTION_NAME>` per canonical function;
 * - one `feat:*` token per gated API area.
 *
 * No token here names a package, and no grant refers to another token. Which tokens a commercial
 * package consists of is the generator's knowledge, expressed by the bigger licence simply
 * listing more tokens — so a key's function set is the union of everything it names that this
 * table recognizes, and an unrecognized token is inert (strict-shape/lenient-vocabulary, T7).
 *
 * Every grant is STATIC. Nothing here is derived from the function registry at run time, so a
 * function registered by a user through `HyperFormula.registerFunctionPlugin` can never be gated
 * — see {@link UNGROUPED_FUNCTIONS}. The cost is that a newly implemented built-in is ungated until
 * it is added here, which the completeness invariant in `unit/license/capability-registry.spec.ts`
 * fails on.
 *
 * The `feat:*` tokens carry the gated API areas, one feature each. A key may state them
 * explicitly; a key naming none is granted all of them (the opt-in rule in `licenseTermsOf`);
 * legacy keys resolve to the unrestricted entitlement and never consult this table.
 *
 * There is no entry for any add-on. An add-on is a commercial wrapper, and which capabilities it
 * bundles is decided where keys are minted; the engine only ever reads the capabilities the key
 * actually names. That is what lets pricing rename or re-bundle an add-on without a release here.
 */
export const CAPABILITY_TABLE: ReadonlyMap<string, CapabilityGrant> = new Map([
  [CRUD_FEATURE_TOKEN, {functions: [], features: [FeatureId.Crud]}],
  [UNDO_REDO_FEATURE_TOKEN, {functions: [], features: [FeatureId.UndoRedo]}],
  [CLIPBOARD_FEATURE_TOKEN, {functions: [], features: [FeatureId.Clipboard]}],
  [NAMED_EXPRESSIONS_FEATURE_TOKEN, {functions: [], features: [FeatureId.NamedExpressions]}],
  [BATCHING_FEATURE_TOKEN, {functions: [], features: [FeatureId.Batching]}],
  [IMPORT_EXPORT_FEATURE_TOKEN, {functions: [], features: [FeatureId.ImportExport]}],
  [FUN_ALL_TOKEN, {functions: [...ALL_GATABLE_FUNCTIONS], features: []}],
  ...groupEntries,
  ...singleFunctionEntries,
])

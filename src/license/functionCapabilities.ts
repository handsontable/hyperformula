/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * The 21 function groups of the packaging doc, keyed by their group tokens in normalized
 * (lowercase) spelling — the doc writes them `fun:<family>.<A|B|C>` and declares all token names
 * case-insensitive.
 *
 * Transcribed 1:1 from section 6 of the internal packaging design document ("HF function groups
 * and packages"), so that a re-transcription is a reviewable diff against the doc's published
 * counts. The table below is the only thing production code reads it through.
 *
 * `fun:info.a` and `fun:lookup.a` name nothing but the two protected built-ins, `VERSION` and
 * `OFFSET` (see `FunctionRegistry._protectedPlugins`). The doc calls that a "technical
 * limitation" on both: the interpreter never gate-checks a protected function, so those two
 * evaluate under every key no matter which tokens name them, and the groups that carry them are
 * bookkeeping identifiers for functionality every key already has.
 *
 * The doc freezes group names as API surface: once shipped inside license keys, a rename is a
 * breaking change.
 */
const FUNCTION_GROUPS: ReadonlyMap<string, readonly string[]> = new Map([
  ['fun:math.a', ['ABS', 'LOG', 'MOD', 'POWER', 'PRODUCT', 'ROUND', 'ROUNDDOWN', 'ROUNDUP', 'SQRT', 'SUM']],
  ['fun:stat.a', ['AVERAGE', 'COUNT', 'MAX', 'MIN']],
  ['fun:logic.a', ['IF']],
  ['fun:operator.a', ['HF.ADD', 'HF.CONCAT', 'HF.DIVIDE', 'HF.EQ', 'HF.GT', 'HF.GTE', 'HF.LT', 'HF.LTE', 'HF.MINUS',
  'HF.MULTIPLY', 'HF.NE', 'HF.POW', 'HF.UMINUS', 'HF.UNARY_PERCENT', 'HF.UPLUS']],
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
 * The implemented functions no group names — the packaging design's niche tail, reachable only
 * through `fun:all` or their own single-function token.
 *
 * Enumerated rather than taken from the function registry at run time, even though "everything
 * not in a group" would be the shorter way to say it. Reading the registry would sweep in
 * functions registered through `HyperFormula.registerFunctionPlugin`, putting a user's OWN custom
 * function under a license token and returning `#LIC!` for it, while custom functions must never
 * be gated. A function this table does not list is not
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
  'PHI', 'POISSON.DIST', 'QUARTILE.EXC', 'QUARTILE.INC', 'RADIANS', 'RANK', 'RANK.EQ', 'ROMAN', 'RRI', 'RSQ', 'SEC', 'SECH',
  'SERIESSUM', 'SHEET', 'SHEETS', 'SINH', 'SKEW', 'SKEW.P', 'SLOPE', 'SPLIT', 'SQRTPI', 'STANDARDIZE',
  'STEYX', 'SUMX2MY2', 'SUMX2PY2', 'SYD', 'T.DIST', 'T.DIST.2T', 'T.DIST.RT', 'T.INV', 'T.INV.2T', 'T.TEST',
  'TANH', 'TBILLEQ', 'TBILLPRICE', 'TBILLYIELD', 'TDIST', 'TIMEVALUE', 'UNICODE', 'VARA', 'VARPA',
  'WEIBULL.DIST', 'WORKDAY.INTL', 'Z.TEST',
]

/**
 * The whole catalog: what `fun:all` grants.
 *
 * Flattened by `reduce` rather than `Array.prototype.flat`, which is ES2019 and so sits above the
 * `lib` ceiling this package compiles against.
 */
const ALL_FUNCTIONS = Array.from(FUNCTION_GROUPS.values())
  .reduce<string[]>((functions, members) => functions.concat(members), [])
  .concat(UNGROUPED_FUNCTIONS)

/**
 * One table entry per canonical function name: the packaging doc's single-function tokens
 * (`fun:<CANONICAL_FUNCTION_NAME>`), "for surgical grants: custom deals, previews, per-function
 * exceptions". One exists for EVERY canonical name — the operator callable forms and the
 * protected built-ins included. Alias names get no token of their own: tokens reference canonical
 * names, and an alias travels with its canonical function because the gates canonicalize before
 * consulting the table.
 */
const singleFunctionEntries: [string, readonly string[]][] = ALL_FUNCTIONS.map((name) => [
  `fun:${name.trim().toLowerCase()}`,
  [name],
])

/**
 * The `fun:*` half of the vocabulary, keyed by NORMALIZED token spelling, as the packaging design
 * defines it: `fun:all`, the group tokens `fun:<family>.<a|b|c>`, and one
 * `fun:<CANONICAL_FUNCTION_NAME>` per canonical function.
 *
 * Every grant is STATIC. Nothing here is derived from the function registry at run time, so a
 * function registered by a user through `HyperFormula.registerFunctionPlugin` can never be gated
 * — see the note on `UNGROUPED_FUNCTIONS`. The cost is that a newly implemented built-in is
 * ungated until it is added here, which the completeness invariant in
 * `unit/license/capability-registry.spec.ts` fails on.
 */
export const FUNCTION_CAPABILITY_TABLE: ReadonlyMap<string, readonly string[]> = new Map([
  ['fun:all', ALL_FUNCTIONS] as [string, readonly string[]],
  ...FUNCTION_GROUPS,
  ...singleFunctionEntries,
])

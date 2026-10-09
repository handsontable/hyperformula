# API Reference Overview 

## Type aliases

### CellDependency 

Ƭ **CellDependency**: *[SimpleCellAddress](interfaces/simplecelladdress.md) | [AbsoluteCellRange](classes/absolutecellrange.md) | NamedExpressionDependency*

*Defined in [src/CellDependency.ts:10](https://github.com/handsontable/hyperformula/blob/99a45ea/src/CellDependency.ts#L10)*

___

### CellValue 

Ƭ **CellValue**: *[NoErrorCellValue](globals.md#noerrorcellvalue) | [DetailedCellError](classes/detailedcellerror.md)*

*Defined in [src/CellValue.ts:9](https://github.com/handsontable/hyperformula/blob/99a45ea/src/CellValue.ts#L9)*

___

### CellValueDetailedType 

Ƭ **CellValueDetailedType**: *[CellValueNoNumber](enums/cellvaluenonumber.md) | NumberType*

*Defined in [src/Cell.ts:94](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Cell.ts#L94)*

___

### CellValueType 

Ƭ **CellValueType**: *[CellValueNoNumber](enums/cellvaluenonumber.md) | [CellValueJustNumber](enums/cellvaluejustnumber.md)*

*Defined in [src/Cell.ts:91](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Cell.ts#L91)*

___

### ChangeList 

Ƭ **ChangeList**: *[CellValueChange](interfaces/cellvaluechange.md)[]*

*Defined in [src/ContentChanges.ts:20](https://github.com/handsontable/hyperformula/blob/99a45ea/src/ContentChanges.ts#L20)*

___

### ClipboardCell 

Ƭ **ClipboardCell**: *[ClipboardCellValue](interfaces/clipboardcellvalue.md) | [ClipboardCellFormula](interfaces/clipboardcellformula.md) | [ClipboardCellEmpty](interfaces/clipboardcellempty.md) | [ClipboardCellParsingError](interfaces/clipboardcellparsingerror.md)*

*Defined in [src/ClipboardOperations.ts:16](https://github.com/handsontable/hyperformula/blob/99a45ea/src/ClipboardOperations.ts#L16)*

___

### ColumnMap 

Ƭ **ColumnMap**: *Map‹RawInterpreterValue, [ValueIndex](interfaces/valueindex.md)›*

*Defined in [src/Lookup/ColumnIndex.ts:30](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Lookup/ColumnIndex.ts#L30)*

___

### ColumnRowIndex 

Ƭ **ColumnRowIndex**: *[number, number]*

*Defined in [src/CrudOperations.ts:65](https://github.com/handsontable/hyperformula/blob/99a45ea/src/CrudOperations.ts#L65)*

___

### ConfigParamsList 

Ƭ **ConfigParamsList**: *keyof ConfigParams*

*Defined in [src/ConfigParams.ts:450](https://github.com/handsontable/hyperformula/blob/99a45ea/src/ConfigParams.ts#L450)*

___

### ConsoleMessages 

Ƭ **ConsoleMessages**: *object*

*Defined in [src/helpers/licenseKeyValidator.ts:25](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L25)*

#### Type declaration:

___

### DateTime 

Ƭ **DateTime**: *[SimpleTime](interfaces/simpletime.md) | [SimpleDate](interfaces/simpledate.md) | [SimpleDateTime](globals.md#simpledatetime)*

*Defined in [src/DateTimeHelper.ts:31](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeHelper.ts#L31)*

___

### Dependencies 

Ƭ **Dependencies**: *Map‹Vertex, [CellDependency](globals.md#celldependency)[]›*

*Defined in [src/GraphBuilder.ts:25](https://github.com/handsontable/hyperformula/blob/99a45ea/src/GraphBuilder.ts#L25)*

___

### EngineState 

Ƭ **EngineState**: *object*

*Defined in [src/BuildEngineFactory.ts:35](https://github.com/handsontable/hyperformula/blob/99a45ea/src/BuildEngineFactory.ts#L35)*

#### Type declaration:

* **cellContentParser**: *[CellContentParser](classes/cellcontentparser.md)*

* **columnSearch**: *[ColumnSearchStrategy](interfaces/columnsearchstrategy.md)*

* **config**: *[Config](classes/config.md)*

* **crudOperations**: *[CrudOperations](classes/crudoperations.md)*

* **dependencyGraph**: *DependencyGraph*

* **evaluator**: *[Evaluator](classes/evaluator.md)*

* **exporter**: *[Exporter](classes/exporter.md)*

* **functionRegistry**: *FunctionRegistry*

* **lazilyTransformingAstService**: *[LazilyTransformingAstService](classes/lazilytransformingastservice.md)*

* **namedExpressions**: *[NamedExpressions](classes/namedexpressions.md)*

* **parser**: *ParserWithCaching*

* **serialization**: *[Serialization](classes/serialization.md)*

* **stats**: *[Statistics](classes/statistics.md)*

* **unparser**: *Unparser*

___

### ExportedChange 

Ƭ **ExportedChange**: *[ExportedCellChange](classes/exportedcellchange.md) | [ExportedNamedExpressionChange](classes/exportednamedexpressionchange.md)*

*Defined in [src/Exporter.ts:18](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Exporter.ts#L18)*

___

### LicenseKeyInvalidState 

Ƭ **LicenseKeyInvalidState**: *Exclude‹[LicenseKeyValidityState](enums/licensekeyvaliditystate.md), [VALID](enums/licensekeyvaliditystate.md#valid)›*

*Defined in [src/helpers/licenseKeyValidator.ts:19](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L19)*

___

### Maybe 

Ƭ **Maybe**: *T | undefined*

*Defined in [src/Maybe.ts:6](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Maybe.ts#L6)*

**`license`** 
Copyright (c) 2025 Handsoncode. All rights reserved.

___

### MessageDescriptor 

Ƭ **MessageDescriptor**: *object*

*Defined in [src/helpers/licenseKeyValidator.ts:29](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L29)*

#### Type declaration:

* **expiryDate**? : *Date*

* **template**: *[LicenseKeyValidityState](enums/licensekeyvaliditystate.md)*

___

### NamedExpressionOptions 

Ƭ **NamedExpressionOptions**: *Record‹string, string | number | boolean›*

*Defined in [src/NamedExpressions.ts:22](https://github.com/handsontable/hyperformula/blob/99a45ea/src/NamedExpressions.ts#L22)*

___

### NoErrorCellValue 

Ƭ **NoErrorCellValue**: *number | string | boolean | null*

*Defined in [src/CellValue.ts:8](https://github.com/handsontable/hyperformula/blob/99a45ea/src/CellValue.ts#L8)*

___

### RawCellContent 

Ƭ **RawCellContent**: *Date | string | number | boolean | null | undefined*

*Defined in [src/CellContentParser.ts:25](https://github.com/handsontable/hyperformula/blob/99a45ea/src/CellContentParser.ts#L25)*

___

### Sheet 

Ƭ **Sheet**: *[RawCellContent](globals.md#rawcellcontent)[][]*

*Defined in [src/Sheet.ts:12](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Sheet.ts#L12)*

Two-dimenstional array representation of sheet

___

### SheetDimensions 

Ƭ **SheetDimensions**: *object*

*Defined in [src/Sheet.ts:19](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Sheet.ts#L19)*

Represents size of a sheet

#### Type declaration:

* **height**: *number*

* **width**: *number*

___

### SheetIndex 

Ƭ **SheetIndex**: *[ColumnMap](globals.md#columnmap)[]*

*Defined in [src/Lookup/ColumnIndex.ts:37](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Lookup/ColumnIndex.ts#L37)*

___

### Sheets 

Ƭ **Sheets**: *Record‹string, [Sheet](globals.md#sheet)›*

*Defined in [src/Sheet.ts:14](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Sheet.ts#L14)*

___

### SimpleDateTime 

Ƭ **SimpleDateTime**: *[SimpleDate](interfaces/simpledate.md) & [SimpleTime](interfaces/simpletime.md)*

*Defined in [src/DateTimeHelper.ts:29](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeHelper.ts#L29)*

___

### Span 

Ƭ **Span**: *[RowsSpan](classes/rowsspan.md) | [ColumnsSpan](classes/columnsspan.md)*

*Defined in [src/Span.ts:6](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Span.ts#L6)*

**`license`** 
Copyright (c) 2025 Handsoncode. All rights reserved.

___

### TranslatableErrorType 

Ƭ **TranslatableErrorType**: *Exclude‹[ErrorType](classes/hyperformulans.md#static-errortype), [LIC](enums/errortype.md#lic)›*

*Defined in [src/Cell.ts:51](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Cell.ts#L51)*

## Variables

### ALL_FEATURES

• **ALL_FEATURES**: *[FeatureId](enums/featureid.md)[]* = singleFeatureEntries.reduce<FeatureId[]>(
  (features, [, granted]) => features.concat(granted),
  [],
)

*Defined in [src/license/featureCapabilities.ts:21](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/featureCapabilities.ts#L21)*

Every gated API area: what `feat:all` grants.

___

### ALL_FUNCTIONS

• **ALL_FUNCTIONS**: *string[]* = Array.from(FUNCTION_GROUPS.values())
  .reduce<string[]>((functions, members) => functions.concat(members), [])
  .concat(UNGROUPED_FUNCTIONS)

*Defined in [src/license/functionCapabilities.ts:108](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/functionCapabilities.ts#L108)*

The whole catalog: what `fun:all` grants.

Flattened by `reduce` rather than `Array.prototype.flat`, which is ES2019 and so sits above the
`lib` ceiling this package compiles against.

___

### CAPABILITY_TABLE

• **CAPABILITY_TABLE**: *ReadonlyMap‹string, [CapabilityGrant](interfaces/capabilitygrant.md)›* = new Map<string, CapabilityGrant>([
  ...Array.from(FEATURE_CAPABILITY_TABLE, ([token, features]): [string, CapabilityGrant] => [
    token,
    {functions: [], features: [...features]},
  ]),
  ...Array.from(FUNCTION_CAPABILITY_TABLE, ([token, functions]): [string, CapabilityGrant] => [
    token,
    {functions: [...functions], features: []},
  ]),
])

*Defined in [src/license/capabilities.ts:55](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/capabilities.ts#L55)*

The production capability table the engine reads: [FEATURE_CAPABILITY_TABLE](globals.md#const-feature_capability_table) and
[FUNCTION_CAPABILITY_TABLE](globals.md#const-function_capability_table) under one key space, keyed by NORMALIZED token spelling —
look up through [normalizeCapabilityToken](globals.md#normalizecapabilitytoken), never with a raw key string.

The two halves share no token (one vocabulary is prefixed `feat:`, the other `fun:`), so the
merge cannot lose an entry to a collision. Features come first so that the function half keeps
its own iteration order, which is what decides the winner in
`CapabilityRegistry`'s reverse index: `fun:all` covers every gatable function and therefore
names every one of them there.

Both halves are copied into fresh [CapabilityGrant](interfaces/capabilitygrant.md) objects rather than referenced, so
that a consumer holding a grant cannot reach back into a sub-table's arrays.

No token here names a package, and no grant refers to another token. Which tokens a commercial
package consists of is the generator's knowledge, expressed by the bigger license simply
listing more tokens — so a key's function set is the union of everything it names that this
table recognizes, and an unrecognized token is inert.
Legacy keys resolve to the unrestricted entitlement and never consult this table at all.

There is no entry for any add-on. An add-on is a commercial wrapper, and which capabilities it
bundles is decided where keys are minted; the engine only ever reads the capabilities the key
actually names. That is what lets pricing rename or re-bundle an add-on without a release here.

___

### DATE_SEPARATOR_REGEXP

• **DATE_SEPARATOR_REGEXP**: *RegExp‹›* = new RegExp('[ /.-]')

*Defined in [src/DateTimeDefault.ts:13](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeDefault.ts#L13)*

___

### FEATURE_CAPABILITY_TABLE

• **FEATURE_CAPABILITY_TABLE**: *ReadonlyMap‹string, readonly FeatureId[]›* = new Map([
  ...singleFeatureEntries,
  ['feat:all', ALL_FEATURES] as [string, readonly FeatureId[]],
])

*Defined in [src/license/featureCapabilities.ts:35](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/featureCapabilities.ts#L35)*

The `feat:*` half of the vocabulary, keyed by NORMALIZED token spelling: one token per gated
area of the public API, plus `feat:all` for all of them at once.

Kept apart from `FUNCTION_CAPABILITY_TABLE` because the two halves are maintained by different
forces. This one grows when a public API area becomes gated — an engine decision, one entry
hand-written per area — while the function half is a transcription of the packaging document's
group membership. `CAPABILITY_TABLE` in `./capabilities` merges them for the consumers.

___

### FUNCTION_CAPABILITY_TABLE

• **FUNCTION_CAPABILITY_TABLE**: *ReadonlyMap‹string, readonly string[]›* = new Map([
  ['fun:all', ALL_FUNCTIONS] as [string, readonly string[]],
  ...FUNCTION_GROUPS,
  ...singleFunctionEntries,
])

*Defined in [src/license/functionCapabilities.ts:136](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/functionCapabilities.ts#L136)*

The `fun:*` half of the vocabulary, keyed by NORMALIZED token spelling, as the packaging design
defines it: `fun:all`, the group tokens `fun:<family>.<a|b|c>`, and one
`fun:<CANONICAL_FUNCTION_NAME>` per canonical function.

Every grant is STATIC. Nothing here is derived from the function registry at run time, so a
function registered by a user through `HyperFormula.registerFunctionPlugin` can never be gated
— see the note on `UNGROUPED_FUNCTIONS`. The cost is that a newly implemented built-in is
ungated until it is added here, which the completeness invariant in
`unit/license/capability-registry.spec.ts` fails on.

___

### FUNCTION_GROUPS

• **FUNCTION_GROUPS**: *ReadonlyMap‹string, readonly string[]›* = new Map([
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

*Defined in [src/license/functionCapabilities.ts:24](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/functionCapabilities.ts#L24)*

The 21 function groups of the packaging doc, keyed by their group tokens in normalized
(lowercase) spelling — the doc writes them `fun:<family>.<A|B|C>` and declares all token names
case-insensitive.

Transcribed 1:1 from section 6 of the internal packaging design document ("HF function groups
and packages"), so that a re-transcription is a reviewable diff against the doc's published
counts. The table below is the only thing production code reads it through.

`fun:info.a` and `fun:lookup.a` name nothing but the two protected built-ins, `VERSION` and
`OFFSET` (see `FunctionRegistry._protectedPlugins`). The doc calls that a "technical
limitation" on both: the interpreter never gate-checks a protected function, so those two
evaluate under every key no matter which tokens name them, and the groups that carry them are
bookkeeping identifiers for functionality every key already has.

The doc freezes group names as API surface: once shipped inside license keys, a rename is a
breaking change.

___

### HOURS_PER_DAY

• **HOURS_PER_DAY**: *24* = 24

*Defined in [src/DateTimeHelper.ts:15](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeHelper.ts#L15)*

___

### HYPERFORMULA_PRODUCT_NAME

• **HYPERFORMULA_PRODUCT_NAME**: *"hyperformula"* = "hyperformula"

*Defined in [src/license/licenseResolution.ts:23](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/licenseResolution.ts#L23)*

The name of HyperFormula's own product entry in an entitlement key payload. A key that grants
other products but not this one is not a license for HyperFormula (the reader returns
`product_missing`), however many other products it grants.

___

### LCID_CURRENCY_TAG

• **LCID_CURRENCY_TAG**: *RegExp‹›* = /\[\$[^\-\]]+-/

*Defined in [src/format/format.ts:26](https://github.com/handsontable/hyperformula/blob/99a45ea/src/format/format.ts#L26)*

Detects Excel LCID-tagged currency tags (`[$SYMBOL-LCID]` with a non-empty
SYMBOL portion). Shared by `defaultStringifyDateTime` and
`defaultStringifyDuration` so a format string carrying such a tag short-
circuits both date and duration dispatch and falls through to the
number formatter (or the user-supplied `stringifyCurrency` callback).

The pattern is intentionally unanchored: any occurrence of `[$SYMBOL-`
in the format string triggers the guard. Excel does not mix date/time
tokens with a currency tag in the same format string, so a mid-string
match cannot misclassify a legitimate composite — every observed
format string with a currency tag is currency-only.

___

### MINUTES_PER_HOUR

• **MINUTES_PER_HOUR**: *60* = 60

*Defined in [src/DateTimeHelper.ts:14](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeHelper.ts#L14)*

___

### NOT_FOUND

• **NOT_FOUND**: *-1* = -1

*Defined in [src/Lookup/AdvancedFind.ts:19](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Lookup/AdvancedFind.ts#L19)*

___

### PURCHASE_LICENSE_TEXT

• **PURCHASE_LICENSE_TEXT**: *"To continue using HyperFormula, you need to purchase a license."* = "To continue using HyperFormula, you need to purchase a license."

*Defined in [src/helpers/licenseKeyValidator.ts:66](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L66)*

___

### QUICK_CHECK_REGEXP

• **QUICK_CHECK_REGEXP**: *RegExp‹›* = new RegExp('^[0-9/.\\-: ]+[ap]?m?$')

*Defined in [src/DateTimeDefault.ts:11](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeDefault.ts#L11)*

___

### SECONDS_PER_MINUTE

• **SECONDS_PER_MINUTE**: *60* = 60

*Defined in [src/DateTimeHelper.ts:13](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeHelper.ts#L13)*

___

### SECONDS_PRECISION

• **SECONDS_PRECISION**: *1000* = 1000

*Defined in [src/DateTimeDefault.ts:15](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeDefault.ts#L15)*

___

### TIME_FORMAT_SECONDS_ITEM_REGEXP

• **TIME_FORMAT_SECONDS_ITEM_REGEXP**: *RegExp‹›* = new RegExp('^ss(\\.(s+|0+))?$')

*Defined in [src/DateTimeDefault.ts:9](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeDefault.ts#L9)*

___

### TIME_SEPARATOR

• **TIME_SEPARATOR**: *":"* = ":"

*Defined in [src/DateTimeDefault.ts:14](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeDefault.ts#L14)*

___

### UNGROUPED_FUNCTIONS

• **UNGROUPED_FUNCTIONS**: *string[]* = [
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

*Defined in [src/license/functionCapabilities.ts:77](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/functionCapabilities.ts#L77)*

The implemented functions no group names — the packaging design's niche tail, reachable only
through `fun:all` or their own single-function token.

Enumerated rather than taken from the function registry at run time, even though "everything
not in a group" would be the shorter way to say it. Reading the registry would sweep in
functions registered through `HyperFormula.registerFunctionPlugin`, putting a user's OWN custom
function under a license token and returning `#LIC!` for it, while custom functions must never
be gated. A function this table does not list is not
gated at all, which is exactly the treatment a custom function should get.

___

### WHITESPACE_REGEXP

• **WHITESPACE_REGEXP**: *RegExp‹›* = new RegExp('\\s+')

*Defined in [src/DateTimeDefault.ts:12](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeDefault.ts#L12)*

___

### WRONG_RANGE_SIZE

• **WRONG_RANGE_SIZE**: *"AbsoluteCellRange: Wrong range size"* = "AbsoluteCellRange: Wrong range size"

*Defined in [src/AbsoluteCellRange.ts:22](https://github.com/handsontable/hyperformula/blob/99a45ea/src/AbsoluteCellRange.ts#L22)*

___

### _notified

• **_notified**: *boolean* = false

*Defined in [src/helpers/licenseKeyValidator.ts:44](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L44)*

___

### _rl

• **_rl**: *"length"* = "length"

*Defined in [src/helpers/licenseKeyHelper.ts:9](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyHelper.ts#L9)*

**`license`** 
Copyright (c) 2025 Handsoncode. All rights reserved.

___

### dateFormatRegex

• **dateFormatRegex**: *RegExp‹›* = /(\\.|dd|DD|d|D|mm|MM|m|M|YYYY|YY|yyyy|yy|HH|hh|H|h|ss(\.(0+|s+))?|s|AM\/PM|am\/pm|A\/P|a\/p|\[mm]|\[MM]|\[hh]|\[HH])/g

*Defined in [src/format/parser.ts:8](https://github.com/handsontable/hyperformula/blob/99a45ea/src/format/parser.ts#L8)*

___

### defaultLanguage

• **defaultLanguage**: *string* = Config.defaultConfig.language

*Defined in [src/index.ts:112](https://github.com/handsontable/hyperformula/blob/99a45ea/src/index.ts#L112)*

___

### memoizedParseDateFormat

• **memoizedParseDateFormat**: *(Anonymous function)* = memoize(parseDateFormat)

*Defined in [src/DateTimeDefault.ts:17](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeDefault.ts#L17)*

___

### memoizedParseTimeFormat

• **memoizedParseTimeFormat**: *(Anonymous function)* = memoize(parseTimeFormat)

*Defined in [src/DateTimeDefault.ts:16](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeDefault.ts#L16)*

___

### numDays

• **numDays**: *number[]* = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

*Defined in [src/DateTimeHelper.ts:10](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeHelper.ts#L10)*

___

### numberFormatRegex

• **numberFormatRegex**: *RegExp‹›* = /(\\.|[#0]+(\.[#0]*)?)/g

*Defined in [src/format/parser.ts:9](https://github.com/handsontable/hyperformula/blob/99a45ea/src/format/parser.ts#L9)*

___

### prefSumDays

• **prefSumDays**: *number[]* = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

*Defined in [src/DateTimeHelper.ts:11](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeHelper.ts#L11)*

___

### privatePool

• **privatePool**: *WeakMap‹[Config](classes/config.md), [LicensePrivateState](interfaces/licenseprivatestate.md)›* = new WeakMap()

*Defined in [src/Config.ts:40](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L40)*

___

### singleFeatureEntries

• **singleFeatureEntries**: *[string, readonly FeatureId[]][]* = [
  ['feat:crud', [FeatureId.Crud]],
  ['feat:undo_redo', [FeatureId.UndoRedo]],
  ['feat:clipboard', [FeatureId.Clipboard]],
  ['feat:named_expressions', [FeatureId.NamedExpressions]],
  ['feat:batching', [FeatureId.Batching]],
]

*Defined in [src/license/featureCapabilities.ts:12](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/featureCapabilities.ts#L12)*

One entry per single-area feature token. `feat:all` is derived from this list rather than
spelled out beside it, so a new gated area reaches it by being added here and nowhere else.

___

### singleFunctionEntries

• **singleFunctionEntries**: *[string, readonly string[]][]* = ALL_FUNCTIONS.map((name) => [
  `fun:${name.trim().toLowerCase()}`,
  [name],
])

*Defined in [src/license/functionCapabilities.ts:120](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/functionCapabilities.ts#L120)*

One table entry per canonical function name: the packaging doc's single-function tokens
(`fun:<CANONICAL_FUNCTION_NAME>`), "for surgical grants: custom deals, previews, per-function
exceptions". One exists for EVERY canonical name — the operator callable forms and the
protected built-ins included. Alias names get no token of their own: tokens reference canonical
names, and an alias travels with its canonical function because the gates canonicalize before
consulting the table.

## Functions

### CellValueTypeOrd

▸ **CellValueTypeOrd**(`arg`: [CellValueType](classes/hyperformulans.md#static-cellvaluetype)): *number*

*Defined in [src/Cell.ts:97](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Cell.ts#L97)*

**Parameters:**

Name | Type |
------ | ------ |
`arg` | [CellValueType](classes/hyperformulans.md#static-cellvaluetype) |

**Returns:** *number*

___

### _cp

▸ **_cp**(`v`: any): *number*

*Defined in [src/helpers/licenseKeyHelper.ts:14](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyHelper.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`v` | any |

**Returns:** *number*

___

### _hd

▸ **_hd**(`v`: any): *number*

*Defined in [src/helpers/licenseKeyHelper.ts:10](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyHelper.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`v` | any |

**Returns:** *number*

___

### _nm

▸ **_nm**(`v`: any): *string*

*Defined in [src/helpers/licenseKeyHelper.ts:12](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyHelper.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`v` | any |

**Returns:** *string*

___

### _pi

▸ **_pi**(`v`: any): *number*

*Defined in [src/helpers/licenseKeyHelper.ts:11](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyHelper.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`v` | any |

**Returns:** *number*

___

### _ss

▸ **_ss**(`v`: any, `s`: any, `l`: any): *any*

*Defined in [src/helpers/licenseKeyHelper.ts:13](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyHelper.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`v` | any |
`s` | any |
`l` | any |

**Returns:** *any*

___

### absoluteSheetReference

▸ **absoluteSheetReference**(`address`: AddressWithSheet, `baseAddress`: [SimpleCellAddress](interfaces/simplecelladdress.md)): *number*

*Defined in [src/Cell.ts:222](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Cell.ts#L222)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | AddressWithSheet |
`baseAddress` | [SimpleCellAddress](interfaces/simplecelladdress.md) |

**Returns:** *number*

___

### absolutizeDependencies

▸ **absolutizeDependencies**(`deps`: RelativeDependency[], `baseAddress`: [SimpleCellAddress](interfaces/simplecelladdress.md)): *[CellDependency](globals.md#celldependency)[]*

*Defined in [src/absolutizeDependencies.ts:17](https://github.com/handsontable/hyperformula/blob/99a45ea/src/absolutizeDependencies.ts#L17)*

Converts dependencies from maybe relative addressing to absolute addressing.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`deps` | RelativeDependency[] | list of addresses in R0C0 format |
`baseAddress` | [SimpleCellAddress](interfaces/simplecelladdress.md) | base address with regard to which make a convertion  |

**Returns:** *[CellDependency](globals.md#celldependency)[]*

___

### addressKey

▸ **addressKey**(`address`: [SimpleCellAddress](interfaces/simplecelladdress.md)): *string*

*Defined in [src/Cell.ts:209](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Cell.ts#L209)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleCellAddress](interfaces/simplecelladdress.md) |

**Returns:** *string*

___

### allowsFeature 

▸ **allowsFeature**(`resolved`: [ResolvedCapabilities](interfaces/resolvedcapabilities.md), `feature`: [FeatureId](enums/featureid.md)): *boolean*

*Defined in [src/license/CapabilityRegistry.ts:135](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/CapabilityRegistry.ts#L135)*

Whether a resolved entitlement allows using the given feature area of the public API.

**Parameters:**

Name | Type |
------ | ------ |
`resolved` | [ResolvedCapabilities](interfaces/resolvedcapabilities.md) |
`feature` | [FeatureId](enums/featureid.md) |

**Returns:** *boolean*

___

### allowsFunction 

▸ **allowsFunction**(`resolved`: [ResolvedCapabilities](interfaces/resolvedcapabilities.md), `functionId`: string): *boolean*

*Defined in [src/license/CapabilityRegistry.ts:128](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/CapabilityRegistry.ts#L128)*

Whether a resolved entitlement allows calling the given function.

**Parameters:**

Name | Type |
------ | ------ |
`resolved` | [ResolvedCapabilities](interfaces/resolvedcapabilities.md) |
`functionId` | string |

**Returns:** *boolean*

___

### arraySizeForBinaryOp 

▸ **arraySizeForBinaryOp**(`leftArraySize`: [ArraySize](classes/arraysize.md), `rightArraySize`: [ArraySize](classes/arraysize.md)): *[ArraySize](classes/arraysize.md)*

*Defined in [src/ArraySize.ts:35](https://github.com/handsontable/hyperformula/blob/99a45ea/src/ArraySize.ts#L35)*

**Parameters:**

Name | Type |
------ | ------ |
`leftArraySize` | [ArraySize](classes/arraysize.md) |
`rightArraySize` | [ArraySize](classes/arraysize.md) |

**Returns:** *[ArraySize](classes/arraysize.md)*

___

### arraySizeForUnaryOp 

▸ **arraySizeForUnaryOp**(`arraySize`: [ArraySize](classes/arraysize.md)): *[ArraySize](classes/arraysize.md)*

*Defined in [src/ArraySize.ts:39](https://github.com/handsontable/hyperformula/blob/99a45ea/src/ArraySize.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`arraySize` | [ArraySize](classes/arraysize.md) |

**Returns:** *[ArraySize](classes/arraysize.md)*

___

### buildColumnSearchStrategy 

▸ **buildColumnSearchStrategy**(`dependencyGraph`: DependencyGraph, `config`: [Config](classes/config.md), `statistics`: [Statistics](classes/statistics.md)): *[ColumnSearchStrategy](interfaces/columnsearchstrategy.md)*

*Defined in [src/Lookup/SearchStrategy.ts:63](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Lookup/SearchStrategy.ts#L63)*

**Parameters:**

Name | Type |
------ | ------ |
`dependencyGraph` | DependencyGraph |
`config` | [Config](classes/config.md) |
`statistics` | [Statistics](classes/statistics.md) |

**Returns:** *[ColumnSearchStrategy](interfaces/columnsearchstrategy.md)*

___

### checkKeySchema 

▸ **checkKeySchema**(`v`: any): *boolean*

*Defined in [src/helpers/licenseKeyHelper.ts:20](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyHelper.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`v` | any |

**Returns:** *boolean*

___

### checkLicenseKeyValidity 

▸ **checkLicenseKeyValidity**(`licenseKey`: string): *[LicenseKeyValidityState](enums/licensekeyvaliditystate.md)*

*Defined in [src/helpers/licenseKeyValidator.ts:225](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L225)*

Checks if the provided license key is grammatically valid or not expired.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`licenseKey` | string | The license key to check. |

**Returns:** *[LicenseKeyValidityState](enums/licensekeyvaliditystate.md)*

Returns the checking state.

___

### collatorFromConfig 

▸ **collatorFromConfig**(`config`: [Config](classes/config.md)): *Collator*

*Defined in [src/StringHelper.ts:8](https://github.com/handsontable/hyperformula/blob/99a45ea/src/StringHelper.ts#L8)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [Config](classes/config.md) |

**Returns:** *Collator*

___

### configCheckIfParametersNotInConflict 

▸ **configCheckIfParametersNotInConflict**(...`params`: object[]): *void*

*Defined in [src/ArgumentSanitization.ts:57](https://github.com/handsontable/hyperformula/blob/99a45ea/src/ArgumentSanitization.ts#L57)*

**Parameters:**

Name | Type |
------ | ------ |
`...params` | object[] |

**Returns:** *void*

___

### configValueFromParam 

▸ **configValueFromParam**(`inputValue`: any, `expectedType`: string | string[], `paramName`: [ConfigParamsList](globals.md#configparamslist)): *any*

*Defined in [src/ArgumentSanitization.ts:16](https://github.com/handsontable/hyperformula/blob/99a45ea/src/ArgumentSanitization.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`inputValue` | any |
`expectedType` | string &#124; string[] |
`paramName` | [ConfigParamsList](globals.md#configparamslist) |

**Returns:** *any*

___

### configValueFromParamCheck 

▸ **configValueFromParamCheck**(`inputValue`: any, `typeCheck`: function, `expectedType`: string, `paramName`: [ConfigParamsList](globals.md#configparamslist)): *any*

*Defined in [src/ArgumentSanitization.ts:47](https://github.com/handsontable/hyperformula/blob/99a45ea/src/ArgumentSanitization.ts#L47)*

**Parameters:**

▪ **inputValue**: *any*

▪ **typeCheck**: *function*

▸ (`object`: any): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`object` | any |

▪ **expectedType**: *string*

▪ **paramName**: *[ConfigParamsList](globals.md#configparamslist)*

**Returns:** *any*

___

### countChars 

▸ **countChars**(`text`: string, `char`: string): *number*

*Defined in [src/format/format.ts:74](https://github.com/handsontable/hyperformula/blob/99a45ea/src/format/format.ts#L74)*

**Parameters:**

Name | Type |
------ | ------ |
`text` | string |
`char` | string |

**Returns:** *number*

___

### createTokens 

▸ **createTokens**(`regexTokens`: RegExpExecArray[], `str`: string): *[FormatToken](interfaces/formattoken.md)[]*

*Defined in [src/format/parser.ts:66](https://github.com/handsontable/hyperformula/blob/99a45ea/src/format/parser.ts#L66)*

**Parameters:**

Name | Type |
------ | ------ |
`regexTokens` | RegExpExecArray[] |
`str` | string |

**Returns:** *[FormatToken](interfaces/formattoken.md)[]*

___

### dayToMonth 

▸ **dayToMonth**(`dayOfYear`: number): *number*

*Defined in [src/DateTimeHelper.ts:270](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeHelper.ts#L270)*

**Parameters:**

Name | Type |
------ | ------ |
`dayOfYear` | number |

**Returns:** *number*

___

### defaultParseToDate 

▸ **defaultParseToDate**(`dateItems`: string[], `dateFormat`: [Maybe](globals.md#maybe)‹string›): *[Maybe](globals.md#maybe)‹[SimpleDate](interfaces/simpledate.md)›*

*Defined in [src/DateTimeDefault.ts:137](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeDefault.ts#L137)*

Parses a date value from a string if the string matches the given date format.

**Parameters:**

Name | Type |
------ | ------ |
`dateItems` | string[] |
`dateFormat` | [Maybe](globals.md#maybe)‹string› |

**Returns:** *[Maybe](globals.md#maybe)‹[SimpleDate](interfaces/simpledate.md)›*

___

### defaultParseToDateTime 

▸ **defaultParseToDateTime**(`text`: string, `dateFormat`: [Maybe](globals.md#maybe)‹string›, `timeFormat`: [Maybe](globals.md#maybe)‹string›): *[Maybe](globals.md#maybe)‹[DateTime](globals.md#datetime)›*

*Defined in [src/DateTimeDefault.ts:30](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeDefault.ts#L30)*

Parses a DateTime value from a string if the string matches the given date format and time format.

Idea for more readable implementation:
  - divide string into parts by a regexp [date_regexp]? [time_regexp]? [ampm_regexp]?
  - start by finding the time part, because it is unambiguous '([0-9]+:[0-9:.]+ ?[ap]?m?)$', before it is the date part
  - OR split by spaces - last segment is ampm token, second to last is time (with or without ampm), rest is date
If applied:
  - date parsing might work differently after these changes but still according to the docs
  - make sure to test edge cases like timeFormats: ['hh', 'ss.ss'] etc, string: '01-01-2019 AM', 'PM'

**Parameters:**

Name | Type |
------ | ------ |
`text` | string |
`dateFormat` | [Maybe](globals.md#maybe)‹string› |
`timeFormat` | [Maybe](globals.md#maybe)‹string› |

**Returns:** *[Maybe](globals.md#maybe)‹[DateTime](globals.md#datetime)›*

___

### defaultParseToTime 

▸ **defaultParseToTime**(`timeItems`: string[], `timeFormat`: [Maybe](globals.md#maybe)‹string›): *[Maybe](globals.md#maybe)‹[SimpleTime](interfaces/simpletime.md)›*

*Defined in [src/DateTimeDefault.ts:82](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeDefault.ts#L82)*

Parses a time value from a string if the string matches the given time format.

**Parameters:**

Name | Type |
------ | ------ |
`timeItems` | string[] |
`timeFormat` | [Maybe](globals.md#maybe)‹string› |

**Returns:** *[Maybe](globals.md#maybe)‹[SimpleTime](interfaces/simpletime.md)›*

___

### defaultStringifyCurrency 

▸ **defaultStringifyCurrency**(`_value`: number, `_formatArg`: string): *[Maybe](globals.md#maybe)‹string›*

*Defined in [src/format/format.ts:328](https://github.com/handsontable/hyperformula/blob/99a45ea/src/format/format.ts#L328)*

Default implementation of the `stringifyCurrency` config option.

Returning `undefined` instructs the formatter to fall through to the
built-in number formatter, preserving HyperFormula's zero-dependency
default behavior. Replace this default by setting the
[`stringifyCurrency`](../../api/interfaces/configparams.md#stringifycurrency)
config option.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`_value` | number | the numeric value to format (unused in default). |
`_formatArg` | string | the format string passed to `TEXT` (unused in default). |

**Returns:** *[Maybe](globals.md#maybe)‹string›*

`undefined` — caller should fall through to the built-in formatter.

___

### defaultStringifyDateTime 

▸ **defaultStringifyDateTime**(`dateTime`: [SimpleDateTime](globals.md#simpledatetime), `formatArg`: string): *[Maybe](globals.md#maybe)‹string›*

*Defined in [src/format/format.ts:224](https://github.com/handsontable/hyperformula/blob/99a45ea/src/format/format.ts#L224)*

Default `stringifyDateTime` callback — formats a date/time value against an
Excel-style format string (e.g. `YYYY-MM-DD HH:mm:ss`).

Returns `undefined` for format strings that are not date/time formats so the
dispatcher in `format()` can fall through to `parseForNumberFormat` (or to a
user-supplied `stringifyCurrency` callback for currency-tagged formats).

**LCID currency-tag guard** — explicitly returns `undefined` for Excel
currency tags `[$SYMBOL-LCID]` (non-empty SYMBOL portion). Without the
guard, `parseForDateTimeFormat` greedily consumes letters like `D`/`M`/`S`/`Y`/`H`
inside the currency code (e.g. `D` in USD, `H` in CHF, `M`+`D` in AMD),
mangling the output of an `[$USD-409] #,##0.00` format into
`[$US9-409] #,##0.00` because `D` is read as a day token. The pre-HF-24
behaviour was to mis-format; the guarded return is the deliberate
correction, not a regression. Bit-for-bit compatibility is preserved for
every non-currency format (dates, durations, `$#,##0.00`, etc.).

The guard pattern (`/\[\$[^\-\]]+-/`) requires ≥1 character between `[$`
and `-` so it distinguishes currency tags (`[$USD-409]`, `[$€-2]`) from
Excel's locale-only modifier (`[$-409]`, `[$-F800]`), which is valid on
date/time formats and must continue to flow through this function.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`dateTime` | [SimpleDateTime](globals.md#simpledatetime) | parsed date/time value to render |
`formatArg` | string | Excel-style format string |

**Returns:** *[Maybe](globals.md#maybe)‹string›*

formatted string, or `undefined` to defer to the next dispatch step

___

### defaultStringifyDuration 

▸ **defaultStringifyDuration**(`time`: [SimpleTime](interfaces/simpletime.md), `formatArg`: string): *[Maybe](globals.md#maybe)‹string›*

*Defined in [src/format/format.ts:132](https://github.com/handsontable/hyperformula/blob/99a45ea/src/format/format.ts#L132)*

Default `stringifyDuration` callback — formats a duration value against an
Excel-style time format string (e.g. `[hh]:mm:ss`).

Returns `undefined` for format strings that are not duration formats so the
dispatcher in `format()` can fall through to other handlers.

**LCID currency-tag guard** — sibling to the same guard in
`defaultStringifyDateTime`; explicitly returns `undefined` for Excel
currency tags `[$SYMBOL-LCID]` because the SYMBOL portion contains
duration-token letters (`H` in CHF/HUF, `m` in AMD/HMD) that
`parseForDateTimeFormat` would otherwise interpret as time tokens and
mangle the output. See `defaultStringifyDateTime` for the full
symbol-vs-locale-modifier rationale and the historical pre-HF-24
behaviour the guard corrects.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`time` | [SimpleTime](interfaces/simpletime.md) | parsed duration value to render |
`formatArg` | string | Excel-style format string |

**Returns:** *[Maybe](globals.md#maybe)‹string›*

formatted string, or `undefined` to defer to the next dispatch step

___

### doesContainRelativeReferences

▸ **doesContainRelativeReferences**(`ast`: Ast): *boolean*

*Defined in [src/NamedExpressions.ts:299](https://github.com/handsontable/hyperformula/blob/99a45ea/src/NamedExpressions.ts#L299)*

**Parameters:**

Name | Type |
------ | ------ |
`ast` | Ast |

**Returns:** *boolean*

___

### doesItLookLikeADateTimeQuickCheck 

▸ **doesItLookLikeADateTimeQuickCheck**(`text`: string): *boolean*

*Defined in [src/DateTimeDefault.ts:222](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeDefault.ts#L222)*

If this function returns false, the string is not parsable as a date time. Otherwise, it might be.
This is a quick check that is used to avoid running the more expensive parsing operations.

**Parameters:**

Name | Type |
------ | ------ |
`text` | string |

**Returns:** *boolean*

___

### empty 

▸ **empty**‹**T**›(): *IterableIterator‹T›*

*Defined in [src/generatorUtils.ts:8](https://github.com/handsontable/hyperformula/blob/99a45ea/src/generatorUtils.ts#L8)*

**Type parameters:**

▪ **T**

**Returns:** *IterableIterator‹T›*

___

### ensureFeatureAllowed 

▸ **ensureFeatureAllowed**(`config`: [Config](classes/config.md), `feature`: [FeatureId](enums/featureid.md)): *void*

*Defined in [src/license/ensureFeatureAllowed.ts:39](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/ensureFeatureAllowed.ts#L39)*

Throws [LicenseCapabilityMissingError](classes/licensecapabilitymissingerror.md) unless [isFeatureAllowed](globals.md#isfeatureallowed). When the key itself
blocks evaluation, the error names the key's state.

Shared by the build-time named-expressions check and `HyperFormula.ensureCapability`, so the two
cannot disagree about the same key.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`config` | [Config](classes/config.md) | the config whose resolved license is checked |
`feature` | [FeatureId](enums/featureid.md) | the gated feature being called  |

**Returns:** *void*

___

### entitlementOf 

▸ **entitlementOf**(`entry`: ProductEntitlement, `isTrial`: boolean, `silent`: boolean): *[LicenseEntitlement](interfaces/licenseentitlement.md)*

*Defined in [src/license/licenseResolution.ts:113](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/licenseResolution.ts#L113)*

Turns HyperFormula's entry of a valid entitlement key into the entitlement it grants.

This is fail-closed and silent: a token this version does not recognize grants nothing, without
a warning, a message, or anything public to read it back from. "Silent" there means the *grant* is silent — whether the
key's console messages are suppressed is decided solely by its `no-console-warns` flag, never
by the presence of an unrecognized token; coupling the two would suppress expiry notices as a
side effect of a vocabulary mismatch.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`entry` | ProductEntitlement | HyperFormula's entry of a valid key |
`isTrial` | boolean | whether the key carries the `trial` flag |
`silent` | boolean | whether the key closes the console channel  |

**Returns:** *[LicenseEntitlement](interfaces/licenseentitlement.md)*

___

### equalSimpleCellAddress

▸ **equalSimpleCellAddress**(`left`: [SimpleCellAddress](interfaces/simplecelladdress.md), `right`: [SimpleCellAddress](interfaces/simplecelladdress.md)): *boolean*

*Defined in [src/Cell.ts:226](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Cell.ts#L226)*

**Parameters:**

Name | Type |
------ | ------ |
`left` | [SimpleCellAddress](interfaces/simplecelladdress.md) |
`right` | [SimpleCellAddress](interfaces/simplecelladdress.md) |

**Returns:** *boolean*

___

### expiryClause 

▸ **expiryClause**(`days`: number): *string*

*Defined in [src/helpers/licenseKeyValidator.ts:83](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L83)*

The countdown of a trial notice: `expires today`, `expires in 1 day` or `expires in N days`.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`days` | number | the whole UTC days left until the last licensed day  |

**Returns:** *string*

___

### expiryOf 

▸ **expiryOf**(`entry`: ProductEntitlement): *[LicenseExpiry](interfaces/licenseexpiry.md)*

*Defined in [src/license/licenseResolution.ts:89](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/licenseResolution.ts#L89)*

The expiry details an entitlement records, read off HyperFormula's own entry.

A `release_until` date has no grace period: it is compared with the build date, which never
moves, so there is no window to be inside of.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`entry` | ProductEntitlement | HyperFormula's entry of an intact key  |

**Returns:** *[LicenseExpiry](interfaces/licenseexpiry.md)*

___

### extractTime 

▸ **extractTime**(`v`: any): *number*

*Defined in [src/helpers/licenseKeyHelper.ts:16](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyHelper.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`v` | any |

**Returns:** *number*

___

### filterDependenciesOutOfScope

▸ **filterDependenciesOutOfScope**(`deps`: [CellDependency](globals.md#celldependency)[]): *[CellDependency](globals.md#celldependency)[]*

*Defined in [src/absolutizeDependencies.ts:21](https://github.com/handsontable/hyperformula/blob/99a45ea/src/absolutizeDependencies.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`deps` | [CellDependency](globals.md#celldependency)[] |

**Returns:** *[CellDependency](globals.md#celldependency)[]*

___

### findBoundaries 

▸ **findBoundaries**(`sheet`: [Sheet](globals.md#sheet)): *[SheetBoundaries](interfaces/sheetboundaries.md)*

*Defined in [src/Sheet.ts:49](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Sheet.ts#L49)*

Returns actual width, height and fill ratio of a sheet

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`sheet` | [Sheet](globals.md#sheet) | two-dimmensional array sheet representation  |

**Returns:** *[SheetBoundaries](interfaces/sheetboundaries.md)*

___

### findInOrderedArray 

▸ **findInOrderedArray**(`key`: number, `values`: number[], `handlingMisses`: "lowerBound" | "upperBound"): *number*

*Defined in [src/Lookup/ColumnIndex.ts:339](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Lookup/ColumnIndex.ts#L339)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`key` | number | - |
`values` | number[] | - |
`handlingMisses` | "lowerBound" &#124; "upperBound" | "upperBound" |

**Returns:** *number*

___

### first 

▸ **first**‹**T**›(`iterable`: IterableIterator‹T›): *[Maybe](globals.md#maybe)‹T›*

*Defined in [src/generatorUtils.ts:22](https://github.com/handsontable/hyperformula/blob/99a45ea/src/generatorUtils.ts#L22)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`iterable` | IterableIterator‹T› |

**Returns:** *[Maybe](globals.md#maybe)‹T›*

___

### format 

▸ **format**(`value`: number, `formatArg`: string, `config`: [Config](classes/config.md), `dateHelper`: [DateTimeHelper](classes/datetimehelper.md)): *RawScalarValue*

*Defined in [src/format/format.ts:28](https://github.com/handsontable/hyperformula/blob/99a45ea/src/format/format.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`value` | number |
`formatArg` | string |
`config` | [Config](classes/config.md) |
`dateHelper` | [DateTimeHelper](classes/datetimehelper.md) |

**Returns:** *RawScalarValue*

___

### formatDate 

▸ **formatDate**(`date`: Date): *string*

*Defined in [src/helpers/licenseKeyValidator.ts:267](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L267)*

Formats a Date instance to hard-coded format MMMM DD, YYYY.

Read in UTC, not local time. Every date reaching this function is built at UTC midnight — the
legacy path from a whole number of days since the epoch, the entitlement-key path from a calendar
date in the payload — so local getters shifted the day backwards for anyone west of UTC and
printed an expiry one day earlier than the one the key actually carries.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`date` | Date | The date to format, at UTC midnight. |

**Returns:** *string*

The date as `MMMM DD, YYYY`.

___

### formatToken 

▸ **formatToken**(`type`: [TokenType](enums/tokentype.md), `value`: string): *[FormatToken](interfaces/formattoken.md)*

*Defined in [src/format/parser.ts:21](https://github.com/handsontable/hyperformula/blob/99a45ea/src/format/parser.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | [TokenType](enums/tokentype.md) |
`value` | string |

**Returns:** *[FormatToken](interfaces/formattoken.md)*

___

### getCellType

▸ **getCellType**(`vertex`: [Maybe](globals.md#maybe)‹CellVertex›, `address`: [SimpleCellAddress](interfaces/simplecelladdress.md)): *[CellType](classes/hyperformulans.md#static-celltype)*

*Defined in [src/Cell.ts:61](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Cell.ts#L61)*

**Parameters:**

Name | Type |
------ | ------ |
`vertex` | [Maybe](globals.md#maybe)‹CellVertex› |
`address` | [SimpleCellAddress](interfaces/simplecelladdress.md) |

**Returns:** *[CellType](classes/hyperformulans.md#static-celltype)*

___

### getCellValueDetailedType

▸ **getCellValueDetailedType**(`cellValue`: InterpreterValue): *[CellValueDetailedType](classes/hyperformulans.md#static-cellvaluedetailedtype)*

*Defined in [src/Cell.ts:133](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Cell.ts#L133)*

**Parameters:**

Name | Type |
------ | ------ |
`cellValue` | InterpreterValue |

**Returns:** *[CellValueDetailedType](classes/hyperformulans.md#static-cellvaluedetailedtype)*

___

### getCellValueFormat

▸ **getCellValueFormat**(`cellValue`: InterpreterValue): *string | undefined*

*Defined in [src/Cell.ts:141](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Cell.ts#L141)*

**Parameters:**

Name | Type |
------ | ------ |
`cellValue` | InterpreterValue |

**Returns:** *string | undefined*

___

### getCellValueType

▸ **getCellValueType**(`cellValue`: InterpreterValue): *[CellValueType](classes/hyperformulans.md#static-cellvaluetype)*

*Defined in [src/Cell.ts:113](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Cell.ts#L113)*

**Parameters:**

Name | Type |
------ | ------ |
`cellValue` | InterpreterValue |

**Returns:** *[CellValueType](classes/hyperformulans.md#static-cellvaluetype)*

___

### getDefaultConfig 

▸ **getDefaultConfig**(): *[ConfigParams](interfaces/configparams.md)*

*Defined in [src/Config.ts:407](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L407)*

**Returns:** *[ConfigParams](interfaces/configparams.md)*

___

### getFullConfigFromPartial 

▸ **getFullConfigFromPartial**(`partialConfig`: Partial‹[ConfigParams](interfaces/configparams.md)›): *[ConfigParams](interfaces/configparams.md)*

*Defined in [src/Config.ts:393](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Config.ts#L393)*

**Parameters:**

Name | Type |
------ | ------ |
`partialConfig` | Partial‹[ConfigParams](interfaces/configparams.md)› |

**Returns:** *[ConfigParams](interfaces/configparams.md)*

___

### instanceOfSimpleDate 

▸ **instanceOfSimpleDate**(`obj`: any): *obj is SimpleDate*

*Defined in [src/DateTimeHelper.ts:34](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeHelper.ts#L34)*

**Parameters:**

Name | Type |
------ | ------ |
`obj` | any |

**Returns:** *obj is SimpleDate*

___

### instanceOfSimpleTime 

▸ **instanceOfSimpleTime**(`obj`: any): *obj is SimpleTime*

*Defined in [src/DateTimeHelper.ts:43](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeHelper.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`obj` | any |

**Returns:** *obj is SimpleTime*

___

### invalidSimpleColumnAddress

▸ **invalidSimpleColumnAddress**(`address`: [SimpleColumnAddress](interfaces/simplecolumnaddress.md)): *boolean*

*Defined in [src/Cell.ts:190](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Cell.ts#L190)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleColumnAddress](interfaces/simplecolumnaddress.md) |

**Returns:** *boolean*

___

### invalidSimpleRowAddress

▸ **invalidSimpleRowAddress**(`address`: [SimpleRowAddress](interfaces/simplerowaddress.md)): *boolean*

*Defined in [src/Cell.ts:181](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Cell.ts#L181)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleRowAddress](interfaces/simplerowaddress.md) |

**Returns:** *boolean*

___

### isBoolean 

▸ **isBoolean**(`text`: string): *boolean*

*Defined in [src/CellContentParser.ts:81](https://github.com/handsontable/hyperformula/blob/99a45ea/src/CellContentParser.ts#L81)*

**Parameters:**

Name | Type |
------ | ------ |
`text` | string |

**Returns:** *boolean*

___

### isColOrRowInvalid

▸ **isColOrRowInvalid**(`address`: [SimpleCellAddress](interfaces/simplecelladdress.md)): *boolean*

*Defined in [src/Cell.ts:203](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Cell.ts#L203)*

Checks if the column or row id is negative.

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleCellAddress](interfaces/simplecelladdress.md) |

**Returns:** *boolean*

___

### isError 

▸ **isError**(`text`: string, `errorMapping`: Record‹string, [ErrorType](classes/hyperformulans.md#static-errortype)›): *boolean*

*Defined in [src/CellContentParser.ts:86](https://github.com/handsontable/hyperformula/blob/99a45ea/src/CellContentParser.ts#L86)*

**Parameters:**

Name | Type |
------ | ------ |
`text` | string |
`errorMapping` | Record‹string, [ErrorType](classes/hyperformulans.md#static-errortype)› |

**Returns:** *boolean*

___

### isEscapeToken 

▸ **isEscapeToken**(`token`: RegExpExecArray): *boolean*

*Defined in [src/format/parser.ts:131](https://github.com/handsontable/hyperformula/blob/99a45ea/src/format/parser.ts#L131)*

**Parameters:**

Name | Type |
------ | ------ |
`token` | RegExpExecArray |

**Returns:** *boolean*

___

### isFeatureAllowed 

▸ **isFeatureAllowed**(`config`: [Config](classes/config.md), `feature`: [FeatureId](enums/featureid.md)): *boolean*

*Defined in [src/license/ensureFeatureAllowed.ts:25](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/ensureFeatureAllowed.ts#L25)*

Whether the license lets the caller use `feature`. Checks both gates, in the same order the
interpreter does for functions:
- gate A first: a key whose state blocks evaluation (a missing or invalid key, an expired classic
  key, or a trial past its grace period) blocks every gated feature, whatever the entitlement says;
- then gate B: a key that evaluates must grant `feature`.

The one rule behind [ensureFeatureAllowed](globals.md#ensurefeatureallowed), the `isItPossibleTo*` predicates and
`isThereSomethingToUndo`/`isThereSomethingToRedo`, so a predicate never answers `true` for a call
that then throws a license error.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`config` | [Config](classes/config.md) | the config whose resolved license is checked |
`feature` | [FeatureId](enums/featureid.md) | the gated feature being asked about  |

**Returns:** *boolean*

___

### isFormula 

▸ **isFormula**(`text`: string): *boolean*

*Defined in [src/CellContentParser.ts:77](https://github.com/handsontable/hyperformula/blob/99a45ea/src/CellContentParser.ts#L77)*

Checks whether string looks like formula or not.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`text` | string | formula  |

**Returns:** *boolean*

___

### isNonnegativeInteger 

▸ **isNonnegativeInteger**(`x`: number): *boolean*

*Defined in [src/CrudOperations.ts:657](https://github.com/handsontable/hyperformula/blob/99a45ea/src/CrudOperations.ts#L657)*

**Parameters:**

Name | Type |
------ | ------ |
`x` | number |

**Returns:** *boolean*

___

### isPositiveInteger 

▸ **isPositiveInteger**(`x`: number): *boolean*

*Defined in [src/CrudOperations.ts:653](https://github.com/handsontable/hyperformula/blob/99a45ea/src/CrudOperations.ts#L653)*

**Parameters:**

Name | Type |
------ | ------ |
`x` | number |

**Returns:** *boolean*

___

### isRowOrColumnRange 

▸ **isRowOrColumnRange**(`leftCorner`: [SimpleCellAddress](interfaces/simplecelladdress.md), `width`: number, `height`: number): *boolean*

*Defined in [src/Operations.ts:1107](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Operations.ts#L1107)*

**Parameters:**

Name | Type |
------ | ------ |
`leftCorner` | [SimpleCellAddress](interfaces/simplecelladdress.md) |
`width` | number |
`height` | number |

**Returns:** *boolean*

___

### isSimpleCellAddress 

▸ **isSimpleCellAddress**(`obj`: unknown): *obj is SimpleCellAddress*

*Defined in [src/Cell.ts:214](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Cell.ts#L214)*

Checks if the object is a simple cell address.

**Parameters:**

Name | Type |
------ | ------ |
`obj` | unknown |

**Returns:** *obj is SimpleCellAddress*

___

### isSimpleCellRange 

▸ **isSimpleCellRange**(`val`: unknown): *val is SimpleCellRange*

*Defined in [src/AbsoluteCellRange.ts:34](https://github.com/handsontable/hyperformula/blob/99a45ea/src/AbsoluteCellRange.ts#L34)*

Type guard that checks if an object is a valid SimpleCellRange.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`val` | unknown | Value to check |

**Returns:** *val is SimpleCellRange*

True if and only if the object is a valid SimpleCellRange

___

### licenseAllowsFunction 

▸ **licenseAllowsFunction**(`registry`: [CapabilityRegistry](classes/capabilityregistry.md), `resolved`: [ResolvedCapabilities](interfaces/resolvedcapabilities.md), `canonicalFunctionId`: string): *boolean*

*Defined in [src/license/CapabilityRegistry.ts:160](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/CapabilityRegistry.ts#L160)*

Whether the license lets an instance evaluate — and therefore describe — the given function.

The rule both gate-B function call sites share: a function the capability table does not cover
at all is allowed. [CapabilityRegistry.capabilityOf](classes/capabilityregistry.md#capabilityof) returns `undefined` only for an id no
token lists, which the completeness invariant in `unit/license/capability-registry.spec.ts`
guarantees is not an unlisted built-in but a custom, instance-registered function — exempt from
gate B, because custom functions are never gated. Everything the table does cover has to be granted by the entitlement.

Extracted so the interpreter and the function metadata API cannot drift apart. The metadata API
exists to describe the functions an instance can actually evaluate, so a second spelling of this
rule would eventually let it advertise a function that then returns `#LIC!`.

Note this is gate B only: it says nothing about [LicenseKeyValidityState](enums/licensekeyvaliditystate.md). Callers that
also need gate A check it separately, because the two gates have different answers for the same
key — see the comment on `resolveLicense`.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`registry` | [CapabilityRegistry](classes/capabilityregistry.md) | the registry the capabilities were resolved against |
`resolved` | [ResolvedCapabilities](interfaces/resolvedcapabilities.md) | the instance's resolved capabilities |
`canonicalFunctionId` | string | the function id, already resolved through the alias map  |

**Returns:** *boolean*

___

### matchDateFormat 

▸ **matchDateFormat**(`str`: string): *RegExpExecArray[]*

*Defined in [src/format/parser.ts:39](https://github.com/handsontable/hyperformula/blob/99a45ea/src/format/parser.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *RegExpExecArray[]*

___

### matchNumberFormat 

▸ **matchNumberFormat**(`str`: string): *RegExpExecArray[]*

*Defined in [src/format/parser.ts:55](https://github.com/handsontable/hyperformula/blob/99a45ea/src/format/parser.ts#L55)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *RegExpExecArray[]*

___

### memoize 

▸ **memoize**‹**T**›(`fn`: function): *(Anonymous function)*

*Defined in [src/DateTimeDefault.ts:229](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeDefault.ts#L229)*

Function memoization for improved performance.

**Type parameters:**

▪ **T**

**Parameters:**

▪ **fn**: *function*

▸ (`arg`: string): *T*

**Parameters:**

Name | Type |
------ | ------ |
`arg` | string |

**Returns:** *(Anonymous function)*

___

### movedSimpleCellAddress

▸ **movedSimpleCellAddress**(`address`: [SimpleCellAddress](interfaces/simplecelladdress.md), `toSheet`: number, `toRight`: number, `toBottom`: number): *[SimpleCellAddress](interfaces/simplecelladdress.md)*

*Defined in [src/Cell.ts:205](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Cell.ts#L205)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleCellAddress](interfaces/simplecelladdress.md) |
`toSheet` | number |
`toRight` | number |
`toBottom` | number |

**Returns:** *[SimpleCellAddress](interfaces/simplecelladdress.md)*

___

### normalizeAddedIndexes 

▸ **normalizeAddedIndexes**(`indexes`: [ColumnRowIndex](globals.md#columnrowindex)[]): *[ColumnRowIndex](globals.md#columnrowindex)[]*

*Defined in [src/Operations.ts:1075](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Operations.ts#L1075)*

**Parameters:**

Name | Type |
------ | ------ |
`indexes` | [ColumnRowIndex](globals.md#columnrowindex)[] |

**Returns:** *[ColumnRowIndex](globals.md#columnrowindex)[]*

___

### normalizeCapabilityToken 

▸ **normalizeCapabilityToken**(`token`: string): *string*

*Defined in [src/license/capabilities.ts:80](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/capabilities.ts#L80)*

The canonical spelling of a capability token for table lookups.

Token names are case-insensitive — the packaging doc states it outright for its `fun:*`
vocabulary, and tolerating case on the other tokens costs nothing since none of them collide
under lowercasing. Surrounding whitespace is trimmed because a key's token list is text a human
edited somewhere upstream: `'feat:crud '` is the token its author meant, and a padded spelling
that silently grants nothing is a support ticket, not a license restriction.

Normalization happens at LOOKUP, never at storage: an entitlement carries the key's own
spellings (they are diagnostics), and [CAPABILITY_TABLE](globals.md#const-capability_table) is keyed by the normalized form.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`token` | string | a capability token as the key spells it  |

**Returns:** *string*

___

### normalizeRemovedIndexes 

▸ **normalizeRemovedIndexes**(`indexes`: [ColumnRowIndex](globals.md#columnrowindex)[]): *[ColumnRowIndex](globals.md#columnrowindex)[]*

*Defined in [src/Operations.ts:1044](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Operations.ts#L1044)*

**Parameters:**

Name | Type |
------ | ------ |
`indexes` | [ColumnRowIndex](globals.md#columnrowindex)[] |

**Returns:** *[ColumnRowIndex](globals.md#columnrowindex)[]*

___

### notifyEntitlementKey 

▸ **notifyEntitlementKey**(`state`: LicenseState, `params`: [EntitlementMessageParams](interfaces/entitlementmessageparams.md)): *void*

*Defined in [src/helpers/licenseKeyValidator.ts:185](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L185)*

Prints the console message for an entitlement key's lifecycle state, every time a key is
resolved: unlike classic keys, entitlement keys keep no record of what they already printed.
States inside the term print nothing.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`state` | LicenseState | the reader's lifecycle state |
`params` | [EntitlementMessageParams](interfaces/entitlementmessageparams.md) | the key's own date and days remaining  |

**Returns:** *void*

___

### notifyLicenseKeyState 

▸ **notifyLicenseKeyState**(`state`: [LicenseKeyValidityState](enums/licensekeyvaliditystate.md), `keyValidityDate?`: Date): *void*

*Defined in [src/helpers/licenseKeyValidator.ts:166](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L166)*

Prints the console message for a classic 25-character key's non-valid state, at most once per
page load. Entitlement keys do not go through this function.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`state` | [LicenseKeyValidityState](enums/licensekeyvaliditystate.md) | the state to report; `VALID` prints nothing |
`keyValidityDate?` | Date | - |

**Returns:** *void*

___

### notifyUnlicensedEntitlementKey 

▸ **notifyUnlicensedEntitlementKey**(`reason`: UnlicensedReason): *void*

*Defined in [src/helpers/licenseKeyValidator.ts:199](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L199)*

Prints the console message for an entitlement key that does not license HyperFormula, every
time such a key is resolved.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`reason` | UnlicensedReason | why the reader does not license HyperFormula with the key  |

**Returns:** *void*

___

### numberFormat 

▸ **numberFormat**(`tokens`: [FormatToken](interfaces/formattoken.md)[], `value`: number): *RawScalarValue*

*Defined in [src/format/format.ts:78](https://github.com/handsontable/hyperformula/blob/99a45ea/src/format/format.ts#L78)*

**Parameters:**

Name | Type |
------ | ------ |
`tokens` | [FormatToken](interfaces/formattoken.md)[] |
`value` | number |

**Returns:** *RawScalarValue*

___

### numberToSimpleTime 

▸ **numberToSimpleTime**(`arg`: number): *[SimpleTime](interfaces/simpletime.md)*

*Defined in [src/DateTimeHelper.ts:304](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeHelper.ts#L304)*

**Parameters:**

Name | Type |
------ | ------ |
`arg` | number |

**Returns:** *[SimpleTime](interfaces/simpletime.md)*

___

### objectDestroy 

▸ **objectDestroy**(`object`: any): *void*

*Defined in [src/Destroy.ts:6](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Destroy.ts#L6)*

**`license`** 
Copyright (c) 2025 Handsoncode. All rights reserved.

**Parameters:**

Name | Type |
------ | ------ |
`object` | any |

**Returns:** *void*

___

### offsetMonth 

▸ **offsetMonth**(`date`: [SimpleDate](interfaces/simpledate.md), `offset`: number): *[SimpleDate](interfaces/simpledate.md)*

*Defined in [src/DateTimeHelper.ts:286](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeHelper.ts#L286)*

**Parameters:**

Name | Type |
------ | ------ |
`date` | [SimpleDate](interfaces/simpledate.md) |
`offset` | number |

**Returns:** *[SimpleDate](interfaces/simpledate.md)*

___

### padLeft 

▸ **padLeft**(`number`: number | string, `size`: number): *string*

*Defined in [src/format/format.ts:58](https://github.com/handsontable/hyperformula/blob/99a45ea/src/format/format.ts#L58)*

**Parameters:**

Name | Type |
------ | ------ |
`number` | number &#124; string |
`size` | number |

**Returns:** *string*

___

### padRight 

▸ **padRight**(`number`: number | string, `size`: number): *string*

*Defined in [src/format/format.ts:66](https://github.com/handsontable/hyperformula/blob/99a45ea/src/format/format.ts#L66)*

**Parameters:**

Name | Type |
------ | ------ |
`number` | number &#124; string |
`size` | number |

**Returns:** *string*

___

### parse 

▸ **parse**(`str`: string): *[FormatExpression](interfaces/formatexpression.md)*

*Defined in [src/format/parser.ts:121](https://github.com/handsontable/hyperformula/blob/99a45ea/src/format/parser.ts#L121)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *[FormatExpression](interfaces/formatexpression.md)*

___

### parseDateFormat 

▸ **parseDateFormat**(`dateFormat`: string): *object*

*Defined in [src/DateTimeDefault.ts:206](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeDefault.ts#L206)*

Parses a date format string into a format object.

**Parameters:**

Name | Type |
------ | ------ |
`dateFormat` | string |

**Returns:** *object*

* **dayItem**: *number*

* **itemsCount**: *number*

* **longYearItem**: *number*

* **monthItem**: *number*

* **shortYearItem**: *number*

___

### parseForDateTimeFormat 

▸ **parseForDateTimeFormat**(`str`: string): *[Maybe](globals.md#maybe)‹[FormatExpression](interfaces/formatexpression.md)›*

*Defined in [src/format/parser.ts:96](https://github.com/handsontable/hyperformula/blob/99a45ea/src/format/parser.ts#L96)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *[Maybe](globals.md#maybe)‹[FormatExpression](interfaces/formatexpression.md)›*

___

### parseForNumberFormat 

▸ **parseForNumberFormat**(`str`: string): *[Maybe](globals.md#maybe)‹[FormatExpression](interfaces/formatexpression.md)›*

*Defined in [src/format/parser.ts:109](https://github.com/handsontable/hyperformula/blob/99a45ea/src/format/parser.ts#L109)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *[Maybe](globals.md#maybe)‹[FormatExpression](interfaces/formatexpression.md)›*

___

### parseTimeFormat 

▸ **parseTimeFormat**(`timeFormat`: string): *object*

*Defined in [src/DateTimeDefault.ts:186](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeDefault.ts#L186)*

Parses a time format string into a format object.

**Parameters:**

Name | Type |
------ | ------ |
`timeFormat` | string |

**Returns:** *object*

* **hourItem**: *number*

* **itemsCount**: *number*

* **minuteItem**: *number*

* **secondItem**: *number*

___

### postMortem 

▸ **postMortem**(`method`: any): *(Anonymous function)*

*Defined in [src/Destroy.ts:16](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Destroy.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`method` | any |

**Returns:** *(Anonymous function)*

___

### printNotification 

▸ **printNotification**(`severity`: "warn" | "error", `text`: string): *void*

*Defined in [src/helpers/licenseKeyValidator.ts:211](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L211)*

Prints `text` on the console channel that matches `severity`.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`severity` | "warn" &#124; "error" | `warn` while the license still works, `error` once it does not |
`text` | string | the message  |

**Returns:** *void*

___

### replacer 

▸ **replacer**(`key`: string, `val`: any): *any*

*Defined in [src/errors.ts:136](https://github.com/handsontable/hyperformula/blob/99a45ea/src/errors.ts#L136)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | string |
`val` | any |

**Returns:** *any*

___

### resolveLicense 

▸ **resolveLicense**(`licenseKey`: string, `notifyConsole`: boolean): *[ResolvedLicense](interfaces/resolvedlicense.md)*

*Defined in [src/license/licenseResolution.ts:165](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/licenseResolution.ts#L165)*

Resolves a license key into both gates' inputs.

Routing follows the vendored {@link detectLicenseKeyFormat}, whose test order is normative: the
literals, then the trailing bracketed block that marks an
entitlement key, then the legacy 25-character shape. Everything that is not an entitlement key
— `gpl-v3`, a legacy key, an empty string — falls through to [checkLicenseKeyValidity](globals.md#checklicensekeyvalidity)
completely unchanged, which is what keeps this from touching existing behavior. A string that
carries a bracketed block routes here even when the block is garbage: such a key is INVALID,
not a legacy key that happens to contain brackets.

An entitlement key is read by the vendored {@link readEntitlementLicense}, the single entry
point upstream prescribes for products: it verifies the key (the checksum and the prose
digest), picks HyperFormula's entry, places it in its lifecycle window and reads its flags. Only
the meaning of the capability tokens and the console messages live here.

**The invariant this function exists to protect.** Only an entitlement key that lets this build
evaluate — a valid one, or an expired one whose [LIFECYCLE_VERDICTS](globals.md#const-lifecycle_verdicts) entry does not
block — resolves to a restricted entitlement, and an expired one keeps exactly the grants it had
while current. Every key that blocks evaluation (a missing or invalid key, an expired classic key,
or a trial past its grace period) resolves to
[unrestrictedEntitlement](globals.md#unrestrictedentitlement), and so does every classic key. A key that blocks is stopped by
gate A alone, through `blocksEvaluation`: formulas yield `#LIC!` and every gated API feature throws
with the key's state (see `ensureFeatureAllowed`). Gate B never reports such a key, so its "not
included in your license" error is reserved for a key that evaluates but lacks the grant. The fail-closed rule governs unrecognized tokens INSIDE an otherwise valid key; it is not
a rule about invalid keys.

A checksum-valid key whose payload shape cannot be read is INVALID, not a crash and not a free
pass: every payload field is untrusted, so nothing here may assume a shape the vendored reader
has not verified.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`licenseKey` | string | - | the raw `licenseKey` config value |
`notifyConsole` | boolean | true | pass `false` for a resolution whose result exists only to be thrown away (e.g. the transient serialization-only `Config` that `rebuildWithConfig` builds from the OUTGOING config) — such a resolution must not print notices for a key the caller is in the middle of replacing. Legacy keys notify inside [checkLicenseKeyValidity](globals.md#checklicensekeyvalidity) behind a once-per-page-load flag, so they cannot double-print regardless of this parameter.  |

**Returns:** *[ResolvedLicense](interfaces/resolvedlicense.md)*

___

### roundToEpsilon 

▸ **roundToEpsilon**(`arg`: number, `epsilon`: number): *number*

*Defined in [src/DateTimeHelper.ts:299](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeHelper.ts#L299)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`arg` | number | - |
`epsilon` | number | 1 |

**Returns:** *number*

___

### roundToNearestSecond 

▸ **roundToNearestSecond**(`arg`: number): *number*

*Defined in [src/DateTimeHelper.ts:295](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeHelper.ts#L295)*

**Parameters:**

Name | Type |
------ | ------ |
`arg` | number |

**Returns:** *number*

___

### simpleCellAddress

▸ **simpleCellAddress**(`sheet`: number, `col`: number, `row`: number): *[SimpleCellAddress](interfaces/simplecelladdress.md)*

*Defined in [src/Cell.ts:198](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Cell.ts#L198)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`col` | number |
`row` | number |

**Returns:** *[SimpleCellAddress](interfaces/simplecelladdress.md)*

___

### simpleCellRange

▸ **simpleCellRange**(`start`: [SimpleCellAddress](interfaces/simplecelladdress.md), `end`: [SimpleCellAddress](interfaces/simplecelladdress.md)): *object*

*Defined in [src/AbsoluteCellRange.ts:43](https://github.com/handsontable/hyperformula/blob/99a45ea/src/AbsoluteCellRange.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`start` | [SimpleCellAddress](interfaces/simplecelladdress.md) |
`end` | [SimpleCellAddress](interfaces/simplecelladdress.md) |

**Returns:** *object*

* **end**: *[SimpleCellAddress](interfaces/simplecelladdress.md)*

* **start**: *[SimpleCellAddress](interfaces/simplecelladdress.md)*

___

### simpleColumnAddress

▸ **simpleColumnAddress**(`sheet`: number, `col`: number): *[SimpleColumnAddress](interfaces/simplecolumnaddress.md)*

*Defined in [src/Cell.ts:188](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Cell.ts#L188)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`col` | number |

**Returns:** *[SimpleColumnAddress](interfaces/simplecolumnaddress.md)*

___

### simpleRowAddress

▸ **simpleRowAddress**(`sheet`: number, `row`: number): *[SimpleRowAddress](interfaces/simplerowaddress.md)*

*Defined in [src/Cell.ts:179](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Cell.ts#L179)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`row` | number |

**Returns:** *[SimpleRowAddress](interfaces/simplerowaddress.md)*

___

### split 

▸ **split**‹**T**›(`iterable`: IterableIterator‹T›): *object*

*Defined in [src/generatorUtils.ts:11](https://github.com/handsontable/hyperformula/blob/99a45ea/src/generatorUtils.ts#L11)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`iterable` | IterableIterator‹T› |

**Returns:** *object*

* **rest**: *IterableIterator‹T›*

* **value**? : *T*

___

### subscriptionExpiredMessage 

▸ **subscriptionExpiredMessage**(`__namedParameters`: object): *string*

*Defined in [src/helpers/licenseKeyValidator.ts:92](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L92)*

The message of a subscription past its `usage_until` date, inside its grace period or after it.

**Parameters:**

▪ **__namedParameters**: *object*

Name | Type |
------ | ------ |
`licensedUntil` | string |

**Returns:** *string*

___

### timeToNumber 

▸ **timeToNumber**(`time`: [SimpleTime](interfaces/simpletime.md)): *number*

*Defined in [src/DateTimeHelper.ts:315](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeHelper.ts#L315)*

**Parameters:**

Name | Type |
------ | ------ |
`time` | [SimpleTime](interfaces/simpletime.md) |

**Returns:** *number*

___

### toBasisEU 

▸ **toBasisEU**(`date`: [SimpleDate](interfaces/simpledate.md)): *[SimpleDate](interfaces/simpledate.md)*

*Defined in [src/DateTimeHelper.ts:319](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeHelper.ts#L319)*

**Parameters:**

Name | Type |
------ | ------ |
`date` | [SimpleDate](interfaces/simpledate.md) |

**Returns:** *[SimpleDate](interfaces/simpledate.md)*

___

### truncateDayInMonth 

▸ **truncateDayInMonth**(`date`: [SimpleDate](interfaces/simpledate.md)): *[SimpleDate](interfaces/simpledate.md)*

*Defined in [src/DateTimeHelper.ts:291](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeHelper.ts#L291)*

**Parameters:**

Name | Type |
------ | ------ |
`date` | [SimpleDate](interfaces/simpledate.md) |

**Returns:** *[SimpleDate](interfaces/simpledate.md)*

___

### unrestrictedEntitlement 

▸ **unrestrictedEntitlement**(): *[LicenseEntitlement](interfaces/licenseentitlement.md)*

*Defined in [src/license/LicenseEntitlement.ts:86](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/LicenseEntitlement.ts#L86)*

The unrestricted entitlement: classic keys, `gpl-v3`, and every key that blocks evaluation (a
missing or invalid key, an expired classic key, or a trial past its grace period) resolve to
this. An entitlement key that has expired but keeps evaluating does not: it keeps its own grants.

Unrecognized tokens fail closed and silently, so an entitlement key whose tokens this library
version does not recognize at all does not map here — it resolves to an entitlement with an empty,
silent capability set instead of falling back to unrestricted access. Do not reuse this
function for that case.

**Returns:** *[LicenseEntitlement](interfaces/licenseentitlement.md)*

___

### utcDay 

▸ **utcDay**(`isoDate`: string): *string*

*Defined in [src/helpers/licenseKeyValidator.ts:74](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L74)*

Formats a `usage_until` date for a message. It is compared against the clock in UTC, so it is
printed with the marker; a `release_until` date involves no clock and is printed without one.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`isoDate` | string | the date as the key carries it, `YYYY-MM-DD`  |

**Returns:** *string*

___

### validateArgToType 

▸ **validateArgToType**(`inputValue`: any, `expectedType`: string, `paramName`: string): *void*

*Defined in [src/ArgumentSanitization.ts:81](https://github.com/handsontable/hyperformula/blob/99a45ea/src/ArgumentSanitization.ts#L81)*

**Parameters:**

Name | Type |
------ | ------ |
`inputValue` | any |
`expectedType` | string |
`paramName` | string |

**Returns:** *void*

___

### validateAsSheet 

▸ **validateAsSheet**(`sheet`: [Sheet](globals.md#sheet)): *void*

*Defined in [src/Sheet.ts:33](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Sheet.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | [Sheet](globals.md#sheet) |

**Returns:** *void*

___

### validateNumberToBeAtLeast 

▸ **validateNumberToBeAtLeast**(`value`: number, `paramName`: string, `minimum`: number): *void*

*Defined in [src/ArgumentSanitization.ts:34](https://github.com/handsontable/hyperformula/blob/99a45ea/src/ArgumentSanitization.ts#L34)*

**Parameters:**

Name | Type |
------ | ------ |
`value` | number |
`paramName` | string |
`minimum` | number |

**Returns:** *void*

___

### validateNumberToBeAtMost 

▸ **validateNumberToBeAtMost**(`value`: number, `paramName`: string, `maximum`: number): *void*

*Defined in [src/ArgumentSanitization.ts:40](https://github.com/handsontable/hyperformula/blob/99a45ea/src/ArgumentSanitization.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`value` | number |
`paramName` | string |
`maximum` | number |

**Returns:** *void*

## Object literals

### CellValueDetailedType

### ▪ **CellValueDetailedType**: *object*

*Defined in [src/Cell.ts:95](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Cell.ts#L95)*

___

### CellValueType

### ▪ **CellValueType**: *object*

*Defined in [src/Cell.ts:92](https://github.com/handsontable/hyperformula/blob/99a45ea/src/Cell.ts#L92)*

___

### ENTITLEMENT_CONSOLE_NOTIFICATIONS

### ▪ **ENTITLEMENT_CONSOLE_NOTIFICATIONS**: *object*

*Defined in [src/helpers/licenseKeyValidator.ts:104](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L104)*

The console message for each entitlement-key lifecycle state that talks to the developer: the
specification's text (as the vendored reader's README carries it), the same
table Handsontable prints (`handsontable/src/helpers/mixed.ts`, `entitlementConsoleNotifications`),
so one key reads the same in both products. Silent states (inside the term, a build covered by its
maintenance date) have no entry. A non-trial key past its grace keeps the soft-stop message: it
never blocks a paying customer.

▪ **release_expired**: *object*

*Defined in [src/helpers/licenseKeyValidator.ts:124](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L124)*

* **severity**: *"error"* = "error"

* **message**(`__namedParameters`: object): *string*

▪ **trial_hard_stop**: *object*

*Defined in [src/helpers/licenseKeyValidator.ts:114](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L114)*

* **severity**: *"error"* = "error"

* **message**(`__namedParameters`: object): *string*

▪ **trial_notice**: *object*

*Defined in [src/helpers/licenseKeyValidator.ts:105](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L105)*

* **severity**: *"warn"* = "warn"

* **message**(`__namedParameters`: object): *string*

▪ **trial_soft_stop**: *object*

*Defined in [src/helpers/licenseKeyValidator.ts:110](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L110)*

* **severity**: *"error"* = "error"

* **message**(`__namedParameters`: object): *string*

▪ **usage_hard_stop**: *object*

*Defined in [src/helpers/licenseKeyValidator.ts:123](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L123)*

* **message**: *[subscriptionExpiredMessage](globals.md#subscriptionexpiredmessage)* = subscriptionExpiredMessage

* **severity**: *"error"* = "error"

▪ **usage_notice**: *object*

*Defined in [src/helpers/licenseKeyValidator.ts:118](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L118)*

* **severity**: *"warn"* = "warn"

* **message**(`__namedParameters`: object): *string*

▪ **usage_soft_stop**: *object*

*Defined in [src/helpers/licenseKeyValidator.ts:122](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L122)*

* **message**: *[subscriptionExpiredMessage](globals.md#subscriptionexpiredmessage)* = subscriptionExpiredMessage

* **severity**: *"error"* = "error"

___

### LIFECYCLE_VERDICTS

### ▪ **LIFECYCLE_VERDICTS**: *object*

*Defined in [src/license/licenseResolution.ts:49](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/licenseResolution.ts#L49)*

The verdict for every lifecycle state the vendored reader reports. A `Record` over
{@link LicenseState}, so a state added upstream fails compilation here until it is classified,
instead of falling into a default.

- The valid and notice states, and `release_valid`, report VALID and evaluate.
- The soft-stop states report VALID and evaluate on purpose: the grace period keeps working and
  prints the specification's error (see `notifyEntitlementKey`).
- A subscription past its grace period (`usage_hard_stop`) and a key whose `release_until` is
  before the build (`release_expired`) report EXPIRED but keep evaluating, printing an error to
  the console instead. An expired license never blocks a paying customer, as the reader's guide
  and the key specification both say. Such a key keeps its own grants: the reader reports it as
  licensed, so it is never granted more than the same key was granted while it was current.
- A trial past its grace period (`trial_hard_stop`) reports EXPIRED and blocks.

▪ **release_expired**: *object*

*Defined in [src/license/licenseResolution.ts:59](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/licenseResolution.ts#L59)*

* **blocksEvaluation**: *false* = false

* **validityState**: *[EXPIRED](enums/licensekeyvaliditystate.md#expired)* = LicenseKeyValidityState.EXPIRED

▪ **release_valid**: *object*

*Defined in [src/license/licenseResolution.ts:58](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/licenseResolution.ts#L58)*

* **blocksEvaluation**: *false* = false

* **validityState**: *[VALID](enums/licensekeyvaliditystate.md#valid)* = LicenseKeyValidityState.VALID

▪ **trial_hard_stop**: *object*

*Defined in [src/license/licenseResolution.ts:57](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/licenseResolution.ts#L57)*

* **blocksEvaluation**: *true* = true

* **validityState**: *[EXPIRED](enums/licensekeyvaliditystate.md#expired)* = LicenseKeyValidityState.EXPIRED

▪ **trial_notice**: *object*

*Defined in [src/license/licenseResolution.ts:55](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/licenseResolution.ts#L55)*

* **blocksEvaluation**: *false* = false

* **validityState**: *[VALID](enums/licensekeyvaliditystate.md#valid)* = LicenseKeyValidityState.VALID

▪ **trial_soft_stop**: *object*

*Defined in [src/license/licenseResolution.ts:56](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/licenseResolution.ts#L56)*

* **blocksEvaluation**: *false* = false

* **validityState**: *[VALID](enums/licensekeyvaliditystate.md#valid)* = LicenseKeyValidityState.VALID

▪ **trial_valid**: *object*

*Defined in [src/license/licenseResolution.ts:54](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/licenseResolution.ts#L54)*

* **blocksEvaluation**: *false* = false

* **validityState**: *[VALID](enums/licensekeyvaliditystate.md#valid)* = LicenseKeyValidityState.VALID

▪ **usage_hard_stop**: *object*

*Defined in [src/license/licenseResolution.ts:53](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/licenseResolution.ts#L53)*

* **blocksEvaluation**: *false* = false

* **validityState**: *[EXPIRED](enums/licensekeyvaliditystate.md#expired)* = LicenseKeyValidityState.EXPIRED

▪ **usage_notice**: *object*

*Defined in [src/license/licenseResolution.ts:51](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/licenseResolution.ts#L51)*

* **blocksEvaluation**: *false* = false

* **validityState**: *[VALID](enums/licensekeyvaliditystate.md#valid)* = LicenseKeyValidityState.VALID

▪ **usage_soft_stop**: *object*

*Defined in [src/license/licenseResolution.ts:52](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/licenseResolution.ts#L52)*

* **blocksEvaluation**: *false* = false

* **validityState**: *[VALID](enums/licensekeyvaliditystate.md#valid)* = LicenseKeyValidityState.VALID

▪ **usage_valid**: *object*

*Defined in [src/license/licenseResolution.ts:50](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/licenseResolution.ts#L50)*

* **blocksEvaluation**: *false* = false

* **validityState**: *[VALID](enums/licensekeyvaliditystate.md#valid)* = LicenseKeyValidityState.VALID

___

### UNLICENSED_CONSOLE_NOTIFICATIONS

### ▪ **UNLICENSED_CONSOLE_NOTIFICATIONS**: *object*

*Defined in [src/helpers/licenseKeyValidator.ts:134](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L134)*

The console message for each reason an entitlement key does not license HyperFormula. Both are
errors: neither key evaluates formulas.

▪ **product_missing**: *object*

*Defined in [src/helpers/licenseKeyValidator.ts:139](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L139)*

* **severity**: *"error"* = "error"

* **message**(): *string*

▪ **unreadable**: *object*

*Defined in [src/helpers/licenseKeyValidator.ts:135](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L135)*

* **severity**: *"error"* = "error"

* **message**(): *string*

___

### consoleMessages

### ▪ **consoleMessages**: *object*

*Defined in [src/helpers/licenseKeyValidator.ts:37](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L37)*

List of all not valid messages which may occur.

### expired 

▸ **expired**(`__namedParameters`: object): *string*

*Defined in [src/helpers/licenseKeyValidator.ts:39](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L39)*

**Parameters:**

▪ **__namedParameters**: *object*

Name | Type |
------ | ------ |
`keyValidityDate` | string |

**Returns:** *string*

### invalid 

▸ **invalid**(): *string*

*Defined in [src/helpers/licenseKeyValidator.ts:38](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L38)*

**Returns:** *string*

### missing 

▸ **missing**(): *string*

*Defined in [src/helpers/licenseKeyValidator.ts:41](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L41)*

**Returns:** *string*

___

### maxDate

### ▪ **maxDate**: *object*

*Defined in [src/DateTimeHelper.ts:51](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeHelper.ts#L51)*

### day 

• **day**: *number* = 31

*Defined in [src/DateTimeHelper.ts:51](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeHelper.ts#L51)*

### month 

• **month**: *number* = 12

*Defined in [src/DateTimeHelper.ts:51](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeHelper.ts#L51)*

### year 

• **year**: *number* = 9999

*Defined in [src/DateTimeHelper.ts:51](https://github.com/handsontable/hyperformula/blob/99a45ea/src/DateTimeHelper.ts#L51)*
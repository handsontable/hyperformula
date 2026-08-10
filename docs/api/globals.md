# API Reference Overview 

## Type aliases

### CellDependency 

Ƭ **CellDependency**: *[SimpleCellAddress](interfaces/simplecelladdress.md) | [AbsoluteCellRange](classes/absolutecellrange.md) | NamedExpressionDependency*

*Defined in [src/CellDependency.ts:10](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CellDependency.ts#L10)*

___

### CellValue 

Ƭ **CellValue**: *[NoErrorCellValue](globals.md#noerrorcellvalue) | [DetailedCellError](classes/detailedcellerror.md)*

*Defined in [src/CellValue.ts:9](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CellValue.ts#L9)*

___

### CellValueDetailedType 

Ƭ **CellValueDetailedType**: *[CellValueNoNumber](enums/cellvaluenonumber.md) | NumberType*

*Defined in [src/Cell.ts:94](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L94)*

___

### CellValueType 

Ƭ **CellValueType**: *[CellValueNoNumber](enums/cellvaluenonumber.md) | [CellValueJustNumber](enums/cellvaluejustnumber.md)*

*Defined in [src/Cell.ts:91](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L91)*

___

### ChangeList 

Ƭ **ChangeList**: *[CellValueChange](interfaces/cellvaluechange.md)[]*

*Defined in [src/ContentChanges.ts:20](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ContentChanges.ts#L20)*

___

### ClipboardCell 

Ƭ **ClipboardCell**: *[ClipboardCellValue](interfaces/clipboardcellvalue.md) | [ClipboardCellFormula](interfaces/clipboardcellformula.md) | [ClipboardCellEmpty](interfaces/clipboardcellempty.md) | [ClipboardCellParsingError](interfaces/clipboardcellparsingerror.md)*

*Defined in [src/ClipboardOperations.ts:16](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ClipboardOperations.ts#L16)*

___

### ColumnMap 

Ƭ **ColumnMap**: *Map‹RawInterpreterValue, [ValueIndex](interfaces/valueindex.md)›*

*Defined in [src/Lookup/ColumnIndex.ts:30](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnIndex.ts#L30)*

___

### ColumnRowIndex 

Ƭ **ColumnRowIndex**: *[number, number]*

*Defined in [src/CrudOperations.ts:65](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L65)*

___

### ConfigParamsList 

Ƭ **ConfigParamsList**: *keyof ConfigParams*

*Defined in [src/ConfigParams.ts:450](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ConfigParams.ts#L450)*

___

### ConsoleMessages 

Ƭ **ConsoleMessages**: *object*

*Defined in [src/helpers/licenseKeyValidator.ts:24](https://github.com/handsontable/hyperformula/blob/af2d59d/src/helpers/licenseKeyValidator.ts#L24)*

#### Type declaration:

___

### DateTime 

Ƭ **DateTime**: *[SimpleTime](interfaces/simpletime.md) | [SimpleDate](interfaces/simpledate.md) | [SimpleDateTime](globals.md#simpledatetime)*

*Defined in [src/DateTimeHelper.ts:31](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L31)*

___

### Dependencies 

Ƭ **Dependencies**: *Map‹Vertex, [CellDependency](globals.md#celldependency)[]›*

*Defined in [src/GraphBuilder.ts:25](https://github.com/handsontable/hyperformula/blob/af2d59d/src/GraphBuilder.ts#L25)*

___

### EngineState 

Ƭ **EngineState**: *object*

*Defined in [src/BuildEngineFactory.ts:33](https://github.com/handsontable/hyperformula/blob/af2d59d/src/BuildEngineFactory.ts#L33)*

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

*Defined in [src/Exporter.ts:18](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Exporter.ts#L18)*

___

### LicenseKeyInvalidState 

Ƭ **LicenseKeyInvalidState**: *Exclude‹[LicenseKeyValidityState](enums/licensekeyvaliditystate.md), [VALID](enums/licensekeyvaliditystate.md#valid)›*

*Defined in [src/helpers/licenseKeyValidator.ts:18](https://github.com/handsontable/hyperformula/blob/af2d59d/src/helpers/licenseKeyValidator.ts#L18)*

___

### Maybe 

Ƭ **Maybe**: *T | undefined*

*Defined in [src/Maybe.ts:6](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Maybe.ts#L6)*

**`license`** 
Copyright (c) 2025 Handsoncode. All rights reserved.

___

### MessageDescriptor 

Ƭ **MessageDescriptor**: *object*

*Defined in [src/helpers/licenseKeyValidator.ts:28](https://github.com/handsontable/hyperformula/blob/af2d59d/src/helpers/licenseKeyValidator.ts#L28)*

#### Type declaration:

* **template**: *[LicenseKeyValidityState](enums/licensekeyvaliditystate.md)*

* **vars**: *[TemplateVars](interfaces/templatevars.md)*

___

### NamedExpressionOptions 

Ƭ **NamedExpressionOptions**: *Record‹string, string | number | boolean›*

*Defined in [src/NamedExpressions.ts:22](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L22)*

___

### NoErrorCellValue 

Ƭ **NoErrorCellValue**: *number | string | boolean | null*

*Defined in [src/CellValue.ts:8](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CellValue.ts#L8)*

___

### RawCellContent 

Ƭ **RawCellContent**: *Date | string | number | boolean | null | undefined*

*Defined in [src/CellContentParser.ts:25](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CellContentParser.ts#L25)*

___

### Sheet 

Ƭ **Sheet**: *[RawCellContent](globals.md#rawcellcontent)[][]*

*Defined in [src/Sheet.ts:12](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Sheet.ts#L12)*

Two-dimenstional array representation of sheet

___

### SheetDimensions 

Ƭ **SheetDimensions**: *object*

*Defined in [src/Sheet.ts:19](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Sheet.ts#L19)*

Represents size of a sheet

#### Type declaration:

* **height**: *number*

* **width**: *number*

___

### SheetIndex 

Ƭ **SheetIndex**: *[ColumnMap](globals.md#columnmap)[]*

*Defined in [src/Lookup/ColumnIndex.ts:37](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnIndex.ts#L37)*

___

### Sheets 

Ƭ **Sheets**: *Record‹string, [Sheet](globals.md#sheet)›*

*Defined in [src/Sheet.ts:14](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Sheet.ts#L14)*

___

### SimpleDateTime 

Ƭ **SimpleDateTime**: *[SimpleDate](interfaces/simpledate.md) & [SimpleTime](interfaces/simpletime.md)*

*Defined in [src/DateTimeHelper.ts:29](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L29)*

___

### Span 

Ƭ **Span**: *[RowsSpan](classes/rowsspan.md) | [ColumnsSpan](classes/columnsspan.md)*

*Defined in [src/Span.ts:6](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Span.ts#L6)*

**`license`** 
Copyright (c) 2025 Handsoncode. All rights reserved.

___

### TranslatableErrorType 

Ƭ **TranslatableErrorType**: *Exclude‹[ErrorType](classes/hyperformulans.md#static-errortype), [LIC](enums/errortype.md#lic)›*

*Defined in [src/Cell.ts:51](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L51)*

## Variables

### DATE_SEPARATOR_REGEXP

• **DATE_SEPARATOR_REGEXP**: *RegExp‹›* = new RegExp('[ /.-]')

*Defined in [src/DateTimeDefault.ts:13](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeDefault.ts#L13)*

___

### HOURS_PER_DAY

• **HOURS_PER_DAY**: *24* = 24

*Defined in [src/DateTimeHelper.ts:15](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L15)*

___

### LCID_CURRENCY_TAG

• **LCID_CURRENCY_TAG**: *RegExp‹›* = /\[\$[^\-\]]+-/

*Defined in [src/format/format.ts:26](https://github.com/handsontable/hyperformula/blob/af2d59d/src/format/format.ts#L26)*

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

*Defined in [src/DateTimeHelper.ts:14](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L14)*

___

### NOT_FOUND

• **NOT_FOUND**: *-1* = -1

*Defined in [src/Lookup/AdvancedFind.ts:19](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/AdvancedFind.ts#L19)*

___

### QUICK_CHECK_REGEXP

• **QUICK_CHECK_REGEXP**: *RegExp‹›* = new RegExp('^[0-9/.\\-: ]+[ap]?m?$')

*Defined in [src/DateTimeDefault.ts:11](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeDefault.ts#L11)*

___

### SECONDS_PER_MINUTE

• **SECONDS_PER_MINUTE**: *60* = 60

*Defined in [src/DateTimeHelper.ts:13](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L13)*

___

### SECONDS_PRECISION

• **SECONDS_PRECISION**: *1000* = 1000

*Defined in [src/DateTimeDefault.ts:15](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeDefault.ts#L15)*

___

### TIME_FORMAT_SECONDS_ITEM_REGEXP

• **TIME_FORMAT_SECONDS_ITEM_REGEXP**: *RegExp‹›* = new RegExp('^ss(\\.(s+|0+))?$')

*Defined in [src/DateTimeDefault.ts:9](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeDefault.ts#L9)*

___

### TIME_SEPARATOR

• **TIME_SEPARATOR**: *":"* = ":"

*Defined in [src/DateTimeDefault.ts:14](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeDefault.ts#L14)*

___

### WHITESPACE_REGEXP

• **WHITESPACE_REGEXP**: *RegExp‹›* = new RegExp('\\s+')

*Defined in [src/DateTimeDefault.ts:12](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeDefault.ts#L12)*

___

### WRONG_RANGE_SIZE

• **WRONG_RANGE_SIZE**: *"AbsoluteCellRange: Wrong range size"* = "AbsoluteCellRange: Wrong range size"

*Defined in [src/AbsoluteCellRange.ts:22](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L22)*

___

### _notified

• **_notified**: *boolean* = false

*Defined in [src/helpers/licenseKeyValidator.ts:43](https://github.com/handsontable/hyperformula/blob/af2d59d/src/helpers/licenseKeyValidator.ts#L43)*

___

### _rl

• **_rl**: *"length"* = "length"

*Defined in [src/helpers/licenseKeyHelper.ts:9](https://github.com/handsontable/hyperformula/blob/af2d59d/src/helpers/licenseKeyHelper.ts#L9)*

**`license`** 
Copyright (c) 2025 Handsoncode. All rights reserved.

___

### dateFormatRegex

• **dateFormatRegex**: *RegExp‹›* = /(\\.|dd|DD|d|D|mm|MM|m|M|YYYY|YY|yyyy|yy|HH|hh|H|h|ss(\.(0+|s+))?|s|AM\/PM|am\/pm|A\/P|a\/p|\[mm]|\[MM]|\[hh]|\[HH])/g

*Defined in [src/format/parser.ts:8](https://github.com/handsontable/hyperformula/blob/af2d59d/src/format/parser.ts#L8)*

___

### defaultLanguage

• **defaultLanguage**: *string* = Config.defaultConfig.language

*Defined in [src/index.ts:108](https://github.com/handsontable/hyperformula/blob/af2d59d/src/index.ts#L108)*

___

### memoizedParseDateFormat

• **memoizedParseDateFormat**: *(Anonymous function)* = memoize(parseDateFormat)

*Defined in [src/DateTimeDefault.ts:17](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeDefault.ts#L17)*

___

### memoizedParseTimeFormat

• **memoizedParseTimeFormat**: *(Anonymous function)* = memoize(parseTimeFormat)

*Defined in [src/DateTimeDefault.ts:16](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeDefault.ts#L16)*

___

### numDays

• **numDays**: *number[]* = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

*Defined in [src/DateTimeHelper.ts:10](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L10)*

___

### numberFormatRegex

• **numberFormatRegex**: *RegExp‹›* = /(\\.|[#0]+(\.[#0]*)?)/g

*Defined in [src/format/parser.ts:9](https://github.com/handsontable/hyperformula/blob/af2d59d/src/format/parser.ts#L9)*

___

### prefSumDays

• **prefSumDays**: *number[]* = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

*Defined in [src/DateTimeHelper.ts:11](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L11)*

___

### privatePool

• **privatePool**: *WeakMap‹[Config](classes/config.md), object›* = new WeakMap()

*Defined in [src/Config.ts:27](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Config.ts#L27)*

## Functions

### CellValueTypeOrd

▸ **CellValueTypeOrd**(`arg`: [CellValueType](classes/hyperformulans.md#static-cellvaluetype)): *number*

*Defined in [src/Cell.ts:97](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L97)*

**Parameters:**

Name | Type |
------ | ------ |
`arg` | [CellValueType](classes/hyperformulans.md#static-cellvaluetype) |

**Returns:** *number*

___

### _cp

▸ **_cp**(`v`: any): *number*

*Defined in [src/helpers/licenseKeyHelper.ts:14](https://github.com/handsontable/hyperformula/blob/af2d59d/src/helpers/licenseKeyHelper.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`v` | any |

**Returns:** *number*

___

### _hd

▸ **_hd**(`v`: any): *number*

*Defined in [src/helpers/licenseKeyHelper.ts:10](https://github.com/handsontable/hyperformula/blob/af2d59d/src/helpers/licenseKeyHelper.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`v` | any |

**Returns:** *number*

___

### _nm

▸ **_nm**(`v`: any): *string*

*Defined in [src/helpers/licenseKeyHelper.ts:12](https://github.com/handsontable/hyperformula/blob/af2d59d/src/helpers/licenseKeyHelper.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`v` | any |

**Returns:** *string*

___

### _pi

▸ **_pi**(`v`: any): *number*

*Defined in [src/helpers/licenseKeyHelper.ts:11](https://github.com/handsontable/hyperformula/blob/af2d59d/src/helpers/licenseKeyHelper.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`v` | any |

**Returns:** *number*

___

### _ss

▸ **_ss**(`v`: any, `s`: any, `l`: any): *any*

*Defined in [src/helpers/licenseKeyHelper.ts:13](https://github.com/handsontable/hyperformula/blob/af2d59d/src/helpers/licenseKeyHelper.ts#L13)*

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

*Defined in [src/Cell.ts:222](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L222)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | AddressWithSheet |
`baseAddress` | [SimpleCellAddress](interfaces/simplecelladdress.md) |

**Returns:** *number*

___

### absolutizeDependencies

▸ **absolutizeDependencies**(`deps`: RelativeDependency[], `baseAddress`: [SimpleCellAddress](interfaces/simplecelladdress.md)): *[CellDependency](globals.md#celldependency)[]*

*Defined in [src/absolutizeDependencies.ts:17](https://github.com/handsontable/hyperformula/blob/af2d59d/src/absolutizeDependencies.ts#L17)*

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

*Defined in [src/Cell.ts:209](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L209)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleCellAddress](interfaces/simplecelladdress.md) |

**Returns:** *string*

___

### arraySizeForBinaryOp 

▸ **arraySizeForBinaryOp**(`leftArraySize`: [ArraySize](classes/arraysize.md), `rightArraySize`: [ArraySize](classes/arraysize.md)): *[ArraySize](classes/arraysize.md)*

*Defined in [src/ArraySize.ts:34](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArraySize.ts#L34)*

**Parameters:**

Name | Type |
------ | ------ |
`leftArraySize` | [ArraySize](classes/arraysize.md) |
`rightArraySize` | [ArraySize](classes/arraysize.md) |

**Returns:** *[ArraySize](classes/arraysize.md)*

___

### arraySizeForUnaryOp 

▸ **arraySizeForUnaryOp**(`arraySize`: [ArraySize](classes/arraysize.md)): *[ArraySize](classes/arraysize.md)*

*Defined in [src/ArraySize.ts:38](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArraySize.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`arraySize` | [ArraySize](classes/arraysize.md) |

**Returns:** *[ArraySize](classes/arraysize.md)*

___

### buildColumnSearchStrategy 

▸ **buildColumnSearchStrategy**(`dependencyGraph`: DependencyGraph, `config`: [Config](classes/config.md), `statistics`: [Statistics](classes/statistics.md)): *[ColumnSearchStrategy](interfaces/columnsearchstrategy.md)*

*Defined in [src/Lookup/SearchStrategy.ts:63](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/SearchStrategy.ts#L63)*

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

*Defined in [src/helpers/licenseKeyHelper.ts:20](https://github.com/handsontable/hyperformula/blob/af2d59d/src/helpers/licenseKeyHelper.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`v` | any |

**Returns:** *boolean*

___

### checkLicenseKeyValidity 

▸ **checkLicenseKeyValidity**(`licenseKey`: string): *[LicenseKeyValidityState](enums/licensekeyvaliditystate.md)*

*Defined in [src/helpers/licenseKeyValidator.ts:51](https://github.com/handsontable/hyperformula/blob/af2d59d/src/helpers/licenseKeyValidator.ts#L51)*

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

*Defined in [src/StringHelper.ts:8](https://github.com/handsontable/hyperformula/blob/af2d59d/src/StringHelper.ts#L8)*

**Parameters:**

Name | Type |
------ | ------ |
`config` | [Config](classes/config.md) |

**Returns:** *Collator*

___

### configCheckIfParametersNotInConflict 

▸ **configCheckIfParametersNotInConflict**(...`params`: object[]): *void*

*Defined in [src/ArgumentSanitization.ts:57](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArgumentSanitization.ts#L57)*

**Parameters:**

Name | Type |
------ | ------ |
`...params` | object[] |

**Returns:** *void*

___

### configValueFromParam 

▸ **configValueFromParam**(`inputValue`: any, `expectedType`: string | string[], `paramName`: [ConfigParamsList](globals.md#configparamslist)): *any*

*Defined in [src/ArgumentSanitization.ts:16](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArgumentSanitization.ts#L16)*

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

*Defined in [src/ArgumentSanitization.ts:47](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArgumentSanitization.ts#L47)*

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

*Defined in [src/format/format.ts:74](https://github.com/handsontable/hyperformula/blob/af2d59d/src/format/format.ts#L74)*

**Parameters:**

Name | Type |
------ | ------ |
`text` | string |
`char` | string |

**Returns:** *number*

___

### createTokens 

▸ **createTokens**(`regexTokens`: RegExpExecArray[], `str`: string): *[FormatToken](interfaces/formattoken.md)[]*

*Defined in [src/format/parser.ts:66](https://github.com/handsontable/hyperformula/blob/af2d59d/src/format/parser.ts#L66)*

**Parameters:**

Name | Type |
------ | ------ |
`regexTokens` | RegExpExecArray[] |
`str` | string |

**Returns:** *[FormatToken](interfaces/formattoken.md)[]*

___

### dayToMonth 

▸ **dayToMonth**(`dayOfYear`: number): *number*

*Defined in [src/DateTimeHelper.ts:270](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L270)*

**Parameters:**

Name | Type |
------ | ------ |
`dayOfYear` | number |

**Returns:** *number*

___

### defaultParseToDate 

▸ **defaultParseToDate**(`dateItems`: string[], `dateFormat`: [Maybe](globals.md#maybe)‹string›): *[Maybe](globals.md#maybe)‹[SimpleDate](interfaces/simpledate.md)›*

*Defined in [src/DateTimeDefault.ts:137](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeDefault.ts#L137)*

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

*Defined in [src/DateTimeDefault.ts:30](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeDefault.ts#L30)*

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

*Defined in [src/DateTimeDefault.ts:82](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeDefault.ts#L82)*

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

*Defined in [src/format/format.ts:328](https://github.com/handsontable/hyperformula/blob/af2d59d/src/format/format.ts#L328)*

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

*Defined in [src/format/format.ts:224](https://github.com/handsontable/hyperformula/blob/af2d59d/src/format/format.ts#L224)*

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

*Defined in [src/format/format.ts:132](https://github.com/handsontable/hyperformula/blob/af2d59d/src/format/format.ts#L132)*

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

*Defined in [src/NamedExpressions.ts:299](https://github.com/handsontable/hyperformula/blob/af2d59d/src/NamedExpressions.ts#L299)*

**Parameters:**

Name | Type |
------ | ------ |
`ast` | Ast |

**Returns:** *boolean*

___

### doesItLookLikeADateTimeQuickCheck 

▸ **doesItLookLikeADateTimeQuickCheck**(`text`: string): *boolean*

*Defined in [src/DateTimeDefault.ts:222](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeDefault.ts#L222)*

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

*Defined in [src/generatorUtils.ts:8](https://github.com/handsontable/hyperformula/blob/af2d59d/src/generatorUtils.ts#L8)*

**Type parameters:**

▪ **T**

**Returns:** *IterableIterator‹T›*

___

### equalSimpleCellAddress

▸ **equalSimpleCellAddress**(`left`: [SimpleCellAddress](interfaces/simplecelladdress.md), `right`: [SimpleCellAddress](interfaces/simplecelladdress.md)): *boolean*

*Defined in [src/Cell.ts:226](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L226)*

**Parameters:**

Name | Type |
------ | ------ |
`left` | [SimpleCellAddress](interfaces/simplecelladdress.md) |
`right` | [SimpleCellAddress](interfaces/simplecelladdress.md) |

**Returns:** *boolean*

___

### extractTime 

▸ **extractTime**(`v`: any): *number*

*Defined in [src/helpers/licenseKeyHelper.ts:16](https://github.com/handsontable/hyperformula/blob/af2d59d/src/helpers/licenseKeyHelper.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`v` | any |

**Returns:** *number*

___

### filterDependenciesOutOfScope

▸ **filterDependenciesOutOfScope**(`deps`: [CellDependency](globals.md#celldependency)[]): *[CellDependency](globals.md#celldependency)[]*

*Defined in [src/absolutizeDependencies.ts:21](https://github.com/handsontable/hyperformula/blob/af2d59d/src/absolutizeDependencies.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`deps` | [CellDependency](globals.md#celldependency)[] |

**Returns:** *[CellDependency](globals.md#celldependency)[]*

___

### findBoundaries 

▸ **findBoundaries**(`sheet`: [Sheet](globals.md#sheet)): *[SheetBoundaries](interfaces/sheetboundaries.md)*

*Defined in [src/Sheet.ts:49](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Sheet.ts#L49)*

Returns actual width, height and fill ratio of a sheet

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`sheet` | [Sheet](globals.md#sheet) | two-dimmensional array sheet representation  |

**Returns:** *[SheetBoundaries](interfaces/sheetboundaries.md)*

___

### findInOrderedArray 

▸ **findInOrderedArray**(`key`: number, `values`: number[], `handlingMisses`: "lowerBound" | "upperBound"): *number*

*Defined in [src/Lookup/ColumnIndex.ts:339](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Lookup/ColumnIndex.ts#L339)*

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

*Defined in [src/generatorUtils.ts:22](https://github.com/handsontable/hyperformula/blob/af2d59d/src/generatorUtils.ts#L22)*

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

*Defined in [src/format/format.ts:28](https://github.com/handsontable/hyperformula/blob/af2d59d/src/format/format.ts#L28)*

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

*Defined in [src/helpers/licenseKeyValidator.ts:91](https://github.com/handsontable/hyperformula/blob/af2d59d/src/helpers/licenseKeyValidator.ts#L91)*

Formats a Date instance to hard-coded format MMMM DD, YYYY.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`date` | Date | The date to format. |

**Returns:** *string*

___

### formatToken 

▸ **formatToken**(`type`: [TokenType](enums/tokentype.md), `value`: string): *[FormatToken](interfaces/formattoken.md)*

*Defined in [src/format/parser.ts:21](https://github.com/handsontable/hyperformula/blob/af2d59d/src/format/parser.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | [TokenType](enums/tokentype.md) |
`value` | string |

**Returns:** *[FormatToken](interfaces/formattoken.md)*

___

### getCellType

▸ **getCellType**(`vertex`: [Maybe](globals.md#maybe)‹CellVertex›, `address`: [SimpleCellAddress](interfaces/simplecelladdress.md)): *[CellType](classes/hyperformulans.md#static-celltype)*

*Defined in [src/Cell.ts:61](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L61)*

**Parameters:**

Name | Type |
------ | ------ |
`vertex` | [Maybe](globals.md#maybe)‹CellVertex› |
`address` | [SimpleCellAddress](interfaces/simplecelladdress.md) |

**Returns:** *[CellType](classes/hyperformulans.md#static-celltype)*

___

### getCellValueDetailedType

▸ **getCellValueDetailedType**(`cellValue`: InterpreterValue): *[CellValueDetailedType](classes/hyperformulans.md#static-cellvaluedetailedtype)*

*Defined in [src/Cell.ts:133](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L133)*

**Parameters:**

Name | Type |
------ | ------ |
`cellValue` | InterpreterValue |

**Returns:** *[CellValueDetailedType](classes/hyperformulans.md#static-cellvaluedetailedtype)*

___

### getCellValueFormat

▸ **getCellValueFormat**(`cellValue`: InterpreterValue): *string | undefined*

*Defined in [src/Cell.ts:141](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L141)*

**Parameters:**

Name | Type |
------ | ------ |
`cellValue` | InterpreterValue |

**Returns:** *string | undefined*

___

### getCellValueType

▸ **getCellValueType**(`cellValue`: InterpreterValue): *[CellValueType](classes/hyperformulans.md#static-cellvaluetype)*

*Defined in [src/Cell.ts:113](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L113)*

**Parameters:**

Name | Type |
------ | ------ |
`cellValue` | InterpreterValue |

**Returns:** *[CellValueType](classes/hyperformulans.md#static-cellvaluetype)*

___

### getDefaultConfig 

▸ **getDefaultConfig**(): *[ConfigParams](interfaces/configparams.md)*

*Defined in [src/Config.ts:354](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Config.ts#L354)*

**Returns:** *[ConfigParams](interfaces/configparams.md)*

___

### getFullConfigFromPartial 

▸ **getFullConfigFromPartial**(`partialConfig`: Partial‹[ConfigParams](interfaces/configparams.md)›): *[ConfigParams](interfaces/configparams.md)*

*Defined in [src/Config.ts:340](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Config.ts#L340)*

**Parameters:**

Name | Type |
------ | ------ |
`partialConfig` | Partial‹[ConfigParams](interfaces/configparams.md)› |

**Returns:** *[ConfigParams](interfaces/configparams.md)*

___

### instanceOfSimpleDate 

▸ **instanceOfSimpleDate**(`obj`: any): *obj is SimpleDate*

*Defined in [src/DateTimeHelper.ts:34](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L34)*

**Parameters:**

Name | Type |
------ | ------ |
`obj` | any |

**Returns:** *obj is SimpleDate*

___

### instanceOfSimpleTime 

▸ **instanceOfSimpleTime**(`obj`: any): *obj is SimpleTime*

*Defined in [src/DateTimeHelper.ts:43](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`obj` | any |

**Returns:** *obj is SimpleTime*

___

### invalidSimpleColumnAddress

▸ **invalidSimpleColumnAddress**(`address`: [SimpleColumnAddress](interfaces/simplecolumnaddress.md)): *boolean*

*Defined in [src/Cell.ts:190](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L190)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleColumnAddress](interfaces/simplecolumnaddress.md) |

**Returns:** *boolean*

___

### invalidSimpleRowAddress

▸ **invalidSimpleRowAddress**(`address`: [SimpleRowAddress](interfaces/simplerowaddress.md)): *boolean*

*Defined in [src/Cell.ts:181](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L181)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleRowAddress](interfaces/simplerowaddress.md) |

**Returns:** *boolean*

___

### isBoolean 

▸ **isBoolean**(`text`: string): *boolean*

*Defined in [src/CellContentParser.ts:81](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CellContentParser.ts#L81)*

**Parameters:**

Name | Type |
------ | ------ |
`text` | string |

**Returns:** *boolean*

___

### isColOrRowInvalid

▸ **isColOrRowInvalid**(`address`: [SimpleCellAddress](interfaces/simplecelladdress.md)): *boolean*

*Defined in [src/Cell.ts:203](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L203)*

Checks if the column or row id is negative.

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleCellAddress](interfaces/simplecelladdress.md) |

**Returns:** *boolean*

___

### isError 

▸ **isError**(`text`: string, `errorMapping`: Record‹string, [ErrorType](classes/hyperformulans.md#static-errortype)›): *boolean*

*Defined in [src/CellContentParser.ts:86](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CellContentParser.ts#L86)*

**Parameters:**

Name | Type |
------ | ------ |
`text` | string |
`errorMapping` | Record‹string, [ErrorType](classes/hyperformulans.md#static-errortype)› |

**Returns:** *boolean*

___

### isEscapeToken 

▸ **isEscapeToken**(`token`: RegExpExecArray): *boolean*

*Defined in [src/format/parser.ts:131](https://github.com/handsontable/hyperformula/blob/af2d59d/src/format/parser.ts#L131)*

**Parameters:**

Name | Type |
------ | ------ |
`token` | RegExpExecArray |

**Returns:** *boolean*

___

### isFormula 

▸ **isFormula**(`text`: string): *boolean*

*Defined in [src/CellContentParser.ts:77](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CellContentParser.ts#L77)*

Checks whether string looks like formula or not.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`text` | string | formula  |

**Returns:** *boolean*

___

### isNonnegativeInteger 

▸ **isNonnegativeInteger**(`x`: number): *boolean*

*Defined in [src/CrudOperations.ts:657](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L657)*

**Parameters:**

Name | Type |
------ | ------ |
`x` | number |

**Returns:** *boolean*

___

### isPositiveInteger 

▸ **isPositiveInteger**(`x`: number): *boolean*

*Defined in [src/CrudOperations.ts:653](https://github.com/handsontable/hyperformula/blob/af2d59d/src/CrudOperations.ts#L653)*

**Parameters:**

Name | Type |
------ | ------ |
`x` | number |

**Returns:** *boolean*

___

### isRowOrColumnRange 

▸ **isRowOrColumnRange**(`leftCorner`: [SimpleCellAddress](interfaces/simplecelladdress.md), `width`: number, `height`: number): *boolean*

*Defined in [src/Operations.ts:1100](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L1100)*

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

*Defined in [src/Cell.ts:214](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L214)*

Checks if the object is a simple cell address.

**Parameters:**

Name | Type |
------ | ------ |
`obj` | unknown |

**Returns:** *obj is SimpleCellAddress*

___

### isSimpleCellRange 

▸ **isSimpleCellRange**(`val`: unknown): *val is SimpleCellRange*

*Defined in [src/AbsoluteCellRange.ts:34](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L34)*

Type guard that checks if an object is a valid SimpleCellRange.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`val` | unknown | Value to check |

**Returns:** *val is SimpleCellRange*

True if and only if the object is a valid SimpleCellRange

___

### matchDateFormat 

▸ **matchDateFormat**(`str`: string): *RegExpExecArray[]*

*Defined in [src/format/parser.ts:39](https://github.com/handsontable/hyperformula/blob/af2d59d/src/format/parser.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *RegExpExecArray[]*

___

### matchNumberFormat 

▸ **matchNumberFormat**(`str`: string): *RegExpExecArray[]*

*Defined in [src/format/parser.ts:55](https://github.com/handsontable/hyperformula/blob/af2d59d/src/format/parser.ts#L55)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *RegExpExecArray[]*

___

### memoize 

▸ **memoize**‹**T**›(`fn`: function): *(Anonymous function)*

*Defined in [src/DateTimeDefault.ts:229](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeDefault.ts#L229)*

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

*Defined in [src/Cell.ts:205](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L205)*

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

*Defined in [src/Operations.ts:1068](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L1068)*

**Parameters:**

Name | Type |
------ | ------ |
`indexes` | [ColumnRowIndex](globals.md#columnrowindex)[] |

**Returns:** *[ColumnRowIndex](globals.md#columnrowindex)[]*

___

### normalizeRemovedIndexes 

▸ **normalizeRemovedIndexes**(`indexes`: [ColumnRowIndex](globals.md#columnrowindex)[]): *[ColumnRowIndex](globals.md#columnrowindex)[]*

*Defined in [src/Operations.ts:1037](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Operations.ts#L1037)*

**Parameters:**

Name | Type |
------ | ------ |
`indexes` | [ColumnRowIndex](globals.md#columnrowindex)[] |

**Returns:** *[ColumnRowIndex](globals.md#columnrowindex)[]*

___

### numberFormat 

▸ **numberFormat**(`tokens`: [FormatToken](interfaces/formattoken.md)[], `value`: number): *RawScalarValue*

*Defined in [src/format/format.ts:78](https://github.com/handsontable/hyperformula/blob/af2d59d/src/format/format.ts#L78)*

**Parameters:**

Name | Type |
------ | ------ |
`tokens` | [FormatToken](interfaces/formattoken.md)[] |
`value` | number |

**Returns:** *RawScalarValue*

___

### numberToSimpleTime 

▸ **numberToSimpleTime**(`arg`: number): *[SimpleTime](interfaces/simpletime.md)*

*Defined in [src/DateTimeHelper.ts:304](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L304)*

**Parameters:**

Name | Type |
------ | ------ |
`arg` | number |

**Returns:** *[SimpleTime](interfaces/simpletime.md)*

___

### objectDestroy 

▸ **objectDestroy**(`object`: any): *void*

*Defined in [src/Destroy.ts:6](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Destroy.ts#L6)*

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

*Defined in [src/DateTimeHelper.ts:286](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L286)*

**Parameters:**

Name | Type |
------ | ------ |
`date` | [SimpleDate](interfaces/simpledate.md) |
`offset` | number |

**Returns:** *[SimpleDate](interfaces/simpledate.md)*

___

### padLeft 

▸ **padLeft**(`number`: number | string, `size`: number): *string*

*Defined in [src/format/format.ts:58](https://github.com/handsontable/hyperformula/blob/af2d59d/src/format/format.ts#L58)*

**Parameters:**

Name | Type |
------ | ------ |
`number` | number &#124; string |
`size` | number |

**Returns:** *string*

___

### padRight 

▸ **padRight**(`number`: number | string, `size`: number): *string*

*Defined in [src/format/format.ts:66](https://github.com/handsontable/hyperformula/blob/af2d59d/src/format/format.ts#L66)*

**Parameters:**

Name | Type |
------ | ------ |
`number` | number &#124; string |
`size` | number |

**Returns:** *string*

___

### parse 

▸ **parse**(`str`: string): *[FormatExpression](interfaces/formatexpression.md)*

*Defined in [src/format/parser.ts:121](https://github.com/handsontable/hyperformula/blob/af2d59d/src/format/parser.ts#L121)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *[FormatExpression](interfaces/formatexpression.md)*

___

### parseDateFormat 

▸ **parseDateFormat**(`dateFormat`: string): *object*

*Defined in [src/DateTimeDefault.ts:206](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeDefault.ts#L206)*

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

*Defined in [src/format/parser.ts:96](https://github.com/handsontable/hyperformula/blob/af2d59d/src/format/parser.ts#L96)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *[Maybe](globals.md#maybe)‹[FormatExpression](interfaces/formatexpression.md)›*

___

### parseForNumberFormat 

▸ **parseForNumberFormat**(`str`: string): *[Maybe](globals.md#maybe)‹[FormatExpression](interfaces/formatexpression.md)›*

*Defined in [src/format/parser.ts:109](https://github.com/handsontable/hyperformula/blob/af2d59d/src/format/parser.ts#L109)*

**Parameters:**

Name | Type |
------ | ------ |
`str` | string |

**Returns:** *[Maybe](globals.md#maybe)‹[FormatExpression](interfaces/formatexpression.md)›*

___

### parseTimeFormat 

▸ **parseTimeFormat**(`timeFormat`: string): *object*

*Defined in [src/DateTimeDefault.ts:186](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeDefault.ts#L186)*

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

*Defined in [src/Destroy.ts:16](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Destroy.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`method` | any |

**Returns:** *(Anonymous function)*

___

### replacer 

▸ **replacer**(`key`: string, `val`: any): *any*

*Defined in [src/errors.ts:134](https://github.com/handsontable/hyperformula/blob/af2d59d/src/errors.ts#L134)*

**Parameters:**

Name | Type |
------ | ------ |
`key` | string |
`val` | any |

**Returns:** *any*

___

### roundToEpsilon 

▸ **roundToEpsilon**(`arg`: number, `epsilon`: number): *number*

*Defined in [src/DateTimeHelper.ts:299](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L299)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`arg` | number | - |
`epsilon` | number | 1 |

**Returns:** *number*

___

### roundToNearestSecond 

▸ **roundToNearestSecond**(`arg`: number): *number*

*Defined in [src/DateTimeHelper.ts:295](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L295)*

**Parameters:**

Name | Type |
------ | ------ |
`arg` | number |

**Returns:** *number*

___

### simpleCellAddress

▸ **simpleCellAddress**(`sheet`: number, `col`: number, `row`: number): *[SimpleCellAddress](interfaces/simplecelladdress.md)*

*Defined in [src/Cell.ts:198](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L198)*

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

*Defined in [src/AbsoluteCellRange.ts:43](https://github.com/handsontable/hyperformula/blob/af2d59d/src/AbsoluteCellRange.ts#L43)*

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

*Defined in [src/Cell.ts:188](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L188)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`col` | number |

**Returns:** *[SimpleColumnAddress](interfaces/simplecolumnaddress.md)*

___

### simpleRowAddress

▸ **simpleRowAddress**(`sheet`: number, `row`: number): *[SimpleRowAddress](interfaces/simplerowaddress.md)*

*Defined in [src/Cell.ts:179](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L179)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |
`row` | number |

**Returns:** *[SimpleRowAddress](interfaces/simplerowaddress.md)*

___

### split 

▸ **split**‹**T**›(`iterable`: IterableIterator‹T›): *object*

*Defined in [src/generatorUtils.ts:11](https://github.com/handsontable/hyperformula/blob/af2d59d/src/generatorUtils.ts#L11)*

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

### timeToNumber 

▸ **timeToNumber**(`time`: [SimpleTime](interfaces/simpletime.md)): *number*

*Defined in [src/DateTimeHelper.ts:315](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L315)*

**Parameters:**

Name | Type |
------ | ------ |
`time` | [SimpleTime](interfaces/simpletime.md) |

**Returns:** *number*

___

### toBasisEU 

▸ **toBasisEU**(`date`: [SimpleDate](interfaces/simpledate.md)): *[SimpleDate](interfaces/simpledate.md)*

*Defined in [src/DateTimeHelper.ts:319](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L319)*

**Parameters:**

Name | Type |
------ | ------ |
`date` | [SimpleDate](interfaces/simpledate.md) |

**Returns:** *[SimpleDate](interfaces/simpledate.md)*

___

### truncateDayInMonth 

▸ **truncateDayInMonth**(`date`: [SimpleDate](interfaces/simpledate.md)): *[SimpleDate](interfaces/simpledate.md)*

*Defined in [src/DateTimeHelper.ts:291](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L291)*

**Parameters:**

Name | Type |
------ | ------ |
`date` | [SimpleDate](interfaces/simpledate.md) |

**Returns:** *[SimpleDate](interfaces/simpledate.md)*

___

### validateArgToType 

▸ **validateArgToType**(`inputValue`: any, `expectedType`: string, `paramName`: string): *void*

*Defined in [src/ArgumentSanitization.ts:81](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArgumentSanitization.ts#L81)*

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

*Defined in [src/Sheet.ts:33](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Sheet.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | [Sheet](globals.md#sheet) |

**Returns:** *void*

___

### validateNumberToBeAtLeast 

▸ **validateNumberToBeAtLeast**(`value`: number, `paramName`: string, `minimum`: number): *void*

*Defined in [src/ArgumentSanitization.ts:34](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArgumentSanitization.ts#L34)*

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

*Defined in [src/ArgumentSanitization.ts:40](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ArgumentSanitization.ts#L40)*

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

*Defined in [src/Cell.ts:95](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L95)*

___

### CellValueType

### ▪ **CellValueType**: *object*

*Defined in [src/Cell.ts:92](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L92)*

___

### consoleMessages

### ▪ **consoleMessages**: *object*

*Defined in [src/helpers/licenseKeyValidator.ts:36](https://github.com/handsontable/hyperformula/blob/af2d59d/src/helpers/licenseKeyValidator.ts#L36)*

List of all not valid messages which may occur.

### expired 

▸ **expired**(`__namedParameters`: object): *string*

*Defined in [src/helpers/licenseKeyValidator.ts:38](https://github.com/handsontable/hyperformula/blob/af2d59d/src/helpers/licenseKeyValidator.ts#L38)*

**Parameters:**

▪ **__namedParameters**: *object*

Name | Type |
------ | ------ |
`keyValidityDate` | string |

**Returns:** *string*

### invalid 

▸ **invalid**(): *string*

*Defined in [src/helpers/licenseKeyValidator.ts:37](https://github.com/handsontable/hyperformula/blob/af2d59d/src/helpers/licenseKeyValidator.ts#L37)*

**Returns:** *string*

### missing 

▸ **missing**(): *string*

*Defined in [src/helpers/licenseKeyValidator.ts:40](https://github.com/handsontable/hyperformula/blob/af2d59d/src/helpers/licenseKeyValidator.ts#L40)*

**Returns:** *string*

___

### maxDate

### ▪ **maxDate**: *object*

*Defined in [src/DateTimeHelper.ts:51](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L51)*

### day 

• **day**: *number* = 31

*Defined in [src/DateTimeHelper.ts:51](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L51)*

### month 

• **month**: *number* = 12

*Defined in [src/DateTimeHelper.ts:51](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L51)*

### year 

• **year**: *number* = 9999

*Defined in [src/DateTimeHelper.ts:51](https://github.com/handsontable/hyperformula/blob/af2d59d/src/DateTimeHelper.ts#L51)*
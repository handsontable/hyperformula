# HyperFormula changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2025-01-14

### Added

- Added a new function: XLOOKUP. [#1458](https://github.com/handsontable/hyperformula/issues/1458)

### Changed

- **Breaking change**: Changed ES module build to use `mjs` files and `exports` property in `package.json` to make importing language files possible in Node environment. [#1344](https://github.com/handsontable/hyperformula/issues/1344)
- **Breaking change**: Changed the default value of the `precisionRounding` configuration option to `10`. [#1300](https://github.com/handsontable/hyperformula/issues/1300)
- Make methods `simpleCellAddressToString` and `simpleCellRangeToString` more logical and easier to use. [#1151](https://github.com/handsontable/hyperformula/issues/1151)

### Removed

- **Breaking change**: Removed the `binarySearchThreshold` configuration option. [#1439](https://github.com/handsontable/hyperformula/issues/1439)

## [2.7.1] - 2024-07-18

### Fixed

- Fixed an issue where adding or removing columns with `DenseStrategy` for address mapping resulted in the `Cannot read properties of undefined (reading 'splice')` error. [#1406](https://github.com/handsontable/hyperformula/issues/1406)

## [2.7.0] - 2024-04-10

### Added

- Added method `getNamedExpressionsFromFormula` to extract named expressions from formulas. [#1365](https://github.com/handsontable/hyperformula/issues/1365)
- Added `context` config option for passing data to custom functions. [#1396](https://github.com/handsontable/hyperformula/issues/1396)

## [2.6.2] - 2024-02-15

### Changed

- Removed `unorm` dependency. [#1370](https://github.com/handsontable/hyperformula/issues/1370)

## [2.6.1] - 2023-12-27

### Fixed

- Fixed an issue where operating on ranges of incompatible sizes resulted in a runtime exception. [#1267](https://github.com/handsontable/hyperformula/issues/1267)
- Fixed an issue where the `simpleCellAddressFromString()` method was crashing when called with a non-ASCII character in an unquoted sheet name. [#1312](https://github.com/handsontable/hyperformula/issues/1312)
- Fixed an issue where adding a row to a very large spreadsheet resulted in the `Maximum call stack size exceeded` error. [#1332](https://github.com/handsontable/hyperformula/issues/1332)
- Fixed an issue where using a column-range reference to an empty sheet as a function argument resulted in the `Incorrect array size` error. [#1147](https://github.com/handsontable/hyperformula/issues/1147)
- Fixed an issue where the SUBSTITUTE function wasn't working correctly with regex special characters. [#1289](https://github.com/handsontable/hyperformula/issues/1289)
- Fixed a typo in the JSDoc comment of the `HyperFormula` class. [#1323](https://github.com/handsontable/hyperformula/issues/1323)

## [2.6.0] - 2023-09-19

### Added

- Exported the `EmptyValue` symbol as a public API. This allows custom functions to handle empty cell
  values. [#1232](https://github.com/handsontable/hyperformula/issues/1265)

### Changed

- Improved the efficiency of the default date/time parsing
  methods. [#876](https://github.com/handsontable/hyperformula/issues/876)
- Improved the efficiency of the operations on the dependency
  graph. [#876](https://github.com/handsontable/hyperformula/issues/876)

### Fixed

- Fixed a bug where neighboring exported changes of an array formula were
  missing. [#1291](https://github.com/handsontable/hyperformula/issues/1291)
- Fixed a typo in the source code of the `MatrixPlugin`. [#1306](https://github.com/handsontable/hyperformula/issues/1306)

## [2.5.0] - 2023-05-29

### Added

- Added a new function: ADDRESS. [#1221](https://github.com/handsontable/hyperformula/issues/1221)
- Added a new function: HYPERLINK. [#1215](https://github.com/handsontable/hyperformula/issues/1215)
- Added a new function: IFS. [#1157](https://github.com/handsontable/hyperformula/issues/1157)

### Changed

- Optimized the `updateConfig()` method to rebuild HyperFormula only when the new configuration is different from the
  old one. [#1251](https://github.com/handsontable/hyperformula/issues/1251)

### Fixed

- Fixed the SEARCH function to be case-insensitive regardless of HyperFormula's
  configuration. [#1225](https://github.com/handsontable/hyperformula/issues/1225)

## [2.4.0] - 2023-04-24

### Added

- Exported the `CellError` class as a public API. [#1232](https://github.com/handsontable/hyperformula/issues/1232)
- Exported the `SimpleRangeValue` class as a public
  API. [#1178](https://github.com/handsontable/hyperformula/issues/1178)

### Fixed

- Fixed an `EmptyCellVertex` data integrity issue between the `AddressMapping` and `DependencyGraph`
  objects. [#1188](https://github.com/handsontable/hyperformula/issues/1188)
- Fixed a build issue with M1- and M2-chip MacBooks. [#1166](https://github.com/handsontable/hyperformula/issues/1166)
- Fixed an issue where the order of items returned by `removeColumns()` depended on the address mapping
  policy. [#1205](https://github.com/handsontable/hyperformula/issues/1205)

## [2.3.1] - 2023-03-03

### Fixed

- Fixed an issue where expression names were not allowed to start with a cell
  reference. [#1058](https://github.com/handsontable/hyperformula/issues/1058)
- Fixed an issue where expression names were allowed to start with R1C1-notation references. For better compatibility
  with other spreadsheet software, strings such as `R4C5`, `RC1000`, `R1C` or `RC` can't be used in expression names
  anymore. [#1058](https://github.com/handsontable/hyperformula/issues/1058)
- Fixed an issue where using reversed ranges with absolute addressing could cause the `Incorrect array size`
  error. [#1106](https://github.com/handsontable/hyperformula/issues/1106)
- Fixed an issue where removing a sheet (`removeSheet()`) without clearing it
  (`clearSheet()`) could cause an error. [#1121](https://github.com/handsontable/hyperformula/issues/1121)

## [2.3.0] - 2022-12-22

### Added

- Exported the `ArraySize` class as a public API. [#843](https://github.com/handsontable/hyperformula/issues/843)
- Renamed an internal interface from `ArgumentTypes` to `FunctionArgumentType`, and exported it as a public
  API. [#1108](https://github.com/handsontable/hyperformula/pull/1108)
- Exported `ImplementedFunctions` and `FunctionMetadata` as public
  APIs. [#1108](https://github.com/handsontable/hyperformula/pull/1108)

## [2.2.0] - 2022-11-17

### Added

- Added an American English (`enUS`) language pack. It's a convenience alias: it contains the same translations as the
  existing British English (`enGB`) language pack. [#1025](https://github.com/handsontable/hyperformula/issues/1025)

### Fixed

- Fixed functions VLOOKUP and HLOOKUP to handle duplicates in the way specified by
  the [OpenDocument](https://docs.oasis-open.org/office/OpenDocument/v1.3/os/part4-formula/OpenDocument-v1.3-os-part4-formula.html#HLOOKUP)
  standard. [#1072](https://github.com/handsontable/hyperformula/issues/1072)
- Fixed the MATCH function to handle descending ranges in the way specified by
  the [OpenDocument](https://docs.oasis-open.org/office/OpenDocument/v1.3/os/part4-formula/OpenDocument-v1.3-os-part4-formula.html#MATCH)
  standard. [#1063](https://github.com/handsontable/hyperformula/issues/1063)

## [2.1.0] - 2022-09-08

### Added

- Added two new functions: MAXIFS and MINIFS. [#1049](https://github.com/handsontable/hyperformula/issues/1049)

### Changed

- Changed the rounding strategy of the default time-parsing function to be independent of the `timeFormats`
  configuration option. Now, time values are always rounded to the nearest millisecond (0.001 s).
  [#953](https://github.com/handsontable/hyperformula/issues/953)

### Fixed

- Fixed a rounding issue that caused the TEXT function to incorrectly convert dates and times to
  strings. [#1043](https://github.com/handsontable/hyperformula/issues/1043)
- Fixed an issue where functions SUMIF, SUMIFS, COUNTIF, COUNTIFS, and AVERAGEIF incorrectly handled complex numeric
  values. [#951](https://github.com/handsontable/hyperformula/issues/951)

### Removed

- Removed all polyfills from the CommonJS build and the ES modules build. In the UMD build, kept only the polyfills
  required by the [supported browsers](https://hyperformula.handsontable.com/guide/supported-browsers.html).
  [#1011](https://github.com/handsontable/hyperformula/issues/1011)

## [2.0.1] - 2022-06-14

### Changed

- Changed the following npm scripts (used internally): `docs`, `docs:api`,
  `docs:dev`, `docs:build`, `coverage`, `typings:check`. [#977](https://github.com/handsontable/hyperformula/issues/977)

### Fixed

- Fixed an issue where it was impossible to add a custom function with no
  `parameters`. [#968](https://github.com/handsontable/hyperformula/issues/968)

## [2.0.0] - 2022-04-14

For more information on this release, see:

- [Release notes](https://hyperformula.handsontable.com/guide/release-notes.html)
- [Blog post](https://handsontable.com/blog/articles/2022/04/whats-new-in-hyperformula-2.0.0)
- [Migration guide](https://hyperformula.handsontable.com/guide/migration-from-1.0-to-2.0.html)

### Added

- Added support for reversed ranges. [#834](https://github.com/handsontable/hyperformula/issues/834)
- Added a new configuration option, `ignoreWhiteSpace`, which allows for parsing formulas that contain whitespace
  characters of any kind. [#898](https://github.com/handsontable/hyperformula/issues/898)

### Changed

- **Breaking change**: Removed the `gpu.js` dependency and its use, to speed up the installation
  time. [#812](https://github.com/handsontable/hyperformula/issues/812)
- **Breaking change**: Removed the deprecated `gpujs` and `gpuMode`
  configuration options. [#812](https://github.com/handsontable/hyperformula/issues/812)

### Fixed

- Fixed an issue where the RATE function didn't converge for some
  inputs. [#905](https://github.com/handsontable/hyperformula/issues/905)

## [1.3.1] - 2022-01-11

### Fixed

- Fixed an issue where warnings about deprecated configuration options were getting
  duplicated. [#882](https://github.com/handsontable/hyperformula/issues/882)

## [1.3.0] - 2021-10-20

### Added

- Added a new static property: `defaultConfig`. [#822](https://github.com/handsontable/hyperformula/issues/822)
- The `getFillRangeData()` method can now use one sheet for its source and another sheet for its
  target. [#836](https://github.com/handsontable/hyperformula/issues/836)

### Fixed

- Fixed the handling of Unicode characters and non-letter characters in the
  `PROPER` function. [#811](https://github.com/handsontable/hyperformula/issues/811)
- Fixed unnecessary warnings caused by deprecated configuration
  options. [#830](https://github.com/handsontable/hyperformula/issues/830)
- Fixed the `SUMPRODUCT` function. [#810](https://github.com/handsontable/hyperformula/issues/810)

## [1.2.0] - 2021-09-23

### Changed

- Removed `gpu.js` from optional dependencies and marked config options `gpujs`
  and `gpuMode` as deprecated.

## [1.1.0] - 2021-08-12

### Added

- Added support for the array arithmetic mode in the `calculateFormula()`
  method. [#782](https://github.com/handsontable/hyperformula/issues/782)
- Added a new `CellType` returned by `getCellType`: `CellType.ARRAYFORMULA`. It's assigned to the top-left corner of an
  array, and is recognized by the
  `isCellPartOfArray()` and `doesCellHaveFormula()`
  methods. [#781](https://github.com/handsontable/hyperformula/issues/781)

### Changed

- Deprecated the `binarySearchThreshold` configuration option, as every search of sorted data always uses binary
  search. [#791](https://github.com/handsontable/hyperformula/issues/791)

### Fixed

- Fixed an issue with searching sorted data. [#787](https://github.com/handsontable/hyperformula/issues/787)
- Fixed the `destroy` method to properly destroy HyperFormula
  instances. [#788](https://github.com/handsontable/hyperformula/issues/788)

## [1.0.0] - 2021-07-15

### Added

- Added support for array arithmetic. [#628](https://github.com/handsontable/hyperformula/issues/628)
- Added performance improvements for array handling. [#629](https://github.com/handsontable/hyperformula/issues/629)
- Added ARRAYFORMULA function. [#630](https://github.com/handsontable/hyperformula/issues/630)
- Added FILTER function. [#668](https://github.com/handsontable/hyperformula/issues/668)
- Added ARRAY_CONSTRAIN function. [#661](https://github.com/handsontable/hyperformula/issues/661)
- Added casting to scalars from non-range arrays. [#663](https://github.com/handsontable/hyperformula/issues/663)
- Added support for range interpolation. [#665](https://github.com/handsontable/hyperformula/issues/665)
- Added parsing of arrays in formulas (together with respective config options for separators).
  [#671](https://github.com/handsontable/hyperformula/issues/671)
- Added support for vectorization of scalar functions. [#673](https://github.com/handsontable/hyperformula/issues/673)
- Added support for time in JS `Date()` objects on the
  input. [#648](https://github.com/handsontable/hyperformula/issues/648)
- Added validation of API argument types for simple
  types. [#654](https://github.com/handsontable/hyperformula/issues/654)
- Added named expression handling to engine factories. [#680](https://github.com/handsontable/hyperformula/issues/680)
- Added `getAllNamedExpressionsSerialized` method. [#680](https://github.com/handsontable/hyperformula/issues/680)
- Added parsing of arrays in formulas (together with respective config options for separators).
  [#671](https://github.com/handsontable/hyperformula/issues/671)
- Added utility function for filling ranges with source from other
  range. [#678](https://github.com/handsontable/hyperformula/issues/678)
- Added pretty print for detailedCellError. [#712](https://github.com/handsontable/hyperformula/issues/712)
- Added `simpleCellRangeFromString` and `simpleCellRangeToString`
  helpers. [#720](https://github.com/handsontable/hyperformula/issues/720)
- Added `CellError` to exports. [#736](https://github.com/handsontable/hyperformula/issues/736)
- Added mapping policies to the exports: `AlwaysDense`, `AlwaysSparse`,
  `DenseSparseChooseBasedOnThreshold`. [#747](https://github.com/handsontable/hyperformula/issues/747)
- Added `#SPILL!` error type. [#708](https://github.com/handsontable/hyperformula/issues/708)
- Added large tests for CRUD interactions. [#755](https://github.com/handsontable/hyperformula/issues/755)
- Added support for array arithmetic in plugins. [#766](https://github.com/handsontable/hyperformula/issues/766)
- Added a flag to `getFillRangeData` to support different types of
  offsetting. [#767](https://github.com/handsontable/hyperformula/issues/767)

### Changed

- **Breaking change**: Changed API of many sheet-related methods to take sheetId instead of sheetName as an
  argument. [#645](https://github.com/handsontable/hyperformula/issues/645)
- **Breaking change**: Removed support for matrix formulas (`{=FORMULA}`)
  notation. Engine now supports formulas returning array of values (instead of only scalars).
  [#652](https://github.com/handsontable/hyperformula/issues/652)
- **Breaking change**: Removed numeric matrix detection along with matrixDetection and matrixDetectionThreshold config
  options. [#669](https://github.com/handsontable/hyperformula/issues/669)
- **Breaking change**: Changed API of the following methods to take
  `SimpleCellRange` type argument: `copy`, `cut`, `getCellDependents`,
  `getCellPrecedents`, `getFillRangeData`, `getRangeFormulas`,
  `getRangeSerialized`, `getRangeValues`, `isItPossibleToMoveCells`,
  `isItPossibleToSetCellContents`, `moveCells`. [#687](https://github.com/handsontable/hyperformula/issues/687)
- **Breaking change**: Changed the AGPLv3 license to GPLv3.
- **Breaking change**: Removed the free non-commercial license.
- **Breaking change**: Changed behaviour of `setCellContents` so that it is possible to override space occupied by
  spilled array. [#708](https://github.com/handsontable/hyperformula/issues/708)
- **Breaking change**: Changed behaviour of `addRows/removeRows` so that it is possible to add/remove rows across
  spilled array without changing array size. [#708](https://github.com/handsontable/hyperformula/issues/708)
- **Breaking change**: Changed behaviour of `addColumns/removeColumns` so that it is possible to add/remove columns
  across spilled array without changing array size. [#732](https://github.com/handsontable/hyperformula/issues/732)
- **Breaking change**: Changed config options [#747](https://github.com/handsontable/hyperformula/issues/747):

| before                | after                |
|-----------------------|----------------------|
| matrixColumnSeparator | arrayColumnSeparator |
| matrixRowSeparator    | arrayRowSeparator    |

- **Breaking change**: Changed CellType.MATRIX to
  CellType.ARRAY [#747](https://github.com/handsontable/hyperformula/issues/747)
- **Breaking change**: Changed API methods [#747](https://github.com/handsontable/hyperformula/issues/747):

| before             | after             |
|--------------------|-------------------|
| matrixMapping      | arrrayMapping     |
| isCellPartOfMatrix | isCellPartOfArray |

- **Breaking change**: Changed Exceptions [#747](https://github.com/handsontable/hyperformula/issues/747):

| before                       | after                       |
|------------------------------|-----------------------------|
| SourceLocationHasMatrixError | SourceLocationHasArrayError |
| TargetLocationHasMatrixError | TargetLocationHasArrayError |

- Changed SWITCH function, so it takes array as its first argument.
- Changed TRANSPOSE function, so it works with data of any
  type. [#708](https://github.com/handsontable/hyperformula/issues/708)
- Changed the way how we include `gpu.js` making it even more
  optional [#753](https://github.com/handsontable/hyperformula/issues/753)

### Fixed

- Fixed an issue with arrays and cruds. [#651](https://github.com/handsontable/hyperformula/issues/651)
- Fixed handling of arrays for ROWS/COLUMNS functions. [#677](https://github.com/handsontable/hyperformula/issues/677)
- Fixed an issue with nested named expressions. [#679](https://github.com/handsontable/hyperformula/issues/679)
- Fixed an issue with matrixDetection + number parsing. [#686](https://github.com/handsontable/hyperformula/issues/686)
- Fixed an issue with NOW and TODAY functions. [#709](https://github.com/handsontable/hyperformula/issues/709)
- Fixed an issue with MIN/MAX function caches. [#711](https://github.com/handsontable/hyperformula/issues/711)
- Fixed an issue with caching and order of evaluation. [#735](https://github.com/handsontable/hyperformula/issues/735)

## [0.6.2] - 2021-05-26

### Changed

- Modified a private field in one of the classes to ensure broader compatibility with older TypeScript
  versions. [#681](https://github.com/handsontable/hyperformula/issues/681)

## [0.6.1] - 2021-05-24

### Changed

- Remove redundant `'assert'` dependency from the code. [#672](https://github.com/handsontable/hyperformula/issues/672)

### Fixed

- Fixed library support for IE11. The `unorm` package is added to the
  dependencies. [#675](https://github.com/handsontable/hyperformula/issues/675)

## [0.6.0] - 2021-04-27

### Added

- Added two new fired events, for suspending and resuming
  execution. [#637](https://github.com/handsontable/hyperformula/issues/637)
- Added listing in scopes to `listNamedExpressions`
  method. [#638](https://github.com/handsontable/hyperformula/issues/638)

### Changed

- **Breaking change**: Moved `GPU.js` from `dependencies` to `devDependencies`
  and `optionalDependencies`. [#642](https://github.com/handsontable/hyperformula/issues/642)

### Fixed

- Fixed issues with scoped named
  expression. [#646](https://github.com/handsontable/hyperformula/issues/646) [#641](https://github.com/handsontable/hyperformula/issues/641)
- Fixed an issue with losing formating info about DateTime
  numbers. [#626](https://github.com/handsontable/hyperformula/issues/626)

## [0.5.0] - 2021-04-15

### Added

- Added support for row and column reordering. [#343](https://github.com/handsontable/hyperformula/issues/343)
- Added type inferrence for subtypes for number. [#313](https://github.com/handsontable/hyperformula/issues/313)
- Added parsing of number literals containing '%' or currency symbol (default
  '$'). [#590](https://github.com/handsontable/hyperformula/issues/590)
- Added ability to fallback to plain CPU implementation for functions that uses
  GPU.js [#355](https://github.com/handsontable/hyperformula/issues/355)

### Changed

- **Breaking change**: A change to the type of value returned via serialization
  methods. [#617](https://github.com/handsontable/hyperformula/issues/617)
- An input value should be preserved through serialization more
  precisely. [#617](https://github.com/handsontable/hyperformula/issues/617)
- GPU.js constructor needs to be provided directly to engine
  configuration. [#355](https://github.com/handsontable/hyperformula/issues/355)
- A deprecated config option vlookupThreshold has been
  removed. [#620](https://github.com/handsontable/hyperformula/issues/620)

### Fixed

- Fixed minor issue. [#631](https://github.com/handsontable/hyperformula/issues/631)
- Fixed a bug with serialization of some addresses after
  CRUDs. [#587](https://github.com/handsontable/hyperformula/issues/587)
- Fixed a bug with MEDIAN function implementation. [#601](https://github.com/handsontable/hyperformula/issues/601)
- Fixed a bug with copy-paste operation that could cause out of scope
  references [#591](https://github.com/handsontable/hyperformula/issues/591)
- Fixed a bug with date parsing. [#614](https://github.com/handsontable/hyperformula/issues/614)
- Fixed a bug where accent/case sensitivity was ignored for
  LOOKUPs. [#621](https://github.com/handsontable/hyperformula/issues/621)
- Fixed a bug with handling of no time format/no date format
  scenarios. [#616](https://github.com/handsontable/hyperformula/issues/616)

## [0.4.0] - 2020-12-17

### Added

- Added 50 mathematical functions: ROMAN, ARABIC, FACT, FACTDOUBLE, COMBIN, COMBINA, GCD, LCM, MROUND, MULTINOMIAL,
  QUOTIENT, RANDBETWEEN, SERIESSUM, SIGN, SQRTPI, SUMX2MY2, SUMX2PY2, SUMXMY2, CEILING.MATH, FLOOR.MATH, FLOOR,
  CEILING.PRECISE, FLOOR.PRECISE, ISO.CEILING, COMPLEX, IMABS, IMAGINARY, IMARGUMENT, IMCONJUGATE, IMCOS, IMCOSH, IMCOT,
  IMCSC, IMCSCH, IMDIV, IMEXP, IMLN, IMLOG10, IMLOG2, IMPOWER, IMPRODUCT, IMREAL, IMSEC, IMSECH, IMSIN, IMSINH, IMSQRT,
  IMSUB, IMSUM,
  IMTAN. [#537](https://github.com/handsontable/hyperformula/issues/537) [#582](https://github.com/handsontable/hyperformula/issues/582) [#281](https://github.com/handsontable/hyperformula/issues/281) [#581](https://github.com/handsontable/hyperformula/issues/581)
- Added 106 statistical functions: EXPON.DIST, EXPONDIST, FISHER, FISHERINV, GAMMA, GAMMA.DIST, GAMMADIST, GAMMALN,
  GAMMALN.PRECISE, GAMMA.INV, GAMMAINV, GAUSS, BETA.DIST, BETADIST, BETA.INV, BETAINV, BINOM.DIST, BINOMDIST, BINOM.INV,
  BESSELI, BESSELJ, BESSELK, BESSELY, CHISQ.DIST, CHISQ.DIST.RT, CHISQ.INV, CHISQ.INV.RT, CHIDIST, CHIINV, F.DIST,
  F.DIST.RT, F.INV, F.INV.RT, FDIST, FINV, WEIBULL, WEIBULL.DIST, HYPGEOMDIST, HYPGEOM.DIST, T.DIST, T.DIST.2T,
  T.DIST.RT, T.INV, T.INV.2T, TDIST, TINV, LOGNORM.DIST, LOGNORMDIST, LOGNORM.INV, LOGINV, NORM.DIST, NORMDIST,
  NORM.S.DIST, NORMSDIST, NORM.INV, NORMINV, NORM.S.INV, NORMSINV, PHI, NEGBINOM.DIST, NEGBINOMDIST, POISSON,
  POISSON.DIST, LARGE, SMALL, AVEDEV, CONFIDENCE, CONFIDENCE.NORM, CONFIDENCE.T, DEVSQ, GEOMEAN, HARMEAN, CRITBINOM,
  COVAR, COVARIANCE.P, COVARIANCE.S, PEARSON, RSQ, STANDARDIZE, Z.TEST, ZTEST, F.TEST, FTEST, STEYX, SLOPE, CHITEST,
  CHISQ.TEST, T.TEST, TTEST, SKEW.P, SKEW, WEIBULLDIST, VARS, TINV2T, TDISTRT, TDIST2T, STDEVS, FINVRT, FDISTRT,
  CHIDISTRT, CHIINVRT, COVARIANCEP, COVARIANCES, LOGNORMINV, POISSONDIST,
  SKEWP. [#152](https://github.com/handsontable/hyperformula/issues/152) [#154](https://github.com/handsontable/hyperformula/issues/154) [#160](https://github.com/handsontable/hyperformula/issues/160)
- Added function aliases mechanism. [#569](https://github.com/handsontable/hyperformula/issues/569)
- Added support for scientific notation. [#579](https://github.com/handsontable/hyperformula/issues/579)
- Added support for complex numbers. [#281](https://github.com/handsontable/hyperformula/issues/281)

### Changed

- A **breaking change**: CEILING function implementation to be consistent with existing
  implementations. [#582](https://github.com/handsontable/hyperformula/issues/582)

### Fixed

- Fixed a problem with dependencies not collected for specific
  functions. [#550](https://github.com/handsontable/hyperformula/issues/550) [#549](https://github.com/handsontable/hyperformula/issues/549)
- Fixed a minor problem with dependencies under nested
  parenthesis. [#549](https://github.com/handsontable/hyperformula/issues/549) [#558](https://github.com/handsontable/hyperformula/issues/558)
- Fixed a problem with HLOOKUP/VLOOKUP getting stuck in binary
  search. [#559](https://github.com/handsontable/hyperformula/issues/559) [#562](https://github.com/handsontable/hyperformula/issues/562)
- Fixed a problem with the logic of dependency
  resolving. [#561](https://github.com/handsontable/hyperformula/issues/561) [#563](https://github.com/handsontable/hyperformula/issues/563)
- Fixed a minor bug with ATAN2 function. [#581](https://github.com/handsontable/hyperformula/issues/581)

## [0.3.0] - 2020-10-22

### Added

- Added 9 text functions EXACT, LOWER, UPPER, MID, T, SUBSTITUTE, REPLACE, UNICODE,
  UNICHAR. [#159](https://github.com/handsontable/hyperformula/issues/159)
- Added 5 datetime functions: INTERVAL, NETWORKDAYS, NETWORKDAYS.INTL, WORKDAY,
  WORKDAY.INTL. [#153](https://github.com/handsontable/hyperformula/issues/153)
- Added 3 information functions HLOOKUP, ROW, COLUMN. [#520](https://github.com/handsontable/hyperformula/issues/520)
- Added 5 financial functions FVSCHEDULE, NPV, MIRR, PDURATION,
  XNPV. [#542](https://github.com/handsontable/hyperformula/issues/542)
- Added 12 statistical functions VAR.P, VAR.S, VARA, VARPA, STDEV.P, STDEV.S, STDEVA, STDEVPA, VARP, VAR, STDEVP,
  STDEV. [#536](https://github.com/handsontable/hyperformula/issues/536)
- Added 2 mathematical functions SUBTOTAL, PRODUCT. [#536](https://github.com/handsontable/hyperformula/issues/536)
- Added 15 operator functions HF.ADD, HF.CONCAT, HF.DIVIDE, HF.EQ, HF.GT, HF.GTE, HF.LT, HF.LTE, HF.MINUS, HF.MULTIPLY,
  HF.NE, HF.POW, HF.UMINUS, HF.UNARY_PERCENT, HF.UPLUS. [#543](https://github.com/handsontable/hyperformula/issues/543)

### Fixed

- Fixed multiple issues with VLOOKUP
  function. [#526](https://github.com/handsontable/hyperformula/issues/526) [#528](https://github.com/handsontable/hyperformula/issues/528)
- Fixed MATCH and INDEX functions compatiblity. [#520](https://github.com/handsontable/hyperformula/issues/520)
- Fixed issue with config update that does not preserve named
  expressions. [#527](https://github.com/handsontable/hyperformula/issues/527)
- Fixed minor issue with arithmetic operations error
  messages. [#532](https://github.com/handsontable/hyperformula/issues/532)

## [0.2.0] - 2020-09-22

### Added

- Added 9 text functions LEN, TRIM, PROPER, CLEAN, REPT, RIGHT, LEFT, SEARCH,
  FIND. [#221](https://github.com/handsontable/hyperformula/issues/221)
- Added helper methods for keeping track of cell/range dependencies:
  `getCellPrecedents` and `getCellDependents`. [#441](https://github.com/handsontable/hyperformula/issues/441)
- Added 22 financial functions FV, PMT, PPMT, IPMT, CUMIPMT, CUMPRINC, DB, DDB, DOLLARDE, DOLLARFR, EFFECT, ISPMT,
  NOMINAL, NPER, RATE, PV, RRI, SLN, SYD, TBILLEQ, TBILLPRICE,
  TBILLYIELD. [#494](https://github.com/handsontable/hyperformula/issues/494)
- Added FORMULATEXT function. [#422](https://github.com/handsontable/hyperformula/issues/422)
- Added 8 information functions ISERR, ISNA, ISREF, NA, SHEET, SHEETS, ISBINARY,
  ISFORMULA. [#481](https://github.com/handsontable/hyperformula/issues/481)
- Added 15 date functions: WEEKDAY, DATEVALUE, HOUR, MINUTE, SECOND, TIME, TIMEVALUE, NOW, TODAY, EDATE, WEEKNUM,
  ISOWEEKNUM, DATEDIF, DAYS360, YEARFRAC. [#483](https://github.com/handsontable/hyperformula/issues/483)
- Added 13 trigonometry functions: SEC, CSC, SINH, COSH, TANH, COTH, SECH, CSCH, ACOT, ASINH, ACOSH, ATANH,
  ACOTH. [#485](https://github.com/handsontable/hyperformula/issues/485)
- Added 6 engineering functions: OCT2BIN, OCT2DEC, OCT2HEX, HEX2BIN, HEX2OCT,
  HEX2DEC. [#497](https://github.com/handsontable/hyperformula/issues/497)
- Added a configuration option to evaluate reference to an empty cells as a
  zero. [#476](https://github.com/handsontable/hyperformula/issues/476)
- Added new error type: missing licence. [#306](https://github.com/handsontable/hyperformula/issues/306)
- Added detailed error messages for error values. [#506](https://github.com/handsontable/hyperformula/issues/506)
- Added ability to handle more characters in quoted sheet
  names. [#509](https://github.com/handsontable/hyperformula/issues/509)
- Added support for escaping apostrophe character in quoted sheet
  names. [#64](https://github.com/handsontable/hyperformula/issues/64)

### Changed

- Operation `moveCells` creating cyclic dependencies does not cause losing original
  formula. [#479](https://github.com/handsontable/hyperformula/issues/479)
- Simplified adding new function modules, reworked (simplified) implementations of existing
  modules. [#480](https://github.com/handsontable/hyperformula/issues/480)

### Fixed

- Fixed hardcoding of languages in i18n tests. [#471](https://github.com/handsontable/hyperformula/issues/471)
- Fixed many compilation warnings based on LGTM
  analysis. [#473](https://github.com/handsontable/hyperformula/issues/473)
- Fixed `moveCells` behaviour when moving part of a
  range. [#479](https://github.com/handsontable/hyperformula/issues/479)
- Fixed `moveColumns`/`moveRows` inconsistent behaviour. [#479](https://github.com/handsontable/hyperformula/issues/479)
- Fixed undo of `moveColumns`/`moveRows` operations. [#479](https://github.com/handsontable/hyperformula/issues/479)
- Fixed name-collision issue in translations. [#486](https://github.com/handsontable/hyperformula/issues/486)
- Fixed bug in concatenation + `nullValue`. [#495](https://github.com/handsontable/hyperformula/issues/495)
- Fixed bug when undoing irreversible operation. [#502](https://github.com/handsontable/hyperformula/issues/502)
- Fixed minor issue with CHAR function logic. [#510](https://github.com/handsontable/hyperformula/issues/510)
- Fixed `simpleCellAddressToString` behaviour when converting quoted sheet
  names. [#514](https://github.com/handsontable/hyperformula/issues/514)
- Fixed issues with numeric aggregation functions. [#515](https://github.com/handsontable/hyperformula/issues/515)

## [0.1.3] - 2020-07-21

### Fixed

- Fixed a bug in coercion of empty string to boolean
  value. [#453](https://github.com/handsontable/hyperformula/issues/453)

## [0.1.2] - 2020-07-13

### Fixed

- Fixed a bug in topological ordering module. [#442](https://github.com/handsontable/hyperformula/issues/442)

## [0.1.1] - 2020-07-01

### Fixed

- Fixed a typo in a config option from `useRegularExpresssions` to
  `useRegularExpressions`. [#437](https://github.com/handsontable/hyperformula/issues/437)

## [0.1.0] - 2020-06-25

### Added

- Core functionality of the engine;
- Support for data types: String, Error, Number, Date, Time, DateTime, Duration, Distinct Logical;
- Support for logical operators: =, <>, >, <, >=, <=;
- Support for arithmetic operators: +, -, \*, /, %;
- Support for text operator: &;
- CRUD operations:
  - modifying the value of a single cell,
  - adding/deleting row/column,
  - reading the value or formula from the selected cell,
  - moving a cell or a block of cells,
  - deleting a subset of rows or columns,
  - recalculating and refreshing of a worksheet,
  - batching CRUD operations,
  - support for wildcards and regex inside criterion functions like SUMIF, COUNTIF,
  - named expressions support,
  - support for cut, copy, paste,
  - undo/redo support;
- Following functions: ABS(), ACOS(), AND(), ASIN(), ATAN(), ATAN2(), AVERAGE(), AVERAGEA(), AVERAGEIF(), BASE(),
  BIN2DEC(), BIN2HEX()BIN2OCT(), BITAND(), BITLSHIFT(), BITOR(), BITRSHIFT(), BITXOR(), CEILING(), CHAR(), CHOOSE(),
  CODE(), COLUMNS(), CONCATENATE(), CORREL(), COS(), COT(), COUNT(), COUNTA(), COUNTBLANK(), COUNTIF(), COUNTIFS(),
  COUNTUNIQUE(), DATE(), DAY(), DAYS(), DEC2BIN(), DEC2HEX(), DEC2OCT(), DECIMAL(), DEGREES(), DELTA(), E(), EOMONTH(),
  ERF(), ERFC(), EVEN(), EXP(), FALSE(), IF(), IFERROR(), IFNA(), INDEX(), INT(), ISBLANK(), ISERROR(), ISEVEN(),
  ISLOGICAL(), ISNONTEXT(), ISNUMBER(), ISODD(), ISTEXT(), LN(), LOG(), LOG10(), MATCH(), MAX(), MAXA(), MAXPOOL(),
  MEDIAN(), MEDIANPOOL(), MIN(), MINA(), MMULT(), MOD(), MONTH(), NOT(), ODD(), OFFSET(), OR(), PI(), POWER(), RADIANS()
  , RAND(), ROUND(), ROUNDDOWN(), ROUNDUP(), ROWS(), SIN(), SPLIT(), SQRT(), SUM(), SUMIF(), SUMIFS(), SUMPRODUCT(),
  SUMSQ(), SWITCH(), TAN(), TEXT(), TRANSPOSE(), TRUE(), TRUNC(), VLOOKUP(), XOR(), YEAR();
- Support for volatile functions;
- Cultures supports - can be configured according to the application need;
- Custom functions support;
- Set http://docs.oasis-open.org/office/v1.2/OpenDocument-v1.2-part2.html as a standard to follow;
- Error handling:
  - Division by zero: #DIV/0!,
  - Unknown function name: #NAME?,
  - Wrong type of argument in a function or wrong type of operator: #VALUE!,
  - Invalid numeric values: #NUM!,
  - No value available: #N/A,
  - Cyclic dependency: #CYCLE!,
  - Wrong address reference: #REF;
- Built-in function translation support for 16 languages: English, Czech, Danish, Dutch, Finnish, French, German,
  Hungarian, Italian, Norwegian, Polish, Portuguese, Russian, Spanish, Swedish, Turkish.

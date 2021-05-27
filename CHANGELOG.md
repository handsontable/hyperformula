# HyperFormula changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.2] - 2021-05-26

### Changed
- Modified a private field in one of the classes to ensure broader compatibility with older TypeScript versions. (#681)

## [0.6.1] - 2021-05-24

### Changed
- Remove redundant `'assert'` dependency from the code. (#672)

### Fixed
- Fixed library support for IE11. The `unorm` package is added to the dependencies. (#675)

## [0.6.0] - 2021-04-27

### Changed
- **Breaking change**: Moved `GPU.js` from `dependencies` to `devDependencies` and `optionalDependencies`. (#642)

### Added
- Added two new fired events, for suspending and resuming execution. (#637)
- Added listing in scopes to `listNamedExpressions` method. (#638)

### Fixed
- Fixed issues with scoped named expression. (#646, #641)
- Fixed an issue with losing formating info about DateTime numbers. (#626)

## [0.5.0] - 2021-04-15

### Changed
- **Breaking change**: A change to the type of value returned via serialization methods. (#617)
- An input value should be preserved through serialization more precisely. (#617)
- GPU.js constructor needs to be provided directly to engine configuration. (#355)
- A deprecated config option vlookupThreshold has been removed. (#620)

### Added
- Added support for row and column reordering. (#343)
- Added type inferrence for subtypes for number. (#313)
- Added parsing of number literals containing '%' or currency symbol (default '$'). (#590)
- Added ability to fallback to plain CPU implementation for functions that uses GPU.js (#355)

### Fixed
- Fixed minor issue. (#631)
- Fixed a bug with serialization of some addresses after CRUDs. (#587)
- Fixed a bug with MEDIAN function implementation. (#601)
- Fixed a bug with copy-paste operation that could cause out of scope references (#591)
- Fixed a bug with date parsing. (#614)
- Fixed a bug where accent/case sensitivity was ignored for LOOKUPs. (#621)
- Fixed a bug with handling of no time format/no date format scenarios. (#616)

## [0.4.0] - 2020-12-17

### Changed
- A **breaking change**: CEILING function implementation to be consistent with existing implementations. (#582)

### Added
- Added 50 mathematical functions: ROMAN, ARABIC, FACT, FACTDOUBLE, COMBIN, COMBINA, GCD, LCM, MROUND, MULTINOMIAL, QUOTIENT, RANDBETWEEN, SERIESSUM, SIGN, SQRTPI, SUMX2MY2, SUMX2PY2, SUMXMY2, CEILING.MATH, FLOOR.MATH, FLOOR, CEILING.PRECISE, FLOOR.PRECISE, ISO.CEILING, COMPLEX, IMABS, IMAGINARY, IMARGUMENT, IMCONJUGATE, IMCOS, IMCOSH, IMCOT, IMCSC, IMCSCH, IMDIV, IMEXP, IMLN, IMLOG10, IMLOG2, IMPOWER, IMPRODUCT, IMREAL, IMSEC, IMSECH, IMSIN, IMSINH, IMSQRT, IMSUB,  IMSUM, IMTAN. (#537, #582, #281, #581)
- Added 106 statistical functions: EXPON.DIST, EXPONDIST, FISHER, FISHERINV, GAMMA, GAMMA.DIST, GAMMADIST, GAMMALN, GAMMALN.PRECISE, GAMMA.INV, GAMMAINV, GAUSS, BETA.DIST, BETADIST, BETA.INV, BETAINV, BINOM.DIST, BINOMDIST, BINOM.INV, BESSELI, BESSELJ, BESSELK, BESSELY, CHISQ.DIST, CHISQ.DIST.RT, CHISQ.INV, CHISQ.INV.RT, CHIDIST, CHIINV, F.DIST, F.DIST.RT, F.INV, F.INV.RT, FDIST, FINV, WEIBULL, WEIBULL.DIST, HYPGEOMDIST, HYPGEOM.DIST, T.DIST, T.DIST.2T, T.DIST.RT, T.INV, T.INV.2T, TDIST, TINV, LOGNORM.DIST, LOGNORMDIST, LOGNORM.INV, LOGINV, NORM.DIST, NORMDIST, NORM.S.DIST, NORMSDIST, NORM.INV, NORMINV, NORM.S.INV, NORMSINV, PHI, NEGBINOM.DIST, NEGBINOMDIST, POISSON, POISSON.DIST, LARGE, SMALL, AVEDEV, CONFIDENCE, CONFIDENCE.NORM, CONFIDENCE.T, DEVSQ, GEOMEAN, HARMEAN, CRITBINOM, COVAR, COVARIANCE.P, COVARIANCE.S, PEARSON, RSQ, STANDARDIZE, Z.TEST, ZTEST, F.TEST, FTEST, STEYX, SLOPE, CHITEST, CHISQ.TEST, T.TEST, TTEST, SKEW.P, SKEW, WEIBULLDIST, VARS, TINV2T, TDISTRT, TDIST2T, STDEVS, FINVRT, FDISTRT, CHIDISTRT, CHIINVRT, COVARIANCEP, COVARIANCES, LOGNORMINV, POISSONDIST, SKEWP. (#152, #154, #160)
- Added function aliases mechanism. (PR #569)
- Added support for scientific notation. (#579)
- Added support for complex numbers. (#281)

### Fixed
- Fixed a problem with dependencies not collected for specific functions. (#550, #549)
- Fixed a minor problem with dependencies under nested parenthesis. (#549, #558)
- Fixed a problem with HLOOKUP/VLOOKUP getting stuck in binary search. (#559, #562)
- Fixed a problem with the logic of dependency resolving. (#561, #563)
- Fixed a minor bug with ATAN2 function. (#581)

## [0.3.0] - 2020-10-22

### Added
- Added 9 text functions EXACT, LOWER, UPPER, MID, T, SUBSTITUTE, REPLACE, UNICODE, UNICHAR. (#159)
- Added 5 datetime functions: INTERVAL, NETWORKDAYS, NETWORKDAYS.INTL, WORKDAY, WORKDAY.INTL. (#153)
- Added 3 information functions HLOOKUP, ROW, COLUMN. (PR #520)
- Added 5 financial functions FVSCHEDULE, NPV, MIRR, PDURATION, XNPV. (PR #542)
- Added 12 statistical functions VAR.P, VAR.S, VARA, VARPA, STDEV.P, STDEV.S, STDEVA, STDEVPA, VARP, VAR, STDEVP, STDEV. (PR #536)
- Added 2 mathematical functions SUBTOTAL, PRODUCT. (PR #536)
- Added 15 operator functions HF.ADD, HF.CONCAT, HF.DIVIDE, HF.EQ, HF.GT, HF.GTE, HF.LT, HF.LTE, HF.MINUS, HF.MULTIPLY, HF.NE, HF.POW, HF.UMINUS, HF.UNARY_PERCENT, HF.UPLUS (PR #543).

### Fixed
- Fixed multiple issues with VLOOKUP function. (#526, #528)
- Fixed MATCH and INDEX functions compatiblity. (PR #520)
- Fixed issue with config update that does not preserve named expressions. (#527)
- Fixed minor issue with arithmetic operations error messages. (#532)

## [0.2.0] - 2020-09-22

### Added
- Added 9 text functions LEN, TRIM, PROPER, CLEAN, REPT, RIGHT, LEFT, SEARCH, FIND. (#221)
- Added helper methods for keeping track of cell/range dependencies: `getCellPrecedents` and `getCellDependents`. (#441)
- Added 22 financial functions FV, PMT, PPMT, IPMT, CUMIPMT, CUMPRINC, DB, DDB, DOLLARDE, DOLLARFR, EFFECT, ISPMT, NOMINAL, NPER, RATE, PV, RRI, SLN, SYD, TBILLEQ, TBILLPRICE, TBILLYIELD. (#494)
- Added FORMULATEXT function. (PR #422)
- Added 8 information functions ISERR, ISNA, ISREF, NA, SHEET, SHEETS, ISBINARY, ISFORMULA. (#481)
- Added 15 date functions: WEEKDAY, DATEVALUE, HOUR, MINUTE, SECOND, TIME, TIMEVALUE, NOW, TODAY, EDATE, WEEKNUM, ISOWEEKNUM, DATEDIF, DAYS360, YEARFRAC. (#483)
- Added 13 trigonometry functions: SEC, CSC, SINH, COSH, TANH, COTH, SECH, CSCH, ACOT, ASINH, ACOSH, ATANH, ACOTH. (#485)
- Added 6 engineering functions: OCT2BIN, OCT2DEC, OCT2HEX, HEX2BIN, HEX2OCT, HEX2DEC. (#497)
- Added a configuration option to evaluate reference to an empty cells as a zero. (#476)
- Added new error type: missing licence. (#306)
- Added detailed error messages for error values. (#506)
- Added ability to handle more characters in quoted sheet names. (#509)
- Added support for escaping apostrophe character in quoted sheet names. (#64)

### Changed
- Operation `moveCells` creating cyclic dependencies does not cause losing original formula. (#479)
- Simplified adding new function modules, reworked (simplified) implementations of existing modules. (#480)

### Fixed
- Fixed hardcoding of languages in i18n tests. (#471)
- Fixed many compilation warnings based on LGTM analysis. (#473)
- Fixed `moveCells` behaviour when moving part of a range. (#479)
- Fixed `moveColumns`/`moveRows` inconsistent behaviour. (#479)
- Fixed undo of `moveColumns`/`moveRows` operations. (#479)
- Fixed name-collision issue in translations. (#486)
- Fixed bug in concatenation + `nullValue`. (#495)
- Fixed bug when undoing irreversible operation. (#502)
- Fixed minor issue with CHAR function logic. (#510)
- Fixed `simpleCellAddressToString` behaviour when converting quoted sheet names. (#514)
- Fixed issues with numeric aggregation functions. (#515)

## [0.1.3] - 2020-07-21

### Fixed
- Fixed a bug in coercion of empty string to boolean value. (#453)

## [0.1.2] - 2020-07-13

### Fixed
- Fixed a bug in topological ordering module. (#442)

## [0.1.1] - 2020-07-01

### Fixed
- Fixed a typo in a config option from `useRegularExpresssions` to `useRegularExpressions`. (#437)

## [0.1.0] - 2020-06-25

### Added
- Core functionality of the engine;
- Support for data types: String, Error, Number, Date, Time, DateTime, Duration, Distinct Logical;
- Support for logical operators: =, <>, >, <, >=, <=;
- Support for arithmetic operators: +, -, *, /, %;
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
- Following functions: ABS(), ACOS(), AND(), ASIN(), ATAN(), ATAN2(), AVERAGE(), AVERAGEA(), AVERAGEIF(), BASE(), BIN2DEC(), BIN2HEX()BIN2OCT(), BITAND(), BITLSHIFT(), BITOR(), BITRSHIFT(), BITXOR(), CEILING(), CHAR(), CHOOSE(), CODE(), COLUMNS(), CONCATENATE(), CORREL(),
COS(), COT(), COUNT(), COUNTA(), COUNTBLANK(), COUNTIF(), COUNTIFS(), COUNTUNIQUE(), DATE(), DAY(), DAYS(), DEC2BIN(), DEC2HEX(), DEC2OCT(), DECIMAL(), DEGREES(), DELTA(), E(), EOMONTH(), ERF(), ERFC(), EVEN(), EXP(), FALSE(), IF(), IFERROR(), IFNA(), INDEX(), INT(), ISBLANK(), ISERROR(), ISEVEN(), ISLOGICAL(), ISNONTEXT(), ISNUMBER(), ISODD(), ISTEXT(), LN(), LOG(), LOG10(), MATCH(), MAX(), MAXA(), MAXPOOL(), MEDIAN(), MEDIANPOOL(), MIN(), MINA(), MMULT(), MOD(), MONTH(), NOT(), ODD(), OFFSET(), OR(), PI(), POWER(), RADIANS(), RAND(), ROUND(), ROUNDDOWN(), ROUNDUP(), ROWS(), SIN(), SPLIT(), SQRT(), SUM(), SUMIF(), SUMIFS(), SUMPRODUCT(), SUMSQ(), SWITCH(), TAN(), TEXT(), TRANSPOSE(), TRUE(), TRUNC(), VLOOKUP(), XOR(), YEAR();
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
- Built-in function translation support for 16 languages: English, Czech, Danish, Dutch, Finnish, French, German, Hungarian, Italian, Norwegian, Polish, Portuguese, Russian, Spanish, Swedish, Turkish.

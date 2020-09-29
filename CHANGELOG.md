# HyperFormula changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Added 9 text functions EXACT, LOWER, UPPER, MID, T, SUBSTITUTE, REPLACE, UNICODE, UNICHAR. (#159)
- Added 5 datetime functions: INTERVAL, NETWORKDAYS, NETWORKDAYS.INTL, WORKDAY, WORKDAY.INTL.

### Fixed
- Fixed minor issue with arithmetic operations error messages. (#532)

## [0.2.0] - 2020-09-22

### Added
- Added 9 text functions LEN, TRIM, PROPER, CLEAN, REPT, RIGHT, LEFT, SEARCH, FIND. (#221)
- Added helper methods for keeping track of cell/range dependencies: `getCellPrecedents` and `getCellDependents`. (#441)
- Added 22 financial functions FV, PMT, PPMT, IPMT, CUMIPMT, CUMPRINC, DB, DDB, DOLLARDE, DOLLARFR, EFFECT, ISPMT, NOMINAL, NPER, RATE, PV, RRI, SLN, SYD, TBILLEQ, TBILLPRICE, TBILLYIELD. (#494)
- Added FORMULATEXT function. (PR #422)
- Added 8 information functions ISERR, ISNA, ISREF, NA, SHEET, SHEETS, ISBINARY, ISFORMULA. (#481)
- Added 15 datetime functions: WEEKDAY, DATEVALUE, HOUR, MINUTE, SECOND, TIME, TIMEVALUE, NOW, TODAY, EDATE, WEEKNUM, ISOWEEKNUM, DATEDIF, DAYS360, YEARFRAC. (#483)
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
- Built-in function translations support for 16 languages: English, Czech, Danish, Dutch, Finnish, French, German, Hungarian, Italian, Norwegian, Polish, Portuguese, Russian, Spanish, Swedish, Turkish.
